// Content management service for adding/editing
// This provides basic CRUD operations for the dynamic content system

import {supabase} from '@/services/supabase';
import type {
  Course,
  Lesson,
  LessonSpeaker,
  GrammarCategory,
  TablesUpdate,
} from '@/types';

// ============================================================================
// COURSE MANAGEMENT
// ============================================================================

/**
 * Create a new course
 */
export async function createCourse(courseData: {
  title: string;
  titleTarget?: string; // Changed from titleIrish
  description?: string;
  iconName?: string;
  iconUrl?: string;
  color?: string;
  displayOrder?: number;
}): Promise<Course> {
  const {data, error} = await supabase
    .from('courses')
    .insert({
      title: courseData.title,
      title_target: courseData.titleTarget || null, // Changed from title_irish, handled undefined
      description: courseData.description || null,
      icon_name: courseData.iconName || null,
      icon_url: courseData.iconUrl || null,
      color: courseData.color || '#6b7c59',
      display_order: courseData.displayOrder || 0,
      is_available: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create course:', error);
    throw new Error('Failed to create course');
  }

  return {
    id: data.id,
    title: data.title,
    titleTarget: data.title_target ?? undefined,
    description: data.description ?? undefined,
    iconName: data.icon_name ?? undefined,
    iconUrl: data.icon_url ?? undefined,
    color: data.color,
    displayOrder: data.display_order,
    isAvailable: data.is_available,
    createdAt: data.created_at ?? '',
    updatedAt: data.updated_at ?? '',
  };
}

/**
 * Update an existing course
 */
export async function updateCourse(
  courseId: string,
  updates: Partial<TablesUpdate<'courses'>>,
): Promise<Course> {
  const {data, error} = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update course:', error);
    throw new Error('Failed to update course');
  }

  return {
    id: data.id,
    title: data.title,
    titleTarget: data.title_target ?? undefined,
    description: data.description ?? undefined,
    iconName: data.icon_name ?? undefined,
    iconUrl: data.icon_url ?? undefined,
    color: data.color,
    displayOrder: data.display_order,
    isAvailable: data.is_available,
    createdAt: data.created_at ?? '',
    updatedAt: data.updated_at ?? '',
  };
}

/**
 * Delete a course (and all its lessons/sentences)
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const {error} = await supabase.from('courses').delete().eq('id', courseId);

  if (error) {
    console.error('Failed to delete course:', error);
    throw new Error('Failed to delete course');
  }
}

// ============================================================================
// LESSON MANAGEMENT
// ============================================================================

/**
 * Create a new lesson
 */
export async function createLesson(lessonData: {
  courseId: string;
  title: string;
  type: 'standard' | 'cloze' | 'matching_pairs';
  displayOrder?: number;
  estimatedMinutes?: number;
}): Promise<Lesson> {
  const {data, error} = await supabase
    .from('lessons')
    .insert({
      course_id: lessonData.courseId,
      title: lessonData.title,
      type: lessonData.type,
      display_order: lessonData.displayOrder || 0,
      estimated_minutes: lessonData.estimatedMinutes || 5,
      is_available: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create lesson:', error);
    throw new Error('Failed to create lesson');
  }

  return {
    id: data.id,
    courseId: data.course_id,
    title: data.title,
    type: lessonData.type, // Passthrough as DB doesn't store type anymore
    displayOrder: data.display_order,
    estimatedMinutes: data.estimated_minutes,
    isAvailable: data.is_available,
    createdAt: data.created_at ?? '',
    updatedAt: data.updated_at ?? '',
  };
}

/**
 * Create an exercise speaker (formerly lesson speaker)
 */
export async function createExerciseSpeaker(speakerData: {
  exerciseId: string;
  name: string;
  color?: string;
  icon?: string;
}): Promise<LessonSpeaker> {
  const {data, error} = await supabase
    .from('exercise_speakers')
    .insert({
      exercise_id: speakerData.exerciseId,
      name: speakerData.name,
      color: speakerData.color || '#6b7c59',
      icon: speakerData.icon || 'account',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create exercise speaker:', error);
    throw new Error('Failed to create exercise speaker');
  }

  // Mapping back to LessonSpeaker interface pending generic Speaker refactor
  return {
    id: data.id,
    lessonId: data.exercise_id, // Mapping exercise_id to lessonId for compatibility
    name: data.name,
    color: data.color,
    icon: data.icon,
    createdAt: data.created_at || '',
  };
}

// ============================================================================
// SENTENCE MANAGEMENT
// ============================================================================

/**
 * Create a new translation unit (formerly sentence)
 */
export async function createTranslationUnit(unitData: {
  exerciseId: string;
  irish: string;
  english: string;
  irishUnmutated?: string;
  displayOrder?: number;
  speakerId?: string; // Optional metadata
}): Promise<any> {
  const {data, error} = await supabase
    .from('exercise_units')
    .insert({
      exercise_id: unitData.exerciseId,
      unit_type: 'sentence',
      content: {
        source: unitData.irish,
        target: unitData.english,
        irishUnmutated: unitData.irishUnmutated,
      },
      metadata: {
        speakerId: unitData.speakerId,
      },
      display_order: unitData.displayOrder || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create translation unit:', error);
    throw new Error('Failed to create translation unit');
  }

  return {
    id: data.id,
    exerciseId: data.exercise_id,
    unitType: data.unit_type,
    content: data.content,
    metadata: data.metadata,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Bulk create translation units for an exercise
 */
export async function createTranslationUnitsBulk(
  exerciseId: string,
  units: Array<{
    irish: string;
    english: string;
    irishUnmutated?: string;
    displayOrder?: number;
    speakerId?: string;
  }>,
): Promise<any[]> {
  const unitInserts = units.map((unit, index) => ({
    exercise_id: exerciseId,
    unit_type: 'sentence',
    content: {
      source: unit.irish,
      target: unit.english,
      irishUnmutated: unit.irishUnmutated,
    },
    metadata: {
      speakerId: unit.speakerId,
    },
    display_order: unit.displayOrder ?? index,
  }));

  const {data, error} = await supabase
    .from('exercise_units')
    .insert(unitInserts)
    .select();

  if (error) {
    console.error('Failed to create translation units:', error);
    throw new Error('Failed to create translation units');
  }

  return data.map(row => ({
    id: row.id,
    exerciseId: row.exercise_id,
    unitType: row.unit_type,
    content: row.content,
    metadata: row.metadata,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// ============================================================================
// METADATA MANAGEMENT
// ============================================================================

export async function createGrammarCategory(
  _categoryName: string,
  _subcategoryName: string,
  _description?: string,
): Promise<GrammarCategory> {
  // Grammar categories not available in current database schema
  console.warn(
    'createGrammarCategory: Table grammar_categories does not exist',
  );
  throw new Error('Feature not supported in current database schema');
}

export async function linkSentenceGrammar(
  _sentenceId: string,
  _grammarCategoryId: string,
): Promise<void> {
  // Sentence grammar not available in current database schema
  console.warn('linkSentenceGrammar: Table sentence_grammar does not exist');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the next display order for a course's lessons
 */
export async function getNextLessonOrder(courseId: string): Promise<number> {
  const {data, error} = await supabase
    .from('lessons')
    .select('display_order')
    .eq('course_id', courseId)
    .order('display_order', {ascending: false})
    .limit(1);

  if (error) {
    console.error('Failed to get lesson order:', error);
    return 0;
  }

  return data.length > 0 ? data[0].display_order + 1 : 0;
}

/**
 * Get the next display order for an exercise's units
 */
export async function getNextUnitOrder(exerciseId: string): Promise<number> {
  const {data, error} = await supabase
    .from('exercise_units')
    .select('display_order')
    .eq('exercise_id', exerciseId)
    .order('display_order', {ascending: false})
    .limit(1);

  if (error) {
    console.error('Failed to get unit order:', error);
    return 0;
  }

  return data.length > 0 ? data[0].display_order + 1 : 0;
}

/**
 * Example: Create a complete course with lessons and sentences
 */
export async function createCompleteCourse(courseData: {
  title: string;
  titleIrish?: string;
  description?: string;
  iconName?: string;
  color?: string;
  lessons: Array<{
    title: string;
    type: 'standard' | 'cloze' | 'matching_pairs';
    speakers?: Array<{
      name: string;
      color: string;
      icon: string;
    }>;
    sentences: Array<{
      irish: string;
      english: string;
      irishUnmutated?: string;
      speakerName?: string; // Will be matched to speakers array
    }>;
  }>;
}): Promise<Course> {
  // Create course
  const course = await createCourse(courseData);

  // Create lessons
  for (let i = 0; i < courseData.lessons.length; i++) {
    const lessonData = courseData.lessons[i];

    const lesson = await createLesson({
      courseId: course.id,
      title: lessonData.title,
      type: lessonData.type,
      displayOrder: i,
      estimatedMinutes: Math.ceil(lessonData.sentences.length * 2),
    });

    // Create sentences
    // Create a default exercise to hold the sentences
    const {data: exerciseData, error: exError} = await supabase
      .from('exercises')
      .insert({
        lesson_id: lesson.id,
        title: 'Vocabulary Practice',
        type: 'standard',
        display_order: 0,
        is_available: true,
      })
      .select()
      .single();

    if (exError) {
      console.error('Failed to create default exercise:', exError);
      throw new Error('Failed to create default exercise');
    }

    // Create speakers if any (Attached to Exercise now)
    const speakerMap = new Map<string, string>();
    if (lessonData.speakers) {
      for (const speakerData of lessonData.speakers) {
        const speaker = await createExerciseSpeaker({
          exerciseId: exerciseData.id,
          name: speakerData.name,
          color: speakerData.color,
          icon: speakerData.icon,
        });
        speakerMap.set(speakerData.name, speaker.id);
      }
    }

    // Create units
    const units = lessonData.sentences.map((sentenceData, index) => ({
      speakerId: sentenceData.speakerName
        ? speakerMap.get(sentenceData.speakerName)
        : undefined,
      irish: sentenceData.irish,
      english: sentenceData.english,
      irishUnmutated: sentenceData.irishUnmutated,
      displayOrder: index,
    }));

    await createTranslationUnitsBulk(exerciseData.id, units);
  }

  return course;
}
