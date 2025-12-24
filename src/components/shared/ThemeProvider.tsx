import React, {createContext, useContext, ReactNode} from 'react';
import {useColorScheme} from 'react-native';
import {useThemeStore} from '@/stores/themeStore';
import {useFontStore} from '@/stores/fontStore';
import {colors, type ThemeColors} from '@/theme';

interface ThemeContextValue {
  colors: ThemeColors & typeof colors;
  isDark: boolean;
  toggleTheme: () => void;
  fontFamily: string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<
  ThemeProviderProps & {forcedTheme?: 'light' | 'dark'}
> = ({children, forcedTheme}) => {
  const systemColorScheme = useColorScheme();
  const {themeMode, toggleTheme} = useThemeStore();
  const {currentFont} = useFontStore();

  // Determine if dark mode based on theme mode and system preference, or forced theme
  const isDark = forcedTheme
    ? forcedTheme === 'dark'
    : themeMode === 'dark' ||
      (themeMode === 'system' && systemColorScheme === 'dark');

  const themeColors = isDark ? colors.dark : colors.light;

  const value: ThemeContextValue = {
    colors: {
      ...colors,
      ...themeColors,
    },
    isDark,
    toggleTheme,
    fontFamily: currentFont,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
