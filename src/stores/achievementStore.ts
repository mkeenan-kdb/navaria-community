import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {supabase} from '@/services/supabase';
import type {Achievement} from '@/types/user';
import type {Tables} from '@/types';
import {
  LANGUAGE_ACHIEVEMENTS,
  POLYGLOT_ACHIEVEMENTS,
  type AchievementDefinition,
} from '@/services/achievements';
import {createStorage} from '@/services/storage';

const achievementStorage = createStorage('achievement-storage');

interface AchievementState {
  // Achievements grouped by language (languageId -> achievements)
  achievementsByLanguage: Map<string, Achievement[]>;
  polyglotAchievements: Achievement[];

  // Current language filter
  currentLanguageId: string | null;

  // Global notification queue (supports multiple achievements)
  notificationQueue: Achievement[];
  showNotification: boolean;

  // Initialization state
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: (userId: string) => Promise<void>;
  setCurrentLanguage: (languageId: string | null) => void;
  getAchievementsForLanguage: (languageId: string) => Achievement[];
  unlockAchievement: (id: string, languageId?: string) => void;
  queueNotification: (achievement: Achievement) => void;
  dismissNotification: () => void;
  reset: () => void;
}

// Convert AchievementDefinition to Achievement for UI
function toAchievement(
  def: AchievementDefinition,
  languageId?: string,
): Achievement {
  return {
    id: def.id,
    title: def.title,
    description: def.description,
    icon: def.icon,
    conditionType: 'xp', // Default, not really used anymore
    conditionValue: 0,
    scope: def.scope,
    languageId,
    isUnlocked: false,
  };
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievementsByLanguage: new Map(),
      polyglotAchievements: POLYGLOT_ACHIEVEMENTS.map(def =>
        toAchievement(def),
      ),
      currentLanguageId: null,
      notificationQueue: [],
      showNotification: false,

      // Initialization state
      isInitialized: false,
      isLoading: false,

      initialize: async (userId: string) => {
        const state = get();
        // Prevent multiple initializations
        if (state.isLoading) {
          return;
        }

        try {
          set({isLoading: true});
          console.log(
            '[ACHIEVEMENT_STORE] Initializing achievements for user:',
            userId,
          );

          // Query all unlocked achievements from database
          const {data: unlockedAchievements, error} = (await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId)) as {
            data: Tables<'user_achievements'>[] | null;
            error: any;
          };

          if (error) {
            console.error(
              '[ACHIEVEMENT_STORE] Error loading achievements:',
              error,
            );
            // Initialize with empty state on error
            set({
              achievementsByLanguage: new Map(),
              polyglotAchievements: POLYGLOT_ACHIEVEMENTS.map(def =>
                toAchievement(def),
              ),
              isLoading: false,
              isInitialized: true,
            });
            return;
          }

          const unlocked = unlockedAchievements || [];
          console.log(
            '[ACHIEVEMENT_STORE] Loaded',
            unlocked.length,
            'unlocked achievements',
          );

          // Build map of unlocked achievements by language and type
          const unlockedByLanguage = new Map<string, Set<string>>();
          const unlockedPolyglot = new Set<string>();

          for (const record of unlocked) {
            if (record.language_id === null) {
              // Polyglot achievement
              unlockedPolyglot.add(record.achievement_id);
            } else {
              // Language-specific achievement
              if (!unlockedByLanguage.has(record.language_id)) {
                unlockedByLanguage.set(record.language_id, new Set());
              }
              unlockedByLanguage
                .get(record.language_id)!
                .add(record.achievement_id);
            }
          }

          // Build achievementsByLanguage Map
          const achievementsByLanguage = new Map<string, Achievement[]>();

          // For each language that has unlocked achievements, create the full list
          for (const [
            languageId,
            unlockedTypes,
          ] of unlockedByLanguage.entries()) {
            const achievements = LANGUAGE_ACHIEVEMENTS.map(def => {
              const isUnlocked = unlockedTypes.has(def.type);
              const record = unlocked.find(
                r =>
                  r.language_id === languageId && r.achievement_id === def.type,
              );

              return {
                id: def.id,
                title: def.title,
                description: def.description,
                icon: def.icon,
                conditionType: 'xp' as const,
                conditionValue: 0,
                scope: def.scope,
                languageId,
                isUnlocked,
                unlockedAt: record?.unlocked_at || undefined,
              };
            });
            achievementsByLanguage.set(languageId, achievements);
          }

          // Build polyglot achievements with unlocked state
          const polyglotAchievements = POLYGLOT_ACHIEVEMENTS.map(def => {
            const isUnlocked = unlockedPolyglot.has(def.type);
            const record = unlocked.find(
              r => r.language_id === null && r.achievement_id === def.type,
            );

            return {
              id: def.id,
              title: def.title,
              description: def.description,
              icon: def.icon,
              conditionType: 'xp' as const,
              conditionValue: 0,
              scope: def.scope,
              languageId: undefined,
              isUnlocked,
              unlockedAt: record?.unlocked_at || undefined,
            };
          });

          console.log(
            '[ACHIEVEMENT_STORE] Initialized with',
            achievementsByLanguage.size,
            'languages',
          );
          console.log(
            '[ACHIEVEMENT_STORE] Polyglot unlocked:',
            Array.from(unlockedPolyglot),
          );

          // Preserve notification queue during initialization
          const currentState = get();
          set({
            achievementsByLanguage,
            polyglotAchievements,
            notificationQueue: currentState.notificationQueue,
            showNotification: currentState.showNotification,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error(
            '[ACHIEVEMENT_STORE] Fatal error during initialization:',
            error,
          );
          // Fallback to empty state
          set({
            achievementsByLanguage: new Map(),
            polyglotAchievements: POLYGLOT_ACHIEVEMENTS.map(def =>
              toAchievement(def),
            ),
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      setCurrentLanguage: (languageId: string | null) => {
        set({currentLanguageId: languageId});
      },

      getAchievementsForLanguage: (languageId: string) => {
        const state = get();
        const existing = state.achievementsByLanguage.get(languageId);
        if (existing) {
          return existing;
        }

        // Initialize achievements for this language
        const newAchievements = LANGUAGE_ACHIEVEMENTS.map(def =>
          toAchievement(def, languageId),
        );

        const newMap = new Map(state.achievementsByLanguage);
        newMap.set(languageId, newAchievements);

        set({achievementsByLanguage: newMap});
        return newAchievements;
      },

      unlockAchievement: (id: string, languageId?: string) => {
        const state = get();

        if (languageId) {
          // Language-specific achievement
          // Ensure achievements exist for this language first
          let achievements = state.achievementsByLanguage.get(languageId);

          if (!achievements) {
            // Initialize achievements for this language if they don't exist
            console.log(
              '[ACHIEVEMENT_STORE] Initializing achievements for',
              languageId,
            );
            achievements = LANGUAGE_ACHIEVEMENTS.map(def =>
              toAchievement(def, languageId),
            );
          }

          const updatedAchievements = achievements.map(a =>
            a.id === id
              ? {...a, isUnlocked: true, unlockedAt: new Date().toISOString()}
              : a,
          );

          const newMap = new Map(state.achievementsByLanguage);
          newMap.set(languageId, updatedAchievements);
          set({achievementsByLanguage: newMap});

          console.log(
            '[ACHIEVEMENT_STORE] Unlocked achievement:',
            id,
            'for language:',
            languageId,
          );
        } else {
          // Polyglot achievement
          const updatedPolyglot = state.polyglotAchievements.map(a =>
            a.id === id
              ? {...a, isUnlocked: true, unlockedAt: new Date().toISOString()}
              : a,
          );
          set({polyglotAchievements: updatedPolyglot});

          console.log('[ACHIEVEMENT_STORE] Unlocked polyglot achievement:', id);
        }
      },

      queueNotification: (achievement: Achievement) => {
        console.log(
          '[ACHIEVEMENT_STORE] Queueing notification for:',
          achievement.title,
        );
        const state = get();
        const newQueue = [...state.notificationQueue, achievement];

        // Only update showNotification if it's currently false
        // If it's already true, we don't want to interrupt the current notification
        const shouldShow =
          state.notificationQueue.length === 0 || state.showNotification;

        set({
          notificationQueue: newQueue,
          showNotification: shouldShow,
        });
      },

      dismissNotification: () => {
        console.log('[ACHIEVEMENT_STORE] Dismissing notification');
        const state = get();

        // Remove the first item from the queue
        const newQueue = state.notificationQueue.slice(1);

        // If there are more items, show the next one after a brief delay
        if (newQueue.length > 0) {
          setTimeout(() => {
            const currentState = get();
            if (currentState.notificationQueue.length > 0) {
              console.log(
                '[ACHIEVEMENT_STORE] Showing next notification:',
                currentState.notificationQueue[0].title,
              );
              set({showNotification: true});
            }
          }, 500); // 500ms delay between notifications
        }

        set({
          notificationQueue: newQueue,
          showNotification: false,
        });
      },

      reset: () => {
        set({
          achievementsByLanguage: new Map(),
          polyglotAchievements: POLYGLOT_ACHIEVEMENTS.map(def =>
            toAchievement(def),
          ),
          currentLanguageId: null,
          notificationQueue: [],
          showNotification: false,
          isLoading: false,
          isInitialized: false,
        });
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => achievementStorage),
      // Custom serialization for Map
      partialize: state => ({
        achievementsByLanguage: Array.from(
          state.achievementsByLanguage.entries(),
        ),
        polyglotAchievements: state.polyglotAchievements,
        currentLanguageId: state.currentLanguageId,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        achievementsByLanguage: new Map(
          persistedState.achievementsByLanguage || [],
        ),
      }),
    },
  ),
);
