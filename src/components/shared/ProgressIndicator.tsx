import React from 'react';
import {View, Text, ViewStyle} from 'react-native';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {useTheme} from '@/components/shared/ThemeProvider';
import {spacing, typography, opacity, withOpacity} from '@/theme';
import {ThemeColors} from '@/theme/colors';

interface ProgressIndicatorProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
  style?: ViewStyle;
}

const createStyles = (colors: ThemeColors, height: number, color: string) => ({
  container: {
    gap: spacing.xs / 2,
  },
  track: {
    height,
    borderRadius: height / 2,
    backgroundColor: withOpacity(color, opacity.tint20),
    overflow: 'hidden' as const,
  },
  fill: {
    height: '100%' as import('react-native').DimensionValue,
    borderRadius: height / 2,
    backgroundColor: color,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
});

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = React.memo(
  ({completed, total, showLabel = true, height = 4, color, style}) => {
    const {colors} = useTheme();

    // Default to primary color if none provided
    const effectiveColor = color || colors.primary;

    const styles = useThemedStyles(themeColors =>
      createStyles(themeColors, height, effectiveColor),
    );

    const percentage = total > 0 ? Math.min(100, (completed / total) * 100) : 0;

    if (completed <= 0 && total <= 0) {
      return null;
    }

    return (
      <View style={[styles.container, style]}>
        <View style={styles.track}>
          <View style={[styles.fill, {width: `${percentage}%`}]} />
        </View>
        {showLabel && (
          <Text style={styles.label}>
            {completed}/{total} completed
          </Text>
        )}
      </View>
    );
  },
);

ProgressIndicator.displayName = 'ProgressIndicator';
