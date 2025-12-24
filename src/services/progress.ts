// Progress tracking service

import {supabase} from './supabase';
import type {
  LessonProgress,
  CourseProgress,
  UserStats,
  TablesInsert,
} from '@/types';
import {
  mapToLessonProgress,
  mapToCourseProgress,
  mapToUserStats,
} from '@/types/user';
import {
  checkAndUnlockLanguageAchievements,
  checkAndUnlockPolyglotAchievements,
} from './achievements';

// API Request Timeout in milliseconds - 15 seconds
const API_TIMEOUT = 15 * 1000;

/**
 * Wrap a promise or thenable with a timeout to prevent indefinite hangs
 */
async function withTimeout<T>(
  promiseLike: PromiseLike<T> | Promise<T>,
  timeoutMs: number = API_TIMEOUT,
  errorMessage: string = 'Request timed out',
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const promise = Promise.resolve(promiseLike);

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Get or create lesson progress for a user
 */
export async function getLessonProgress(
  userId: string,
  lessonId: string,
  courseId: string,
): Promise<LessonProgress | null> {
  const {data, error} = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching lesson progress:', error);
    throw error;
  }

  if (!data) {
    // Create new progress record
    const newProgress: TablesInsert<'lesson_progress'> = {
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completion_count: 0,
      completed_sentence_ids: [],
      total_sentences: 0,
    };

    const {data: created, error: createError} = await supabase
      .from('lesson_progress')
      .insert(newProgress)
      .select()
      .single();

    if (createError) {
      console.error('Error creating lesson progress:', createError);
      throw createError;
    }

    return mapToLessonProgress(created);
  }

  return mapToLessonProgress(data);
}

/**
 * Update lesson progress when a unit is completed
 */
export async function markUnitComplete(
  userId: string,
  lessonId: string,
  courseId: string,
  unitId: string,
  totalUnits: number,
): Promise<LessonProgress> {
  const progress = await getLessonProgress(userId, lessonId, courseId);
  if (!progress) {
    throw new Error('Could not get lesson progress');
  }

  // Add unit ID if not already completed
  const completedIds = new Set(progress.completedUnitIds);
  completedIds.add(unitId);

  const {data, error} = await supabase
    .from('lesson_progress')
    .update({
      completed_sentence_ids: Array.from(completedIds),
      total_sentences: totalUnits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', progress.id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapToLessonProgress(data);
}

/**
 * Submit exercise completion (partial lesson progress)
 */
export async function submitExercise(
  userId: string,
  lessonId: string,
  courseId: string,
  exerciseId: string, // This is often the unit ID in the current architecture
  totalUnits: number,
  stats: {
    timeSpentMinutes: number;
    mistakes: number;
    score: number;
    sessionXP?: number;
  },
): Promise<{
  progress: LessonProgress;
  xpEarned: number;
  isLessonComplete: boolean;
}> {
  // 1. Mark the unit/exercise as complete
  const progress = await markUnitComplete(
    userId,
    lessonId,
    courseId,
    exerciseId,
    totalUnits,
  );

  // 2. Add XP
  const xpEarned = stats.sessionXP || 0;
  // Get course language (default to irish_std if not found)
  // We can optimize this by passing languageId if available, but for now fetch safely implies robust
  const {data: course} = await supabase
    .from('courses')
    .select('language_id')
    .eq('id', courseId)
    .single();
  const languageId = course?.language_id || 'irish_std';

  await addXP(userId, xpEarned, languageId);

  // 3. Update User Stats (increment sentences/units, but NOT lessons yet)
  // Pass explicit flag to NOT increment lesson count
  await updateUserStats(userId, 1, stats, languageId, {
    incrementLessonCount: false,
  });

  // 3.5. Check for achievements (including 'First Steps' on first exercise)
  try {
    await checkAndUnlockLanguageAchievements(userId, languageId);
  } catch (achievementError) {
    console.warn(
      'Failed to check achievements after exercise:',
      achievementError,
    );
  }

  // 4. Check for Lesson Completion
  // If we have completed all units (exercises), then complete the lesson
  // Use the newly updated progress from markUnitComplete which added the current exercise
  const updatedCompletedCount = progress.completedUnitIds.length;
  const isLessonComplete =
    updatedCompletedCount >= totalUnits && totalUnits > 0;

  if (isLessonComplete) {
    // Determine bonus XP for lesson completion
    const completionBonus = Math.min(50, progress.completionCount * 5); // Example bonus logic
    await addXP(userId, completionBonus, languageId);

    // Finalize lesson completion
    await completeLesson(userId, lessonId, courseId, totalUnits, {
      ...stats,
      sessionXP: completionBonus, // Pass bonus as sessionXP so it gets added to stats if needed, or handled separately
      // Actually completeLesson adds XP internally too?
      // convert completeLesson to be "finalizeLesson" or just call the necessary parts?
      // Let's look at completeLesson. It:
      // - Adds Bonus XP (we just did that, or we let it do it?)
      // - Updates lesson_progress last_completed_at
      // - Updates Stats (increments lesson count)
      // - Updates Streak
      // - Updates Course Progress
      // - Checks Achievements
    });

    return {
      progress,
      xpEarned: xpEarned + completionBonus,
      isLessonComplete: true,
    };
  }

  return {
    progress,
    xpEarned,
    isLessonComplete: false,
  };
}

/**
 * Complete a lesson
 */
export async function completeLesson(
  userId: string,
  lessonId: string,
  courseId: string,
  totalUnits: number,
  stats: {
    timeSpentMinutes: number;
    mistakes: number;
    score: number;
    sessionXP?: number;
  } = {
    timeSpentMinutes: 0,
    mistakes: 0,
    score: 100,
    sessionXP: 0,
  },
): Promise<{progress: LessonProgress; xpEarned: number}> {
  const progress = await getLessonProgress(userId, lessonId, courseId);
  if (!progress) {
    throw new Error('Could not get lesson progress');
  }

  // Get course to know the language
  const {data: course} = await supabase
    .from('courses')
    .select('language_id')
    .eq('id', courseId)
    .single();

  const languageId = course?.language_id || 'irish_std';

  const newCompletionCount = progress.completionCount + 1;

  // Calculate XP earned
  // Bonus based on completion count
  const completionBonus = Math.min(50, progress.completionCount * 5);
  const xpEarned = (stats.sessionXP || 0) + completionBonus;

  // Update lesson progress
  const {data, error} = await supabase
    .from('lesson_progress')
    .update({
      completion_count: newCompletionCount,
      total_sentences: totalUnits,
      last_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', progress.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Update user profile XP and language stats
  await addXP(userId, xpEarned, languageId);

  // ... existing code ...
  // Update user stats
  await updateUserStats(userId, totalUnits, stats, languageId);

  // Update streak
  await updateStreak(userId, languageId);

  // Update course progress
  await updateCourseProgress(userId, courseId, lessonId);

  // Check for achievements (safely)
  const userStats = await getUserStats(userId);
  if (userStats) {
    try {
      // Check for achievements (language-specific and polyglot)
      await checkAndUnlockLanguageAchievements(userId, languageId);
      await checkAndUnlockPolyglotAchievements(userId);
    } catch (achievementError) {
      // Ignore achievement errors (e.g. missing table) to prevent blocking lesson completion
      console.warn('Failed to check achievements:', achievementError);
    }
  }

  return {
    progress: mapToLessonProgress(data),
    xpEarned,
  };
}

/**
 * Update user streak
 */
export async function updateStreak(
  userId: string,
  languageId: string = 'irish_std',
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Get current profile
  const {data: profile, error: fetchError} = await supabase
    .from('profiles')
    .select('current_streak, last_activity_date, longest_streak')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching profile for streak:', fetchError);
    return;
  }

  const lastActivityDate = profile?.last_activity_date
    ? profile.last_activity_date.split('T')[0]
    : null;

  // If already active today, do nothing
  if (lastActivityDate === today) {
    return;
  }

  let newStreak = 1;
  if (lastActivityDate === yesterday) {
    newStreak = (profile?.current_streak || 0) + 1;
  }

  const newLongestStreak = Math.max(profile?.longest_streak || 0, newStreak);

  const {error: updateError} = await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_activity_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating streak:', updateError);
  }

  // Update language-specific streak
  await updateLanguageStreak(userId, languageId, newStreak, newLongestStreak);
}

async function updateLanguageStreak(
  userId: string,
  languageId: string,
  currentStreak: number,
  longestStreak: number,
): Promise<void> {
  // Upsert language stats
  const {error} = await supabase.from('user_language_stats').upsert(
    {
      user_id: userId,
      language_id: languageId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {onConflict: 'user_id,language_id'},
  );

  if (error) {
    console.error('Error updating language streak:', error);
  }
}

/**
 * Add XP to user profile
 */
export async function addXP(
  userId: string,
  xp: number,
  languageId: string = 'irish_std',
): Promise<void> {
  // Get current profile
  const {data: profile, error: fetchError} = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Update with new XP
  const {error: profileError} = await supabase
    .from('profiles')
    .update({
      total_xp: (profile?.total_xp || 0) + xp,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    throw profileError;
  }

  // Update language specific XP
  await addLanguageXP(userId, languageId, xp);
}

async function addLanguageXP(
  userId: string,
  languageId: string,
  xp: number,
): Promise<void> {
  // Get current language stats
  const {data} = await supabase
    .from('user_language_stats')
    .select('total_xp')
    .eq('user_id', userId)
    .eq('language_id', languageId)
    .maybeSingle();

  const currentXP = data?.total_xp || 0;

  // Upsert language stats
  const {error: upsertError} = await supabase
    .from('user_language_stats')
    .upsert(
      {
        user_id: userId,
        language_id: languageId,
        total_xp: currentXP + xp,
        updated_at: new Date().toISOString(),
      },
      {onConflict: 'user_id,language_id'},
    );

  if (upsertError) {
    console.error('Error updating language XP:', upsertError);
  }
}

/**
 * Update user stats after lesson completion
 */
export async function updateUserStats(
  userId: string,
  unitsCompleted: number,
  stats: {
    timeSpentMinutes: number;
    mistakes: number;
    score: number;
    sessionXP?: number;
  } = {
    timeSpentMinutes: 0,
    mistakes: 0,
    score: 100,
    sessionXP: 0,
  },
  languageId: string = 'irish_std',
  options: {incrementLessonCount: boolean} = {incrementLessonCount: true},
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Get existing stats to calculate cumulative values
  // Note: upsert returns the new row, but we need the old one for cumulative calculations
  // if we don't have it in memory. This is a slight race condition risk but acceptable for stats.
  // A safer way would be a database function or raw SQL increment, but Supabase JS client
  // doesn't support raw SQL increments easily without RPCs.
  const {data: statsRow} = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const lastResetDate = statsRow?.last_stats_reset_date || today;
  const isNewDay = lastResetDate !== today;

  // Calculate new totals
  const currentTotalLessons = statsRow?.total_lessons_completed || 0;
  const newTotalLessons =
    currentTotalLessons + (options.incrementLessonCount ? 1 : 0);

  // Calculate new average score
  // Only update average when we're actually incrementing the lesson count
  const currentAvg = statsRow?.average_score || 0;
  let newAvg = currentAvg;
  if (options.incrementLessonCount && newTotalLessons > 0) {
    // Calculate weighted average with the new score
    newAvg = (currentAvg * currentTotalLessons + stats.score) / newTotalLessons;
  }
  // Ensure score stays within valid range (0-100)
  newAvg = Math.min(100, Math.max(0, newAvg));

  // Prepare the upsert payload
  const updates: TablesInsert<'user_stats'> = {
    user_id: userId,
    total_lessons_completed: newTotalLessons,
    total_sentences_completed:
      (statsRow?.total_sentences_completed || 0) + unitsCompleted,
    total_time_spent_minutes:
      (statsRow?.total_time_spent_minutes || 0) + stats.timeSpentMinutes,
    total_mistakes: (statsRow?.total_mistakes || 0) + stats.mistakes,
    average_score: Number(newAvg.toFixed(2)),
    lessons_completed_today: isNewDay
      ? 1
      : (statsRow?.lessons_completed_today || 0) +
        (options.incrementLessonCount ? 1 : 0),
    sentences_completed_today: isNewDay
      ? unitsCompleted
      : (statsRow?.sentences_completed_today || 0) + unitsCompleted,
    last_stats_reset_date: today,
    // We don't update created_at on upsert if it exists, but insert needs it (default default now())
    updated_at: new Date().toISOString(),
  };

  // Use upsert for atomic insert-or-update
  const {error} = await supabase
    .from('user_stats')
    .upsert(updates, {onConflict: 'user_id'});

  if (error) {
    console.error('Failed to update user stats:', error);
    throw error;
  }

  // Also update language-specific stats
  await updateLanguageStats(userId, languageId, unitsCompleted, stats, options);
}

/**
 * Update language-specific user stats
 */
async function updateLanguageStats(
  userId: string,
  languageId: string,
  unitsCompleted: number,
  stats: {
    timeSpentMinutes: number;
    mistakes: number;
    score: number;
  },
  options: {incrementLessonCount: boolean} = {incrementLessonCount: true},
): Promise<void> {
  // Get existing language stats
  const {data: languageStats} = await supabase
    .from('user_language_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('language_id', languageId)
    .maybeSingle();

  const currentTotalLessons = languageStats?.total_lessons_completed || 0;
  const newTotalLessons =
    currentTotalLessons + (options.incrementLessonCount ? 1 : 0);

  // Calculate new average score
  // Only update average when we're actually incrementing the lesson count
  const currentAvg = languageStats?.average_score || 0;
  let newAvg = currentAvg;
  if (options.incrementLessonCount && newTotalLessons > 0) {
    // Calculate weighted average with the new score
    newAvg = (currentAvg * currentTotalLessons + stats.score) / newTotalLessons;
  }
  // Ensure score stays within valid range (0-100)
  newAvg = Math.min(100, Math.max(0, newAvg));

  // Upsert language stats
  const {error} = await supabase.from('user_language_stats').upsert(
    {
      user_id: userId,
      language_id: languageId,
      total_lessons_completed: newTotalLessons,
      total_sentences_completed:
        (languageStats?.total_sentences_completed || 0) + unitsCompleted,
      total_time_spent_minutes:
        (languageStats?.total_time_spent_minutes || 0) + stats.timeSpentMinutes,
      total_mistakes: (languageStats?.total_mistakes || 0) + stats.mistakes,
      average_score: Number(newAvg.toFixed(2)),
      updated_at: new Date().toISOString(),
    },
    {onConflict: 'user_id,language_id'},
  );

  if (error) {
    console.error('Failed to update language stats:', error);
  }
}

/**
 * Update course progress
 */
export async function updateCourseProgress(
  userId: string,
  courseId: string,
  lessonId: string,
): Promise<void> {
  // Get or create course progress
  const {data: progressRow, error: fetchError} = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  const completedLessons = new Set<string>(
    progressRow?.completed_lesson_ids || [],
  );
  completedLessons.add(lessonId);

  // Get total lessons for this course
  const {count} = await supabase
    .from('lessons')
    .select('*', {count: 'exact', head: true})
    .eq('course_id', courseId);

  const totalLessons = count;

  const completionPercentage = totalLessons
    ? (completedLessons.size / totalLessons) * 100
    : 0;

  if (progressRow) {
    // Update existing
    const {error: updateError} = await supabase
      .from('course_progress')
      .update({
        completed_lesson_ids: Array.from(completedLessons),
        total_lessons: totalLessons || 0,
        completion_percentage: completionPercentage,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', progressRow.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    // Create new
    const {error: insertError} = await supabase.from('course_progress').insert({
      user_id: userId,
      course_id: courseId,
      completed_lesson_ids: Array.from(completedLessons),
      total_lessons: totalLessons || 0,
      completion_percentage: completionPercentage,
      last_accessed_at: new Date().toISOString(),
    });

    if (insertError) {
      throw insertError;
    }
  }
}

/**
 * Get all lesson progress for a course
 */
export async function getCourseProgress(
  userId: string,
  courseId: string,
): Promise<LessonProgress[]> {
  const {data, error} = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) {
    throw error;
  }
  return data.map(mapToLessonProgress);
}

/**
 * Get course progress summary for a user
 */
export async function getCourseProgressSummary(
  userId: string,
  courseId: string,
): Promise<CourseProgress | null> {
  const {data, error} = await withTimeout(
    supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle(),
    API_TIMEOUT,
    'Loading course progress timed out',
  );

  if (error) {
    throw error;
  }

  return data ? mapToCourseProgress(data) : null;
}

/**
 * Get user stats
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const {data, error} = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapToUserStats(data) : null;
}

/**
 * Get all progress for user
 */
export async function getAllUserProgress(userId: string): Promise<{
  lessons: LessonProgress[];
  courses: CourseProgress[];
  stats: UserStats | null;
}> {
  const [lessonsData, coursesData, stats] = await Promise.all([
    supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .then(r => r.data || []),
    supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .then(r => r.data || []),
    getUserStats(userId),
  ]);

  return {
    lessons: lessonsData.map(mapToLessonProgress),
    courses: coursesData.map(mapToCourseProgress),
    stats,
  };
}

/**
 * Reset user XP
 */
export async function resetUserXP(userId: string): Promise<void> {
  const {error} = await supabase
    .from('profiles')
    .update({
      total_xp: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

/**
 * Reset all user progress
 */
export async function resetUserProgress(userId: string): Promise<void> {
  // Delete from related tables
  const results = await Promise.all([
    supabase.from('lesson_progress').delete().eq('user_id', userId),
    supabase.from('course_progress').delete().eq('user_id', userId),
    supabase.from('user_stats').delete().eq('user_id', userId),
    supabase.from('user_language_stats').delete().eq('user_id', userId),
    supabase.from('user_achievements').delete().eq('user_id', userId),
  ]);

  // Check for errors
  const errors = results.filter(r => r.error).map(r => r.error);
  if (errors.length > 0) {
    console.error('Errors during progress reset:', errors);
    // Log specific table errors for debugging
    results.forEach((r, i) => {
      if (r.error) {
        const tables = [
          'lesson_progress',
          'course_progress',
          'user_stats',
          'user_language_stats',
          'user_achievements',
        ];
        console.error(`Failed to delete from ${tables[i]}:`, r.error);
      }
    });
    throw new Error(
      `Failed to reset progress: ${errors.map(e => e?.message).join(', ')}`,
    );
  }

  // Reset profile stats
  const {error} = await supabase
    .from('profiles')
    .update({
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}
