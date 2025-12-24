import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useTheme, ProgressIndicator} from '@/components/shared';
import {Feather, Check} from 'lucide-react-native';
import {spacing, typography, sizes, opacity, withOpacity} from '@/theme';
import type {Exercise, LessonProgress} from '@/types';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface ExerciseCardProps {
  exercise: Exercise;
  progress?: LessonProgress;
  onPress: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  progress,
  onPress,
}) => {
  const {colors} = useTheme();

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      container: {
        marginBottom: spacing.lg,
      },
      exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: 'transparent',
      },
      iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      completionBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: themeColors.white,
        backgroundColor: themeColors.tiontuGreen,
      },
      exerciseInfo: {
        flex: 1,
        gap: spacing.xs,
      },
      exerciseTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        marginBottom: spacing.xs / 2,
        color: themeColors.text.primary,
      },
      exerciseType: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      exerciseDetails: {
        fontSize: typography.sizes.sm,
        marginBottom: spacing.xs,
        color: themeColors.text.secondary,
      },
    };
  });

  const getExerciseIcon = () => {
    switch (exercise.type) {
      case 'cloze':
        return Feather; // Fill-in-the-blank
      case 'matching_pairs':
        return Feather; // Matching pairs
      default:
        return Feather; // Standard typing
    }
  };

  const getExerciseColor = () => {
    switch (exercise.type) {
      case 'cloze':
        return colors.accent; // Blue for cloze
      case 'matching_pairs':
        return colors.secondary; // Orange for matching pairs
      default:
        return colors.primary; // Green for standard
    }
  };

  const getExerciseType = () => {
    switch (exercise.type) {
      case 'cloze':
        return 'Cloze';
      case 'matching_pairs':
        return 'Matching';
      default:
        return 'Standard';
    }
  };

  const totalSentences = progress?.totalUnits || exercise.sentenceCount || 3;
  const completionPercentage = progress
    ? Math.min(100, (progress.completionCount / totalSentences) * 100)
    : 0;

  const isCompleted = completionPercentage >= 100;
  const exerciseColor = getExerciseColor();
  const IconComponent = getExerciseIcon();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={opacity.hover}
      style={styles.container}>
      <View style={styles.exerciseCard}>
        {/* Circular Icon Container */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isCompleted
                ? exerciseColor
                : withOpacity(exerciseColor, opacity.tint20),
              borderColor: exerciseColor,
            },
          ]}>
          <IconComponent
            size={sizes.icon.lg}
            color={isCompleted ? colors.white : exerciseColor}
          />

          {/* Completion Badge */}
          {isCompleted && (
            <View style={styles.completionBadge}>
              <Check size={sizes.icon.xs} color={colors.white} />
            </View>
          )}
        </View>

        {/* Exercise Info */}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
          <Text style={[styles.exerciseType, {color: exerciseColor}]}>
            {getExerciseType()}
          </Text>
          <Text style={styles.exerciseDetails}>
            {exercise.sentenceCount || exercise.sentences?.length || 0}{' '}
            sentences
          </Text>

          {/* Progress Indicator */}
          {progress && progress.completionCount > 0 && (
            <ProgressIndicator
              completed={progress.completionCount}
              total={totalSentences}
              color={exerciseColor}
              showLabel={true}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
