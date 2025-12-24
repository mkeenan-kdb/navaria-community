import React, {useEffect, useState, useCallback} from 'react';
import {View, ScrollView, StyleSheet, RefreshControl, Text} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from '@react-navigation/native';
import {CoursesStackParamList, CoursesNavigationProp} from '@/navigation/types';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {typography} from '@/theme/typography';
import {spacing} from '@/theme/spacing';
import {CourseWithContent, LessonWithContent} from '@/types/content';
import {
  loadCourseWithContent,
  loadCourseLessons,
} from '@/services/dynamicContent';
import {batchCheckLessonUnlockStatus} from '@/services/prerequisites';
import {getCourseProgressSummary, getCourseProgress} from '@/services/progress';
import {useUserStore} from '@/stores/userStore';
import {ContentBlockRenderer} from '@/components/content/ContentBlockRenderer';
import {UnlockRequirementsModal} from '@/components/courses/UnlockRequirementsModal';
import {
  AppLoadingSpinner,
  ErrorMessage,
  AppBar,
  ProgressBar,
} from '@/components/shared';
import type {CourseProgress, LessonProgress} from '@/types';

type CourseContentRouteProp = RouteProp<CoursesStackParamList, 'CourseContent'>;

export const CourseContentScreen: React.FC = () => {
  const navigation = useNavigation<CoursesNavigationProp>();
  const route = useRoute<CourseContentRouteProp>();
  const {courseId} = route.params;
  const {user, currentLanguageId} = useUserStore();
  const styles = useThemedStyles(createStyles);

  const [course, setCourse] = useState<CourseWithContent | null>(null);
  const [lessons, setLessons] = useState<LessonWithContent[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [selectedLockedLesson, setSelectedLockedLesson] =
    useState<LessonWithContent | null>(null);
  const [lessonProgressMap, setLessonProgressMap] = useState<
    Map<string, LessonProgress>
  >(new Map());

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setError(null);

      // First load the course to get its language ID
      const courseData = await loadCourseWithContent(
        courseId,
        currentLanguageId,
      );

      if (!courseData) {
        setError('Course not found');
        return;
      }

      // Use the course's language ID for loading content, not the user's current language
      const courseLanguageId = courseData.languageId || currentLanguageId;

      // Reload course content with correct language if needed
      const finalCourseData =
        courseLanguageId !== currentLanguageId
          ? await loadCourseWithContent(courseId, courseLanguageId)
          : courseData;

      // Load lessons
      const lessonsData = await loadCourseLessons(courseId);

      // Check unlock status for all lessons
      const lessonIds = lessonsData.map(l => l.id);
      const unlockStatuses = await batchCheckLessonUnlockStatus(
        user.id,
        courseId,
        lessonIds,
      );

      // Merge lessons with unlock status
      const lessonsWithStatus: LessonWithContent[] = lessonsData.map(
        lesson => ({
          ...lesson,
          unlockStatus: unlockStatuses.get(lesson.id) || {isUnlocked: false},
        }),
      );

      // NEW: Load course progress
      const [courseProgressData, allLessonsProgress] = await Promise.all([
        getCourseProgressSummary(user.id, courseId),
        getCourseProgress(user.id, courseId),
      ]);

      const progressMap = new Map<string, LessonProgress>();
      allLessonsProgress.forEach(p => progressMap.set(p.lessonId, p));

      setCourse(finalCourseData || courseData);
      setLessons(lessonsWithStatus);
      setCourseProgress(courseProgressData);
      setLessonProgressMap(progressMap);
    } catch (err) {
      console.error('Failed to load course content:', err);
      setError('Failed to load course content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId, currentLanguageId, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Navigate back to course selection if language changes
  useEffect(() => {
    // This will trigger when currentLanguageId changes
    // We want to go back to CourseSelection to show courses for the new language
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we're focused and language has changed
      // The loadData callback already has currentLanguageId as a dependency
      // so it will reload when language changes, but we should navigate back
    });
    return unsubscribe;
  }, [navigation]);

  // Watch for language changes and navigate back (only when screen is focused)
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

  const handleLessonPress = (lesson: LessonWithContent) => {
    if (lesson.unlockStatus?.isUnlocked) {
      navigation.navigate('LessonContent', {
        lessonId: lesson.id,
        courseId: courseId,
      });
    } else {
      setSelectedLockedLesson(lesson);
      setUnlockModalVisible(true);
    }
  };

  if (loading && !refreshing) {
    return <AppLoadingSpinner />;
  }

  if (error || !course) {
    return (
      <View style={styles.container}>
        <AppBar title="Course" showBack />
        <ErrorMessage
          message={error || 'Course not found'}
          onRetry={loadData}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title={course.title} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Course Header / Introduction */}
        <View style={styles.header}>
          <Text style={styles.title}>{course.title}</Text>
          {course.titleTarget && (
            <Text style={styles.subtitle}>{course.titleTarget}</Text>
          )}

          {/* NEW: Course Progress Summary */}
          {courseProgress && courseProgress.totalLessons > 0 && (
            <View style={styles.progressSummary}>
              <Text style={styles.progressText}>
                {courseProgress.completedLessonIds.length} of{' '}
                {courseProgress.totalLessons} lessons completed
              </Text>
              <ProgressBar
                progress={courseProgress.completionPercentage}
                style={styles.progressBar}
              />
            </View>
          )}

          {/* Render rich content blocks for course intro */}
          {course.contentBlocks?.map(block => (
            <ContentBlockRenderer
              key={block.id}
              block={block}
              lessonsProgress={lessonProgressMap}
              unlockStatusMap={
                new Map(
                  lessons.map(l => [l.id, l.unlockStatus?.isUnlocked ?? false]),
                )
              }
              onLessonPress={lessonId => {
                const lesson = lessons.find(l => l.id === lessonId);
                if (lesson) {
                  handleLessonPress(lesson);
                }
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Unlock Requirements Modal */}
      {selectedLockedLesson && selectedLockedLesson.unlockStatus && (
        <UnlockRequirementsModal
          visible={unlockModalVisible}
          unlockStatus={selectedLockedLesson.unlockStatus}
          onClose={() => setUnlockModalVisible(false)}
        />
      )}
    </View>
  );
};

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.sizes['4xl'],
      fontWeight: typography.weights.bold,
      color: themeColors.text.primary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.semibold,
      color: themeColors.primary,
      marginBottom: spacing.md,
    },
    progressSummary: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: themeColors.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    progressText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: themeColors.text.primary,
      marginBottom: spacing.xs,
    },
    progressBar: {
      marginTop: spacing.xs,
    },
    sectionTitle: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: themeColors.text.primary,
      marginBottom: spacing.md,
      marginTop: spacing.md,
    },
  });
