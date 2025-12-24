import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {BookOpen} from 'lucide-react-native';
import {Badge} from '@/components/shared/Badge';
import {ProgressBar} from '@/components/shared/ProgressBar';
import {useTheme} from '@/components/shared';
import {Card} from '@/components/shared/Card';
import {spacing, typography, borderRadius} from '@/theme';
import type {Lesson} from '@/types';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface LessonSetCardProps {
  lesson: Lesson & {exerciseCount?: number};
  progress: number; // 0-100
  onPress: () => void;
}

export const LessonSetCard: React.FC<LessonSetCardProps> = ({
  lesson,
  progress,
  onPress,
}) => {
  const {colors} = useTheme();

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      card: {
        marginBottom: spacing.md,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
      },
      numberBadge: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: themeColors.tiontuGold + '20',
      },
      numberText: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: themeColors.tiontuGold,
      },
      title: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        marginBottom: spacing.xs,
        color: themeColors.primary,
        fontFamily: typography.fonts.regular,
      },
      description: {
        fontSize: typography.sizes.sm,
        marginBottom: spacing.md,
        color: themeColors.text.secondary,
      },
      progressBar: {
        marginBottom: spacing.md,
      },
      footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      lessonCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
      },
      lessonCountText: {
        fontSize: typography.sizes.sm,
        color: themeColors.text.tertiary,
      },
    };
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        {/* Lesson Number Badge */}
        <View style={styles.header}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{lesson.displayOrder}</Text>
          </View>
          {progress > 0 && (
            <Badge variant="success" size="sm">
              {progress}%
            </Badge>
          )}
        </View>

        {/* Lesson Title & Description */}
        <Text style={styles.title} numberOfLines={1}>
          {lesson.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {lesson.description}
        </Text>

        {/* Progress Bar */}
        {progress > 0 && (
          <ProgressBar progress={progress} style={styles.progressBar} />
        )}

        {/* Exercise Count */}
        <View style={styles.footer}>
          <View style={styles.lessonCount}>
            <BookOpen size={16} color={colors.text.tertiary} />
            <Text style={styles.lessonCountText}>
              {lesson.exerciseCount || lesson.exercises?.length || 0} exercises
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
