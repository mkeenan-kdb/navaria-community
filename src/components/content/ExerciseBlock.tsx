import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Feather, ChevronRight, Shuffle, Puzzle} from 'lucide-react-native';
import {useTheme, CircularAvatar, ProgressIndicator} from '@/components/shared';
import {
  typography,
  spacing,
  borderRadius,
  sizes,
  opacity,
  withOpacity,
} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import type {
  ContentBlock,
  ExerciseBlockContent,
  Exercise,
  LessonProgress,
} from '@/types';
import {loadExercise} from '@/services/dynamicContent';

interface Props {
  block: ContentBlock;
  onPress?: (exerciseId: string) => void;
  progress?: LessonProgress; // Direct progress object (legacy/specific)
  lessonProgress?: LessonProgress; // Parent lesson progress containing completed sentence IDs
}

export const ExerciseBlock: React.FC<Props> = ({
  block,
  onPress,
  progress,
  lessonProgress,
}) => {
  const {colors} = useTheme();
  const content = block.content as ExerciseBlockContent;
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  const legacySentences = (content as any).sentences;

  useEffect(() => {
    let mounted = true;

    // If we have units in the content (Preview Mode), use them directly
    if (content.units) {
      setExercise({
        id: content.exerciseId || 'preview',
        lessonId: block.parentId,
        title: content.title || 'Untitled Exercise',
        type: content.type || 'standard',
        displayOrder: 0,
        estimatedMinutes: 5,
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        units: content.units.map((u, i) => ({
          id: `preview_${i}`,
          exerciseId: content.exerciseId || 'preview',
          unitType: u.unitType,
          content: u.content,
          metadata: u.metadata,
          displayOrder: i,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        sentences: [], // Ensure legacy prop is empty
      } as any);
      setLoading(false);
      return;
    }

    // Legacy support for sentences in preview (can be removed if confirmed no longer used)
    const legacyContent = content as any;
    if (legacyContent.sentences) {
      setExercise({
        id: content.exerciseId || 'preview',
        lessonId: block.parentId,
        title: content.title || 'Untitled Exercise',
        type: content.type || 'standard',
        displayOrder: 0,
        estimatedMinutes: 5,
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sentences: legacyContent.sentences.map((s: any, i: number) => ({
          id: `preview_${i}`,
          exerciseId: content.exerciseId || 'preview',
          sourceText: s.source,
          targetText: s.target,
          displayOrder: i,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      } as any);
      setLoading(false);
      return;
    }

    const fetchExercise = async () => {
      try {
        const data = await loadExercise(content.exerciseId);
        if (mounted) {
          setExercise(data);
        }
      } catch (error) {
        console.error('Failed to load exercise for block:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchExercise();
    return () => {
      mounted = false;
    };
  }, [
    content.exerciseId,
    content.units,
    legacySentences,
    block.parentId,
    content,
  ]);

  const styles = useThemedStyles(themeColors => {
    return {
      container: {
        marginBottom: spacing.md,
        marginHorizontal: spacing.md,
        backgroundColor: themeColors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: themeColors.border,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      } as ViewStyle,
      content: {
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
      } as ViewStyle,
      infoContainer: {
        flex: 1,
        marginLeft: spacing.md,
      } as ViewStyle,
      title: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.bold,
        color: themeColors.text.primary,
        marginBottom: 2,
      } as TextStyle,
      description: {
        fontSize: typography.sizes.sm,
        color: themeColors.text.secondary,
        marginBottom: 4,
      } as TextStyle,
      metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      } as ViewStyle,
      metaText: {
        fontSize: typography.sizes.xs,
        color: themeColors.text.tertiary,
        marginRight: spacing.sm,
      } as TextStyle,
      statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: themeColors.surfaceSubtle,
      } as ViewStyle,
      statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: themeColors.text.secondary,
      } as TextStyle,
      actionButton: {
        padding: spacing.sm,
      } as ViewStyle,
    };
  });

  if (loading) {
    return (
      <View
        style={[styles.container, {padding: spacing.lg, alignItems: 'center'}]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!exercise) {
    return null;
  }

  const getIcon = () => {
    switch (exercise.type) {
      case 'matching_pairs':
        return {
          icon: Shuffle,
          color: colors.warning,
        };
      case 'cloze':
        return {
          icon: Puzzle,
          color: colors.info,
        };
      default:
        return {icon: Feather, color: colors.primary};
    }
  };

  const iconConfig = getIcon();

  const totalUnits = exercise.units?.length || exercise.sentenceCount || 0;

  // Calculate completion
  // Calculate completion
  let completionCount = 0;
  if (progress) {
    completionCount = progress.completionCount;
  } else if (lessonProgress && exercise) {
    // New architecture: lessonProgress tracks completed EXERCISE IDs
    const completedIds = new Set(lessonProgress.completedUnitIds || []);
    const isCompleted = completedIds.has(exercise.id || content.exerciseId);
    if (isCompleted) {
      completionCount = totalUnits;
    }
  }

  const percent = totalUnits > 0 ? (completionCount / totalUnits) * 100 : 0;
  const isComplete = percent >= 100;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(exercise.id)}
      activeOpacity={opacity.hover}>
      <View style={styles.content}>
        <CircularAvatar
          size="md"
          icon={iconConfig.icon}
          backgroundColor={withOpacity(iconConfig.color, opacity.tint20)}
          iconColor={iconConfig.color}
        />

        <View style={styles.infoContainer}>
          <Text style={styles.title}>{exercise.title}</Text>
          <Text style={styles.description}>
            {content.description || "Practice what you've learned"}
          </Text>

          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>{totalUnits} units</Text>
            {isComplete && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: withOpacity(
                      colors.success,
                      opacity.tint20,
                    ),
                  },
                ]}>
                <Text style={[styles.statusText, {color: colors.success}]}>
                  COMPLETED
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionButton}>
          <ChevronRight size={sizes.icon.md} color={colors.text.tertiary} />
        </View>
      </View>

      {/* Progress Bar */}
      {completionCount > 0 && (
        <ProgressIndicator
          completed={completionCount}
          total={totalUnits}
          color={iconConfig.color}
          showLabel={false}
          height={4}
          style={{width: '100%', borderRadius: 0}}
        />
      )}
    </TouchableOpacity>
  );
};
