import {supabase} from './supabase';
import {mapToUserLanguageStats} from '@/types';
import type {UserStats, UserLanguageStats, LessonProgress} from '@/types';

export interface AchievementDefinition {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  scope: 'language' | 'polyglot';
  condition: (
    stats: UserLanguageStats | UserStats,
    progress?: LessonProgress,
    currentStreak?: number,
    polyglotData?: {
      languagesStarted: number;
      languagesWithXP: Map<string, number>;
    },
  ) => boolean;
}

// Language-specific achievements (earned separately for each language)
export const LANGUAGE_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_steps',
    type: 'FIRST_STEPS',
    title: 'First Steps',
    description: 'Complete your first exercise',
    icon: 'footprints',
    scope: 'language',
    condition: (stats: any) =>
      (stats.total_sentences_completed || stats.totalUnitsCompleted || 0) >= 1,
  },
  {
    id: 'scholar',
    type: 'SCHOLAR',
    title: 'Scholar',
    description: 'Earn 100 XP',
    icon: 'graduation-cap',
    scope: 'language',
    condition: (stats: any) => (stats.total_xp || stats.totalXP || 0) >= 100,
  },
  {
    id: 'dedicated',
    type: 'DEDICATED',
    title: 'Dedicated',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    scope: 'language',
    condition: (stats: any, _progress, currentStreak = 0) => currentStreak >= 7,
  },
  {
    id: 'consistent',
    type: 'CONSISTENT',
    title: 'Consistent',
    description: 'Maintain a 3-day streak',
    icon: 'calendar-check',
    scope: 'language',
    condition: (stats: any, _progress, currentStreak = 0) => currentStreak >= 3,
  },
  {
    id: 'master',
    type: 'MASTER',
    title: 'Master',
    description: 'Complete 50 lessons',
    icon: 'trophy',
    scope: 'language',
    condition: (stats: any) =>
      (stats.total_lessons_completed || stats.totalLessonsCompleted || 0) >= 50,
  },
  {
    id: 'expert',
    type: 'EXPERT',
    title: 'Expert',
    description: 'Earn 500 XP',
    icon: 'star',
    scope: 'language',
    condition: (stats: any) => (stats.total_xp || stats.totalXP || 0) >= 500,
  },
];

// Polyglot achievements (cross-language)
export const POLYGLOT_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'bilingual',
    type: 'BILINGUAL',
    title: 'Bilingual',
    description: 'Start learning 2 languages',
    icon: 'globe',
    scope: 'polyglot',
    condition: (_stats, _progress, _streak, polyglotData) =>
      (polyglotData?.languagesStarted || 0) >= 2,
  },
  {
    id: 'trilingual',
    type: 'TRILINGUAL',
    title: 'Trilingual',
    description: 'Start learning 3 languages',
    icon: 'globe-2',
    scope: 'polyglot',
    condition: (_stats, _progress, _streak, polyglotData) =>
      (polyglotData?.languagesStarted || 0) >= 3,
  },
  {
    id: 'polyglot',
    type: 'POLYGLOT',
    title: 'Polyglot',
    description: 'Start learning 5 languages',
    icon: 'languages',
    scope: 'polyglot',
    condition: (_stats, _progress, _streak, polyglotData) =>
      (polyglotData?.languagesStarted || 0) >= 5,
  },
  {
    id: 'cultural_ambassador',
    type: 'CULTURAL_AMBASSADOR',
    title: 'Cultural Ambassador',
    description: 'Earn 100 XP in 3 different languages',
    icon: 'users',
    scope: 'polyglot',
    condition: (_stats, _progress, _streak, polyglotData) => {
      if (!polyglotData?.languagesWithXP) {
        return false;
      }
      let count = 0;
      for (const xp of polyglotData.languagesWithXP.values()) {
        if (xp >= 100) {
          count++;
        }
      }
      return count >= 3;
    },
  },
];

export const ALL_ACHIEVEMENTS = [
  ...LANGUAGE_ACHIEVEMENTS,
  ...POLYGLOT_ACHIEVEMENTS,
];

/**
 * Check for new language-specific achievements and unlock them
 */
export async function checkAndUnlockLanguageAchievements(
  userId: string,
  languageId: string,
): Promise<AchievementDefinition[]> {
  const newlyUnlocked: AchievementDefinition[] = [];

  try {
    // Get language stats
    const {data: langStats} = await supabase
      .from('user_language_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('language_id', languageId)
      .maybeSingle();

    if (!langStats) {
      console.warn('[ACHIEVEMENTS] No language stats found for', languageId);
      return [];
    }

    console.log(
      '[ACHIEVEMENTS] Checking achievements for',
      languageId,
      'with stats:',
      {
        totalXP: langStats.total_xp,
        totalLessons: langStats.total_lessons_completed,
        currentStreak: langStats.current_streak,
      },
    );

    const currentStreak = langStats.current_streak || 0;

    // Get already unlocked achievements for this language
    const {data: unlocked} = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .eq('language_id', languageId);

    const unlockedTypes = new Set(unlocked?.map(a => a.achievement_id) || []);
    console.log('[ACHIEVEMENTS] Already unlocked:', Array.from(unlockedTypes));

    // Check each language-specific achievement
    for (const achievement of LANGUAGE_ACHIEVEMENTS) {
      const isUnlocked = unlockedTypes.has(achievement.type);
      const meetsCondition = achievement.condition(
        mapToUserLanguageStats(langStats),
        undefined,
        currentStreak,
      );

      console.log(
        `[ACHIEVEMENTS] ${achievement.type}: unlocked=${isUnlocked}, meetsCondition=${meetsCondition}`,
      );

      if (!isUnlocked && meetsCondition) {
        console.log(`[ACHIEVEMENTS] 🎉 Unlocking ${achievement.type}!`);
        await unlockAchievement(userId, achievement.type, languageId);
        newlyUnlocked.push(achievement);
      }
    }
  } catch (error) {
    console.error(
      '[ACHIEVEMENTS] Error checking language achievements:',
      error,
    );
  }

  return newlyUnlocked;
}

/**
 * Check for new polyglot achievements and unlock them
 */
export async function checkAndUnlockPolyglotAchievements(
  userId: string,
): Promise<AchievementDefinition[]> {
  const newlyUnlocked: AchievementDefinition[] = [];

  try {
    // Get all language stats for this user
    const {data: allLangStats} = await supabase
      .from('user_language_stats')
      .select('*')
      .eq('user_id', userId);

    if (!allLangStats || allLangStats.length === 0) {
      return [];
    }

    // Build polyglot data
    const languagesStarted = allLangStats.length;
    const languagesWithXP = new Map<string, number>();

    for (const langStat of allLangStats) {
      languagesWithXP.set(langStat.language_id, langStat.total_xp || 0);
    }

    const polyglotData = {languagesStarted, languagesWithXP};

    // Get already unlocked polyglot achievements (language_id is null for polyglot)
    const {data: unlocked} = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .is('language_id', null);

    const unlockedTypes = new Set(unlocked?.map(a => a.achievement_id) || []);

    // Check each polyglot achievement
    for (const achievement of POLYGLOT_ACHIEVEMENTS) {
      if (
        !unlockedTypes.has(achievement.type) &&
        achievement.condition(
          undefined as any,
          undefined,
          undefined,
          polyglotData,
        )
      ) {
        await unlockAchievement(userId, achievement.type, null);
        newlyUnlocked.push(achievement);
      }
    }
  } catch (error) {
    console.error('Error checking polyglot achievements:', error);
  }

  return newlyUnlocked;
}

/**
 * Unlock a specific achievement
 */
export async function unlockAchievement(
  userId: string,
  achievementType: string,
  languageId: string | null,
): Promise<void> {
  const {error} = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievementType,
    language_id: languageId,
    unlocked_at: new Date().toISOString(),
  });

  if (error) {
    // Check for duplicate key error (already unlocked)
    if (error.code === '23505') {
      console.log(`Achievement ${achievementType} already unlocked`);
      return;
    }

    if (
      (error.code === 'PGRST204' && error.message.includes('achievement_id')) ||
      error.code === 'PGRST205' // Missing table
    ) {
      console.warn(
        'Achievements disabled: The "user_achievements" table is missing. Please run the migration.',
      );
    } else {
      console.error('Error unlocking achievement:', error);
    }
  } else {
    console.log(
      `Achievement unlocked: ${achievementType} for language: ${languageId || 'polyglot'}`,
    );

    // Queue notification immediately after successful unlock
    try {
      // Find the achievement definition
      const allAchievements = [
        ...LANGUAGE_ACHIEVEMENTS,
        ...POLYGLOT_ACHIEVEMENTS,
      ];
      const achievementDef = allAchievements.find(
        a => a.type === achievementType,
      );

      if (achievementDef) {
        // Dynamically import to avoid circular dependency
        const {useAchievementStore} = await import('@/stores/achievementStore');

        console.log(
          `[ACHIEVEMENTS] 🎉 Queueing notification for: ${achievementDef.title}`,
        );

        useAchievementStore.getState().queueNotification({
          id: achievementDef.id,
          title: achievementDef.title,
          description: achievementDef.description,
          icon: achievementDef.icon,
          conditionType: 'xp',
          conditionValue: 0,
          scope: achievementDef.scope,
          languageId: languageId || undefined,
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
        });
      }
    } catch (notificationError) {
      console.error(
        '[ACHIEVEMENTS] Error queueing notification:',
        notificationError,
      );
    }
  }
}

/**
 * Get all achievements for a user, grouped by language
 */
export async function getUserAchievements(
  userId: string,
): Promise<Map<string, AchievementDefinition[]>> {
  const achievementsByLanguage = new Map<string, AchievementDefinition[]>();

  try {
    const {data: unlocked} = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (!unlocked) {
      return achievementsByLanguage;
    }

    for (const record of unlocked) {
      const languageKey = record.language_id || 'polyglot';
      const achievement = ALL_ACHIEVEMENTS.find(
        a => a.type === record.achievement_id,
      );

      if (achievement) {
        if (!achievementsByLanguage.has(languageKey)) {
          achievementsByLanguage.set(languageKey, []);
        }
        achievementsByLanguage.get(languageKey)!.push({
          ...achievement,
          // Mark as unlocked in the returned object if needed
        });
      }
    }
  } catch (error) {
    console.error('Error getting user achievements:', error);
  }

  return achievementsByLanguage;
}

// Legacy function for backward compatibility
export async function checkAndUnlockAchievements(
  userId: string,
  stats: UserStats,
  progress: LessonProgress,
  languageId: string = 'irish_std',
): Promise<void> {
  // Delegate to new language-specific function
  await checkAndUnlockLanguageAchievements(userId, languageId);
  // Also check polyglot achievements
  await checkAndUnlockPolyglotAchievements(userId);
}
