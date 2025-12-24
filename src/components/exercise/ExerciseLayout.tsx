import React from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppBar} from '@/components/shared';
import {LessonProgressBar} from '@/components/lesson/LessonProgressBar';
import {spacing} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {ThemeColors} from '@/theme/colors';

interface ExerciseLayoutProps {
  title?: string;
  totalUnits: number;
  completedCount: number;
  currentIndex: number;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
  showExerciseSettings?: boolean;
  unitLabel?: string;
}

// Styles factory using theme constants
const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressWrapper: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
});

export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({
  title,
  totalUnits,
  completedCount,
  currentIndex,
  onClose,
  children,
  footer,
  headerRight,
  showExerciseSettings,
  unitLabel,
}) => {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppBar
        title={title}
        showBack={false}
        showClose
        onClosePress={onClose}
        useCelticFont
        rightElement={headerRight}
        showExerciseSettings={showExerciseSettings}
      />

      {/* Progress Bar */}
      <View style={styles.progressWrapper}>
        <LessonProgressBar
          current={currentIndex}
          total={totalUnits}
          completedCount={completedCount}
          unitLabel={unitLabel}
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>{children}</View>

      {/* Footer / Feedback Area */}
      {footer && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}>
          {footer}
        </View>
      )}
    </View>
  );
};
