import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from './ThemeProvider';

export const ThemedStatusBar: React.FC = () => {
    const { isDark } = useTheme();

    return <StatusBar style={isDark ? 'light' : 'dark'} />;
};
