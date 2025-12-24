import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '@/components/shared';
import {ProgressBar} from '@/components/shared/ProgressBar';
import {spacing, typography} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface LessonProgressBarProps {
  current: number;
  total: number;
  completedCount: number;
  unitLabel?: string;
}

export const LessonProgressBar: React.FC<LessonProgressBarProps> = ({
  current,
  total,
  completedCount,
  unitLabel = 'Sentence',
}) => {
  const {colors} = useTheme();
  const progress = total > 0 ? (completedCount / total) * 100 : 0;

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      container: {
        marginBottom: spacing.md,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: themeColors.border,
        paddingTop: spacing.md,
      },
      label: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: themeColors.text.secondary,
      },
      completed: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
        color: themeColors.tiontuGreen,
      },
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {unitLabel} {current + 1} of {total}
        </Text>
        <Text style={styles.completed}>
          {completedCount === total
            ? 'All completed!'
            : `${completedCount} completed`}
        </Text>
      </View>
      <ProgressBar progress={progress} color={colors.tiontuGreen} />
    </View>
  );
};
