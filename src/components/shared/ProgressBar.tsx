import React from 'react';
import {View, ViewStyle} from 'react-native';
import {useTheme} from './ThemeProvider';
import {borderRadius} from '@/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(
  ({progress, height = 8, color, backgroundColor, style}) => {
    const {colors} = useTheme();

    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
      <View
        style={[
          {
            height,
            backgroundColor: backgroundColor || colors.border,
            borderRadius: borderRadius.full,
            overflow: 'hidden',
          },
          style,
        ]}>
        <View
          style={{
            height: '100%',
            width: `${clampedProgress}%`,
            backgroundColor: color || colors.tiontuGreen,
            borderRadius: borderRadius.full,
          }}
        />
      </View>
    );
  },
);
