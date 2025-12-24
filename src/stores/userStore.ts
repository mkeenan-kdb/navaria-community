// User authentication and profile store using Zustand

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStorage } from '@/services/storage';
import type { User } from '@supabase/supabase-js';
import { supabase, auth, profiles } from '@/services/supabase';
import {
  mapToUserProfile,
  mapToUserStats,
  mapToUserLanguageStats,
} from '@/types/user';
import type { UserProfile, UserStats, UserLanguageStats } from '@/types/user';
import { resetUserXP, resetUserProgress } from '@/services/progress';

interface UserState {
  // State
  user: User | null;
  profile: UserProfile | null;
  stats: UserStats | null;
  languageStats: UserLanguageStats | null;
  currentLanguageId: string;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  createProfileAndLoad: (
    displayName: string,
    avatarUrl?: string,
    languageId?: string,
  ) => Promise<void>;

  signOut: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setLanguage: (languageId: string) => Promise<void>;
  updateStreak: () => Promise<void>;
  clearError: () => void;
  resetXP: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      stats: null,
      languageStats: null,
      currentLanguageId: 'irish_std', // Default language
      isLoading: true,
      isInitialized: false,
      error: null,

      // Initialize auth state
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          // Get current session
          const session = await auth.getSession();

          if (session?.user) {
            set({ user: session.user });
            await get().loadProfile(session.user.id);
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log('[Auth] Event:', event);

            if (currentSession?.user) {
              set({ user: currentSession.user });
              // Only load profile if we have a user, and don't await it to prevent blocking (though listener is void)
              get().loadProfile(currentSession.user.id);
            } else {
              set({
                user: null,
                profile: null,
                stats: null,
                languageStats: null,
              });
            }
          });

          set({ isInitialized: true, isLoading: false });
        } catch (error) {
          console.error('Initialize error:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to initialize',
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      // Sign in
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const { user } = await auth.signIn(email, password);

          if (user) {
            set({ user });
            await get().loadProfile(user.id);
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Sign in error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to sign in',
            isLoading: false,
          });
          throw error;
        }
      },

      // Sign up
      signUp: async (email: string, password: string) => {
        try {
          set({ error: null });

          await auth.signUp(email, password);

          // We do NOT load profile here - the user needs to confirm email first
          // and then onboard.

          // We do NOT set user here.
          // If email confirmation is off, onAuthStateChange will handle the session.
          // If email confirmation is on, we don't want to log them in yet.
        } catch (error) {
          console.error('Sign up error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to sign up',
          });
          throw error;
        }
      },

      // Create profile and load (for onboarding)
      createProfileAndLoad: async (
        displayName: string,
        avatarUrl?: string,
        languageId?: string,
      ) => {
        const { user } = get();
        if (!user) {
          throw new Error('No user logged in');
        }

        try {
          set({ isLoading: true, error: null });

          await profiles.createProfile(
            user.id,
            user.email || '',
            displayName,
            avatarUrl,
            languageId,
          );
          await get().loadProfile(user.id);

          set({ isLoading: false });
        } catch (error) {
          console.error('Create profile error:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create profile',
            isLoading: false,
          });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ isLoading: true, error: null });

          await auth.signOut();

          set({
            user: null,
            profile: null,
            stats: null,
            languageStats: null,
            isLoading: false,
          });
        } catch (error) {
          console.error('Sign out error:', error);
          // Even if sign out fails, clear local state
          set({
            user: null,
            profile: null,
            stats: null,
            languageStats: null,
            error:
              error instanceof Error ? error.message : 'Failed to sign out',
            isLoading: false,
          });
        }
      },

      // Load user profile
      loadProfile: async (userId: string) => {
        try {
          const dbProfile = await profiles.getProfile(userId);
          const profile = mapToUserProfile(dbProfile);

          // Load stats
          let stats = null;
          try {
            const dbStats = await profiles.getUserStats(userId);
            if (dbStats) {
              stats = mapToUserStats(dbStats);
            }
          } catch (statsError) {
            console.warn('Failed to load user stats:', statsError);
            // Don't fail the whole profile load for stats
          }

          // Reset streak if it's broken.
          if (profile.currentStreak > 0 && profile.lastActivityDate) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000)
              .toISOString()
              .split('T')[0];
            const lastActivity = profile.lastActivityDate.split('T')[0];

            // If not today and not yesterday, it's broken
            if (lastActivity !== today && lastActivity !== yesterday) {
              console.log(
                `[loadProfile] Broken streak detected (Last: ${lastActivity}, Today: ${today}). Resetting to 0.`,
              );

              // 1. Reset local state immediately for UI
              profile.currentStreak = 0;

              // 2. Reset in DB (fire and forget)
              profiles.resetStreak(userId).catch(err => {
                console.warn(
                  '[loadProfile] Failed to persist streak reset:',
                  err,
                );
              });
            }
          }

          set({ profile, stats });

          // Sync language from profile
          if (profile.learningLanguageId) {
            set({ currentLanguageId: profile.learningLanguageId });

            // Load language stats
            try {
              const dbLangStats = await profiles.getUserLanguageStats(
                userId,
                profile.learningLanguageId,
              );
              if (dbLangStats) {
                set({ languageStats: mapToUserLanguageStats(dbLangStats) });
              } else {
                set({ languageStats: null });
              }
            } catch (langStatsError) {
              console.warn('Failed to load language stats:', langStatsError);
              set({ languageStats: null });
            }
          }

          // Sync theme from profile
          if (profile.themeMode) {
            try {
              // Use require to avoid circular dependency during initialization
              const { useThemeStore } = require('./themeStore');
              useThemeStore.getState().setThemeMode(profile.themeMode);
            } catch (err) {
              console.warn('Failed to sync theme from profile:', err);
            }
          }

          // Load achievements from database
          try {
            // Use require to avoid circular dependency during initialization
            const { useAchievementStore } = require('./achievementStore');
            await useAchievementStore.getState().initialize(userId);
            console.log('[USER_STORE] Achievements loaded successfully');
          } catch (err) {
            console.warn('Failed to load achievements:', err);
          }
        } catch (error: any) {
          // If profile not found (PGRST116), it's expected for new users. Don't log error.
          if (error?.code === 'PGRST116') {
            // Just ensure profile is null and allow the app to redirect to onboarding
            set({ profile: null });
            return;
          }

          // Handle AuthSessionMissingError or JWT/Auth errors
          const errorMessage = error?.message || '';
          const isAuthError =
            errorMessage.includes('Auth session missing') ||
            errorMessage.includes('JWT expired') ||
            errorMessage.includes('invalid claim') ||
            error?.status === 401 ||
            error?.status === 403;

          if (isAuthError) {
            console.log(
              '[loadProfile] Auth error detected, attempting session refresh...',
              {
                message: errorMessage,
                status: error?.status,
                code: error?.code,
              },
            );

            try {
              // Try to refresh the session
              const { data: refreshData, error: refreshError } =
                await supabase.auth.refreshSession();

              if (refreshError) {
                console.warn(
                  '[loadProfile] Session refresh failed:',
                  refreshError.message,
                );
              } else if (refreshData?.session) {
                console.log(
                  '[loadProfile] Session refreshed successfully, retrying profile load...',
                );
                // Don't retry immediately to avoid infinite loops - just log success
                // The next natural load will use the refreshed session
                return;
              }

              // If refresh didn't work, check if session truly exists
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                console.log(
                  '[loadProfile] Session still valid after error, continuing...',
                );
                // Session exists, this might be a transient error - don't sign out
                return;
              }

              // Only sign out if we truly have no valid session
              console.warn(
                '[loadProfile] No valid session after refresh attempt, signing out.',
              );
              get().signOut();
              return;
            } catch (refreshErr) {
              console.error(
                '[loadProfile] Error during session refresh:',
                refreshErr,
              );
              // Don't sign out on refresh error - might be network issue
              return;
            }
          }

          console.error('Load profile error:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to load profile',
          });
        }
      },

      // Update profile
      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user, profile } = get();
        if (!user || !profile) {
          throw new Error('No user logged in');
        }

        try {
          set({ error: null });

          // Map camelCase to snake_case for database
          const dbUpdates: any = {};
          if (updates.displayName !== undefined) {
            dbUpdates.display_name = updates.displayName;
          }
          if (updates.totalXP !== undefined) {
            dbUpdates.total_xp = updates.totalXP;
          }
          if (updates.currentStreak !== undefined) {
            dbUpdates.current_streak = updates.currentStreak;
          }
          if (updates.longestStreak !== undefined) {
            dbUpdates.longest_streak = updates.longestStreak;
          }
          if (updates.learningDialect !== undefined) {
            dbUpdates.learning_dialect = updates.learningDialect;
          }
          if (updates.themeMode !== undefined) {
            dbUpdates.theme_mode = updates.themeMode;
          }
          if (updates.lastActivityDate !== undefined) {
            dbUpdates.last_activity_date = updates.lastActivityDate;
          }
          if (updates.learningLanguageId !== undefined) {
            dbUpdates.learning_language_id = updates.learningLanguageId;
          }

          const updatedDb = await profiles.updateProfile(user.id, dbUpdates);
          const updatedProfile = mapToUserProfile(updatedDb);

          set({ profile: updatedProfile });
        } catch (error) {
          console.error('Update profile error:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update profile',
          });
          throw error;
        }
      },

      // Set language
      setLanguage: async (languageId: string) => {
        const { user } = get();
        if (!user) {
          // If no user, just update local state
          set({ currentLanguageId: languageId });
          return;
        }

        try {
          set({ currentLanguageId: languageId });
          await get().updateProfile({ learningLanguageId: languageId });

          // Load language stats for new language
          const { user: currentUser } = get();
          if (currentUser) {
            try {
              const dbLangStats = await profiles.getUserLanguageStats(
                currentUser.id,
                languageId,
              );
              if (dbLangStats) {
                set({ languageStats: mapToUserLanguageStats(dbLangStats) });
              } else {
                set({ languageStats: null });
              }
            } catch (langStatsError) {
              console.warn('Failed to load language stats:', langStatsError);
              set({ languageStats: null });
            }
          }
        } catch (error) {
          console.error('Set language error:', error);
          // Revert on error? Or just log it.
        }
      },

      // Update streak
      updateStreak: async () => {
        const { user } = get();
        if (!user) {
          return;
        }

        try {
          const updated = await profiles.updateStreak(user.id);
          const profile = mapToUserProfile(updated);
          set({ profile });
        } catch (error) {
          console.error('Update streak error:', error);
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Reset XP
      resetXP: async () => {
        const { user } = get();
        if (!user) {
          return;
        }

        try {
          set({ isLoading: true });
          await resetUserXP(user.id);
          await get().loadProfile(user.id);
          set({ isLoading: false });
        } catch (error) {
          console.error('Reset XP error:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to reset XP',
            isLoading: false,
          });
        }
      },

      // Reset Progress
      resetProgress: async () => {
        const { user } = get();
        if (!user) {
          return;
        }

        try {
          set({ isLoading: true });
          await resetUserProgress(user.id);

          // Also reset achievements
          const { useAchievementStore } = await import('./achievementStore');
          useAchievementStore.getState().reset();

          await get().loadProfile(user.id);
          set({ isLoading: false });
        } catch (error) {
          console.error('Reset progress error:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to reset progress',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => createStorage('user-storage')),
      partialize: state => ({
        // Only persist user and profile, not loading states
        user: state.user,
        profile: state.profile,
        stats: state.stats,
        languageStats: state.languageStats,
        currentLanguageId: state.currentLanguageId,
      }),
    },
  ),
);
