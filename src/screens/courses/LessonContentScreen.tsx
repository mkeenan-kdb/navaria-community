import React, {useEffect, useState, useCallback} from 'react';
import {View, ScrollView, StyleSheet, RefreshControl, Text} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import {CoursesStackParamList, CoursesNavigationProp} from '@/navigation/types';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {spacing} from '@/theme/spacing';
import {typography} from '@/theme/typography';
import {LessonWithContent, UnlockStatus} from '@/types/content';
import {LessonProgress} from '@/types';
import {loadLessonWithContent} from '@/services/dynamicContent';
import {getLessonProgress} from '@/services/progress';
import {checkLessonUnlockStatus} from '@/services/prerequisites';
import {useUserStore} from '@/stores/userStore';
import {ContentBlockRenderer} from '@/components/content/ContentBlockRenderer';
import {UnlockRequirementsModal} from '@/components/courses/UnlockRequirementsModal';
import {
  AppLoadingSpinner,
  ErrorMessage,
  AppBar,
  ProgressIndicator,
} from '@/components/shared';

type LessonContentRouteProp = RouteProp<CoursesStackParamList, 'LessonContent'>;

export const LessonContentScreen: React.FC = () => {
  const navigation = useNavigation<CoursesNavigationProp>();
  const route = useRoute<LessonContentRouteProp>();
  const {lessonId, courseId} = route.params;
  const styles = useThemedStyles(createStyles);
  const {user, currentLanguageId} = useUserStore();

  const [lesson, setLesson] = useState<LessonWithContent | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus>({
    isUnlocked: true,
  });
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setError(null);

      // First load lesson to get course info
      const lessonData = await loadLessonWithContent(
        lessonId,
        currentLanguageId,
      );

      if (!lessonData) {
        setError('Lesson not found');
        return;
      }

      // Use the course's language ID for loading content, not the user's current language
      const lessonLanguageId =
        lessonData.course?.languageId || currentLanguageId;

      // Reload lesson content with correct language if needed
      const finalLessonData =
        lessonLanguageId !== currentLanguageId
          ? await loadLessonWithContent(lessonId, lessonLanguageId)
          : lessonData;

      // Load progress and unlock status
      const [progressData, status] = await Promise.all([
        getLessonProgress(user.id, lessonId, courseId),
        checkLessonUnlockStatus(user.id, lessonId, courseId),
      ]);

      setLesson(finalLessonData || lessonData);
      setProgress(progressData);
      setUnlockStatus(status);

      // If locked, show modal (unless we want to just block access, but navigation usually handles that.
      // However, if deep linked or navigated directly, we should check)
      if (!status.isUnlocked) {
        setUnlockModalVisible(true);
      }
    } catch (err) {
      console.error('Failed to load lesson content:', err);
      setError('Failed to load lesson content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lessonId, courseId, currentLanguageId, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Watch for language changes and navigate back to course selection (only when screen is focused)
  const previousLanguageRef = React.useRef(currentLanguageId);
  const isFocused = navigation.isFocused();

  useEffect(() => {
    if (isFocused && previousLanguageRef.current !== currentLanguageId) {
      // Language changed while on this screen, navigate back to course selection
      navigation.navigate('CourseSelection');
    }
    previousLanguageRef.current = currentLanguageId;
  }, [currentLanguageId, navigation, isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const calculateTotalUnits = useCallback(() => {
    if (!lesson?.contentBlocks) {
      return 0;
    }
    return lesson.contentBlocks.reduce((total, block) => {
      if (block.blockType === 'exercise') {
        // We want to track progress by EXERCISE count, not sentence count
        return total + 1;
      }
      return total;
    }, 0);
  }, [lesson]);

  const handleExercisePress = (exerciseId: string) => {
    const totalLessonUnits = calculateTotalUnits();
    navigation.navigate('Exercise', {
      lessonId: lessonId, // Parent lesson ID
      exerciseId: exerciseId,
      totalLessonUnits: totalLessonUnits > 0 ? totalLessonUnits : undefined,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading && !refreshing) {
    return <AppLoadingSpinner />;
  }

  if (error || !lesson) {
    return (
      <View style={styles.container}>
        <AppBar
          title="Lesson"
          showBack
          onBackPress={handleBack} // Fixed prop name
        />
        <ErrorMessage
          message={error || 'Lesson not found'}
          onRetry={loadData}
        />
      </View>
    );
  }

  // If locked and modal closed (user dismissed it), maybe we should go back?
  // For now, we show the content but maybe overlaid or we assume the modal handles "go to prerequisite".
  // Actually, if it's locked, we probably shouldn't show content.
  if (!unlockStatus.isUnlocked && !unlockModalVisible) {
    // If user dismissed modal but lesson is locked, show a locked state or go back
    // We'll just show the modal again if they tap anything or a "Locked" screen
  }

  return (
    <View style={styles.container}>
      <AppBar
        title={lesson.title}
        showBack
        onBackPress={handleBack} // Fixed prop name
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* NEW: Lesson Progress Summary */}
        {progress && (
          <View style={styles.progressSummary}>
            <Text style={styles.progressText}>
              Progress: {progress.completedUnitIds.length} of{' '}
              {calculateTotalUnits()} exercises completed
            </Text>
            <ProgressIndicator
              completed={progress.completedUnitIds.length}
              total={calculateTotalUnits()}
              showLabel={false}
              style={styles.progressIndicator}
            />
          </View>
        )}

        {lesson.contentBlocks?.map(block => (
          <ContentBlockRenderer
            key={block.id}
            block={block}
            onExercisePress={handleExercisePress}
            lessonProgress={progress}
          />
        ))}
      </ScrollView>

      <UnlockRequirementsModal
        visible={unlockModalVisible}
        unlockStatus={unlockStatus}
        onClose={() => {
          setUnlockModalVisible(false);
          if (!unlockStatus.isUnlocked) {
            navigation.goBack();
          }
        }}
      />
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    progressSummary: {
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    progressIndicator: {
      marginTop: spacing.xs,
    },
  });
