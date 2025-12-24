// Theme store using Zustand

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {Appearance} from 'react-native';
import {createStorage} from '@/services/storage';
import type {ThemeMode} from '@/types';

interface ThemeState {
  // State
  themeMode: ThemeMode;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  // Computed
  isDark: () => boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      themeMode: 'light',

      // Set theme mode
      setThemeMode: (mode: ThemeMode) => {
        set({themeMode: mode});

        // Sync to user profile if logged in
        try {
          // Use require to avoid circular dependency
          const {useUserStore} = require('./userStore');
          const {user, updateProfile} = useUserStore.getState();
          if (user) {
            updateProfile({themeMode: mode}).catch((err: any) =>
              console.warn('Failed to sync theme to profile:', err),
            );
          }
        } catch (err) {
          console.warn('Failed to access user store:', err);
        }
      },

      // Toggle theme
      toggleTheme: () => {
        const current = get().themeMode;
        const newMode = current === 'light' ? 'dark' : 'light';
        get().setThemeMode(newMode);
      },

      // Check if dark mode
      isDark: () => {
        const state = get();
        // Use Appearance.getColorScheme() instead of useColorScheme() hook
        // This works outside of React components
        const systemColorScheme = Appearance.getColorScheme();

        // If theme is set to system preference
        if (state.themeMode === 'dark') {
          return true;
        }
        if (state.themeMode === 'light') {
          return false;
        }

        // Default to system
        return systemColorScheme === 'dark';
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => createStorage('theme-storage')),
    },
  ),
);
