import {supabase} from '@/services/supabase';
import type {LessonPrerequisite, UnlockStatus} from '@/types/content';

/**
 * Load prerequisites for a specific lesson
 */
export async function loadLessonPrerequisites(
  lessonId: string,
): Promise<LessonPrerequisite[]> {
  const {data, error} = await supabase
    .from('lesson_prerequisites' as any) // Cast to any until schema is updated
    .select(
      `
      *,
      prerequisiteLesson:lessons!prerequisite_lesson_id(*)
    `,
    )
    .eq('lesson_id', lessonId);

  if (error) {
    console.error('Failed to load lesson prerequisites:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    lessonId: row.lesson_id,
    prerequisiteLessonId: row.prerequisite_lesson_id,
    requiredCompletionCount: row.required_completion_count,
    createdAt: row.created_at,
    prerequisiteLesson: row.prerequisiteLesson
      ? {
          id: row.prerequisiteLesson.id,
          courseId: row.prerequisiteLesson.course_id,
          title: row.prerequisiteLesson.title,
          titleTarget: row.prerequisiteLesson.title_target,
          description: row.prerequisiteLesson.description,
          iconName: row.prerequisiteLesson.icon_name,
          iconUrl: row.prerequisiteLesson.icon_url,
          displayOrder: row.prerequisiteLesson.display_order,
          estimatedMinutes: row.prerequisiteLesson.estimated_minutes,
          isAvailable: row.prerequisiteLesson.is_available,
          createdAt: row.prerequisiteLesson.created_at,
          updatedAt: row.prerequisiteLesson.updated_at,
        }
      : undefined,
  }));
}

/**
 * Check if a lesson is unlocked for a user
 */
export async function checkLessonUnlockStatus(
  userId: string,
  lessonId: string,
  _courseId: string,
): Promise<UnlockStatus> {
  // 1. Get prerequisites
  const prerequisites = await loadLessonPrerequisites(lessonId);

  if (prerequisites.length === 0) {
    return {isUnlocked: true};
  }

  // 2. Get user progress for prerequisite lessons
  // We need to check lesson_progress table
  const prerequisiteIds = prerequisites.map(p => p.prerequisiteLessonId);

  const {data: progressData, error} = await supabase
    .from('lesson_progress' as any)
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', prerequisiteIds);

  if (error) {
    console.error('Failed to load prerequisite progress:', error);
    // Fail safe: lock if we can't verify
    return {isUnlocked: false, reason: 'Failed to verify prerequisites'};
  }

  const progressMap = new Map(
    (progressData || []).map((p: any) => [p.lesson_id, p]),
  );

  // 3. Check conditions
  const missingPrerequisites = [];

  for (const prereq of prerequisites) {
    const progress = progressMap.get(prereq.prerequisiteLessonId);
    const currentCompletion = progress?.completion_count || 0;
    if (currentCompletion < prereq.requiredCompletionCount) {
      missingPrerequisites.push({
        lessonId: prereq.prerequisiteLessonId,
        lessonTitle: prereq.prerequisiteLesson?.title || 'Unknown Lesson',
        currentCompletion,
        requiredCompletion: prereq.requiredCompletionCount,
      });
    }
  }

  if (missingPrerequisites.length > 0) {
    return {
      isUnlocked: false,
      reason: 'Prerequisites not met',
      missingPrerequisites,
    };
  }

  return {isUnlocked: true};
}

/**
 * Batch check unlock status for multiple lessons
 */
export async function batchCheckLessonUnlockStatus(
  userId: string,
  courseId: string,
  lessonIds: string[],
): Promise<Map<string, UnlockStatus>> {
  const results = new Map<string, UnlockStatus>();

  // TODO: Optimize this with a single complex query or stored procedure
  // For now, parallelize individual checks
  await Promise.all(
    lessonIds.map(async id => {
      const status = await checkLessonUnlockStatus(userId, id, courseId);
      results.set(id, status);
    }),
  );

  return results;
}

/**
 * Validate that the prerequisite graph has no cycles
 */
export async function validatePrerequisiteGraph(
  _courseId: string,
): Promise<{valid: boolean; errors: string[]}> {
  // This would require loading all prerequisites for the course
  // For Phase 1, we'll implement a basic check or placeholder
  return {valid: true, errors: []};
}
