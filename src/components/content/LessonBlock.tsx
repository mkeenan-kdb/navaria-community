import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Lock, LockOpen, Clock, Star} from 'lucide-react-native';
import {useTheme} from '@/components/shared';
import {typography, spacing} from '@/theme';
import type {
  ContentBlock,
  LessonBlockContent,
  Lesson,
  LessonProgress,
} from '@/types';
import {supabase} from '@/services/supabase';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface Props {
  block: ContentBlock;
  onPress?: (lessonId: string) => void;
  progress?: LessonProgress | null;
  isLocked?: boolean;
}

export const LessonBlock: React.FC<Props> = ({
  block,
  onPress,
  progress,
  isLocked: externalIsLocked,
}) => {
  const {colors} = useTheme();
  const common = createCommonStyles(colors);
  const content = block.content as LessonBlockContent;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchLesson = async () => {
      try {
        const {data, error} = await supabase
          .from('lessons')
          .select('*')
          .eq('id', content.lessonId)
          .single();

        if (error) {
          throw error;
        }

        if (mounted && data) {
          const lessonData = data as any;
          // Map DB response to Lesson type
          const mappedLesson: Lesson = {
            id: lessonData.id,
            courseId: lessonData.course_id,
            title: lessonData.title,
            titleTarget: lessonData.title_target || undefined,
            description: lessonData.description || undefined,
            iconName: lessonData.icon_name || undefined,
            iconUrl: lessonData.icon_url || undefined,
            displayOrder: lessonData.display_order,
            estimatedMinutes: lessonData.estimated_minutes,
            isAvailable: lessonData.is_available,
            createdAt: lessonData.created_at,
            updatedAt: lessonData.updated_at,
            requiresPrerequisites: lessonData.requires_prerequisites,
            unlockDescription: lessonData.unlock_description || undefined,
          };
          setLesson(mappedLesson);
        }
      } catch (error) {
        console.error('Failed to load lesson for block:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLesson();
    return () => {
      mounted = false;
    };
  }, [content.lessonId]);

  const styles = useThemedStyles(themeColors => {
    return {
      lessonCardExtra: {
        backgroundColor: themeColors.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: themeColors.border,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: spacing.md,
      } as ViewStyle,
      lockedCardExtra: {
        backgroundColor: themeColors.surfaceSubtle || themeColors.background,
        opacity: 0.8,
      } as ViewStyle,
      lessonHeaderExtra: {
        marginBottom: spacing.xs,
      } as ViewStyle,
      lessonTitleExtra: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: themeColors.text.primary,
        flex: 1,
        marginRight: spacing.sm,
      } as TextStyle,
      lessonSubtitleExtra: {
        fontSize: typography.sizes.base,
        color: themeColors.text.secondary,
        marginBottom: spacing.sm,
      } as TextStyle,
      lessonMetaExtra: {
        gap: spacing.md,
      } as ViewStyle,
      metaItemExtra: {
        gap: 4,
      } as ViewStyle,
      metaTextExtra: {
        fontSize: typography.sizes.xs,
        color: themeColors.text.secondary,
      } as TextStyle,
    };
  });

  if (loading) {
    return (
      <View
        style={[
          styles.lessonCardExtra,
          {padding: spacing.lg, alignItems: 'center'},
        ]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!lesson) {
    return null;
  }

  const isLocked =
    externalIsLocked !== undefined
      ? externalIsLocked
      : lesson.requiresPrerequisites;

  return (
    <TouchableOpacity
      style={[styles.lessonCardExtra, isLocked && styles.lockedCardExtra]}
      onPress={() => onPress?.(lesson.id)}
      activeOpacity={0.7}>
      <View style={common.flex1}>
        <View style={[common.rowBetween, styles.lessonHeaderExtra]}>
          <Text style={styles.lessonTitleExtra}>{lesson.title}</Text>
          {isLocked ? (
            <Lock size={20} color={colors.text.secondary} />
          ) : (
            <LockOpen size={20} color={colors.success} />
          )}
        </View>

        {lesson.titleTarget && (
          <Text style={styles.lessonSubtitleExtra}>{lesson.titleTarget}</Text>
        )}

        <View style={[common.row, styles.lessonMetaExtra]}>
          <View style={[common.row, styles.metaItemExtra]}>
            <Clock size={14} color={colors.text.secondary} />
            <Text style={styles.metaTextExtra}>
              {lesson.estimatedMinutes || 5} min
            </Text>
          </View>

          {!isLocked && (
            <View style={[common.row, styles.metaItemExtra]}>
              {(progress?.completionCount ?? 0) > 0 ? (
                <>
                  <Star
                    size={14}
                    color={colors.success}
                    fill={colors.success}
                  />
                  <Text style={[styles.metaTextExtra, {color: colors.success}]}>
                    Completed
                  </Text>
                </>
              ) : progress && progress.totalUnits > 0 ? (
                <>
                  <Star size={14} color={colors.primary} />
                  <Text style={styles.metaTextExtra}>
                    {progress.completedUnitIds.length}/{progress.totalUnits}{' '}
                    exercises
                  </Text>
                </>
              ) : (
                <>
                  <Star size={14} color={colors.warning} />
                  <Text style={styles.metaTextExtra}>Start</Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
