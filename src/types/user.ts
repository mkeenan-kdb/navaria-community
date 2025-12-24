// User and progress types

import type {Tables} from './database';
import {GAMEPLAY} from '@/constants';

// Irish dialect options
export type IrishDialect = 'connacht' | 'ulster' | 'munster';

// Theme mode
export type ThemeMode = 'light' | 'dark' | 'system';

// User profile (camelCase for app use)
export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  learningDialect: IrishDialect;
  learningLanguageId?: string; // Added for multilingual support
  themeMode: ThemeMode;
  lastActivityDate?: string;
  role: 'user' | 'admin' | 'contributor';
  createdAt: string;
  updatedAt: string;
  achievements: string[]; // List of unlocked achievement IDs
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // MaterialCommunityIcons name
  conditionType: 'streak' | 'xp' | 'lessons' | 'mistakes' | 'languages';
  conditionValue: number;
  scope: 'language' | 'polyglot'; // Language-specific or cross-language
  languageId?: string; // Set for language-specific achievements
  isUnlocked: boolean;
  unlockedAt?: string;
}

// Lesson progress (camelCase for app use)
export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  completionCount: number;
  completedUnitIds: string[]; // Mapped from completed_sentence_ids
  totalUnits: number; // Mapped from total_sentences
  attemptHistory?: any[];
  lastCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Course progress (camelCase for app use)
export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  totalLessons: number;
  completionPercentage: number;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

// User stats (camelCase for app use)
export interface UserStats {
  id: string;
  userId: string;
  totalLessonsCompleted: number;
  totalUnitsCompleted: number;
  totalTimeSpentMinutes: number;
  totalMistakes: number;
  averageScore: number;
  lessonsCompletedToday: number;
  unitsCompletedToday: number;
  lastStatsResetDate: string;
  bestStreakDate?: string;
  createdAt: string;
  updatedAt: string;
}

// User language-specific stats (camelCase for app use)
export interface UserLanguageStats {
  id: string;
  userId: string;
  languageId: string;
  totalXP: number;
  totalLessonsCompleted: number;
  totalUnitsCompleted: number;
  totalTimeSpentMinutes: number;
  totalMistakes: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ... (existing imports, but wait, imports are top of file. I need to add import at top and update function)

// XP calculation
export function calculateCompletionBonus(completionCount: number): number {
  // Match backend logic: Bonus based on completion count
  // completionCount is the count BEFORE this completion
  // 0 -> 0 XP bonus (first time)
  // 1 -> 5 XP bonus (second time)
  // ...
  // 10+ -> 50 XP bonus (mastery)
  return Math.min(
    GAMEPLAY.XP.MAX_REPEAT_BONUS,
    completionCount * GAMEPLAY.XP.REPEAT_BONUS,
  );
}

// Deprecated: Use sessionXP + calculateCompletionBonus
export function calculateLessonXP(
  unitCount: number,
  completionCount: number = 0,
): number {
  // Fallback for compatibility
  return calculateCompletionBonus(completionCount);
}

// Mapping functions between database (snake_case) and app (camelCase)
export function mapToUserProfile(dbProfile: Tables<'profiles'>): UserProfile {
  const profile = dbProfile as any; // Cast to any to access avatar_url until types are regenerated
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name ?? undefined,
    avatarUrl: profile.avatar_url || null,
    totalXP: profile.total_xp ?? 0,
    currentStreak: profile.current_streak ?? 0,
    longestStreak: profile.longest_streak ?? 0,
    learningDialect: (profile.learning_dialect as IrishDialect) || 'munster',
    learningLanguageId: profile.learning_language_id ?? undefined,
    themeMode: (profile.theme_mode as ThemeMode) || 'system',
    lastActivityDate: profile.last_activity_date ?? undefined,
    role: (profile.role as 'user' | 'admin' | 'contributor') || 'user',
    createdAt: profile.created_at ?? new Date().toISOString(),
    updatedAt: profile.updated_at ?? new Date().toISOString(),
    achievements: [], // Default to empty until DB schema is updated
  };
}

export function mapToLessonProgress(
  dbProgress: Tables<'lesson_progress'>,
): LessonProgress {
  return {
    id: dbProgress.id,
    userId: dbProgress.user_id,
    lessonId: dbProgress.lesson_id,
    courseId: dbProgress.course_id,
    completionCount: dbProgress.completion_count ?? 0,
    completedUnitIds: dbProgress.completed_sentence_ids ?? [],
    totalUnits: dbProgress.total_sentences ?? 0,
    attemptHistory: dbProgress.attempt_history
      ? (dbProgress.attempt_history as any[])
      : undefined,
    lastCompletedAt: dbProgress.last_completed_at ?? undefined,
    createdAt: dbProgress.created_at ?? new Date().toISOString(),
    updatedAt: dbProgress.updated_at ?? new Date().toISOString(),
  };
}

export function mapToCourseProgress(
  dbProgress: Tables<'course_progress'>,
): CourseProgress {
  return {
    id: dbProgress.id,
    userId: dbProgress.user_id,
    courseId: dbProgress.course_id,
    completedLessonIds: dbProgress.completed_lesson_ids ?? [],
    totalLessons: dbProgress.total_lessons ?? 0,
    completionPercentage: dbProgress.completion_percentage ?? 0,
    lastAccessedAt: dbProgress.last_accessed_at ?? new Date().toISOString(),
    createdAt: dbProgress.created_at ?? new Date().toISOString(),
    updatedAt: dbProgress.updated_at ?? new Date().toISOString(),
  };
}

export function mapToUserStats(dbStats: Tables<'user_stats'>): UserStats {
  return {
    id: dbStats.id,
    userId: dbStats.user_id,
    totalLessonsCompleted: dbStats.total_lessons_completed ?? 0,
    totalUnitsCompleted: dbStats.total_sentences_completed ?? 0,
    totalTimeSpentMinutes: dbStats.total_time_spent_minutes ?? 0,
    totalMistakes: dbStats.total_mistakes ?? 0,
    averageScore: dbStats.average_score ?? 0,
    lessonsCompletedToday: dbStats.lessons_completed_today ?? 0,
    unitsCompletedToday: dbStats.sentences_completed_today ?? 0,
    lastStatsResetDate:
      dbStats.last_stats_reset_date ?? new Date().toISOString(),
    bestStreakDate: dbStats.best_streak_date ?? undefined,
    createdAt: dbStats.created_at ?? new Date().toISOString(),
    updatedAt: dbStats.updated_at ?? new Date().toISOString(),
  };
}

export function mapToUserLanguageStats(
  dbStats: Tables<'user_language_stats'>,
): UserLanguageStats {
  return {
    id: dbStats.id,
    userId: dbStats.user_id,
    languageId: dbStats.language_id,
    totalXP: dbStats.total_xp ?? 0,
    totalLessonsCompleted: dbStats.total_lessons_completed ?? 0,
    totalUnitsCompleted: dbStats.total_sentences_completed ?? 0,
    totalTimeSpentMinutes: dbStats.total_time_spent_minutes ?? 0,
    totalMistakes: dbStats.total_mistakes ?? 0,
    averageScore: dbStats.average_score ?? 0,
    currentStreak: dbStats.current_streak ?? 0,
    longestStreak: dbStats.longest_streak ?? 0,
    lastActivityDate: dbStats.last_activity_date ?? undefined,
    createdAt: dbStats.created_at ?? new Date().toISOString(),
    updatedAt: dbStats.updated_at ?? new Date().toISOString(),
  };
}
