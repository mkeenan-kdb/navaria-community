import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {type LucideIcon} from 'lucide-react-native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  Card,
  AppBar,
  AppLoadingSpinner,
  ErrorMessage,
  useTheme,
  Badge,
} from '@/components/shared';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {loadCourses} from '@/services/dynamicContent';
import {getCourseProgressSummary} from '@/services/progress';
import type {Course, CourseProgress} from '@/types';
import type {CoursesStackParamList, DrawerParamList} from '@/navigation/types';

import {useUserStore} from '@/stores/userStore';
import {getIconComponent} from '@/utils/iconMap';

export const CourseSelectionScreen: React.FC = () => {
  const navigation =
    useNavigation<
      import('@react-navigation/native').NavigationProp<CoursesStackParamList>
    >();
  const drawerNavigation =
    navigation.getParent<DrawerNavigationProp<DrawerParamList>>();
  const {isDark} = useTheme();

  const {currentLanguageId, user} = useUserStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<
    Map<string, CourseProgress>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const styles = useThemedStyles(createStyles);

  const loadCoursesData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const loadedCourses = await loadCourses(currentLanguageId);
      setCourses(loadedCourses);

      // NEW: Load progress for all courses
      if (user) {
        const progressPromises = loadedCourses.map(course =>
          getCourseProgressSummary(user.id, course.id),
        );
        const progressData = await Promise.all(progressPromises);

        const progressMap = new Map();
        loadedCourses.forEach((course, index) => {
          if (progressData[index]) {
            progressMap.set(course.id, progressData[index]);
          }
        });
        setCourseProgress(progressMap);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentLanguageId, user]);

  useFocusEffect(
    useCallback(() => {
      loadCoursesData();
    }, [loadCoursesData]),
  );

  const handleOpenDrawer = () => {
    drawerNavigation?.openDrawer?.();
  };

  const handleCoursePress = (course: Course) => {
    if (!course.isAvailable) {
      return;
    }
    navigation.navigate('CourseContent', {courseId: course.id});
  };

  const getIcon = (course: Course): LucideIcon => {
    return getIconComponent(course.iconName);
  };

  const renderCourse = ({item}: {item: Course}) => {
    const progress = courseProgress.get(item.id);
    const hasProgress = progress && progress.completedLessonIds.length > 0;

    return (
      <TouchableOpacity
        onPress={() => handleCoursePress(item)}
        disabled={!item.isAvailable}
        style={styles.courseItem}
        activeOpacity={0.7}>
        <Card
          style={[styles.courseCard, {opacity: item.isAvailable ? 1 : 0.6}]}>
          <View style={styles.courseHeader}>
            <View
              style={[
                styles.iconContainer,
                {backgroundColor: item.color + '20'},
              ]}>
              {(() => {
                const IconComponent = getIcon(item);
                return <IconComponent size={40} color={item.color} />;
              })()}
            </View>
            {/* NEW: Progress Badge or Coming Soon */}
            {item.isAvailable && hasProgress ? (
              <Badge variant="success" size="sm">
                {Math.round(progress.completionPercentage)}%
              </Badge>
            ) : !item.isAvailable ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Coming Soon</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.courseContent}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseTitleTarget}>{item.titleTarget}</Text>
            <Text style={styles.courseDescription}>{item.description}</Text>

            {/* NEW: Progress text */}
            {hasProgress && (
              <Text style={styles.progressText}>
                {progress.completedLessonIds.length} of {progress.totalLessons}{' '}
                lessons
              </Text>
            )}
          </View>

          {item.isAvailable && (
            <View style={styles.courseFooter}>
              <View style={[styles.arrow, {borderLeftColor: item.color}]} />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <AppLoadingSpinner message="Loading courses..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={loadCoursesData} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar
        title="Courses"
        showMenu
        showHome
        onMenuPress={handleOpenDrawer}
      />

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={
            isDark
              ? require('../../../assets/images/app_logo_circular_original_darkmode.png')
              : require('../../../assets/images/app_logo_circular_original_lightmode.png')
          }
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Navaria</Text>
        <Text style={styles.subtitle}>Choose your learning path</Text>
      </View>

      {/* Course List */}
      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        renderItem={renderCourse}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const createStyles = (themeColors: any) => {
  const common = createCommonStyles(themeColors);
  return {
    ...common,
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    } as ViewStyle,
    header: {
      alignItems: 'center',
      paddingTop: spacing.lg,
      marginTop: spacing.lg,
      marginHorizontal: spacing.md,
      borderRadius: borderRadius['2xl'],
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      backgroundColor: themeColors.surfaceElevated,
    } as ViewStyle,
    logo: {
      width: 100,
      height: 100,
      marginBottom: spacing.md,
    } as ImageStyle,
    title: {
      fontSize: typography.sizes['5xl'],
      fontWeight: typography.weights.bold,
      marginBottom: spacing.xs,
      color: themeColors.primary,
      fontFamily: typography.fonts.celtic,
    } as TextStyle,
    subtitle: {
      fontSize: typography.sizes.lg,
      color: themeColors.text.secondary,
      fontFamily: typography.fonts.celtic,
    } as TextStyle,
    listContent: {
      padding: spacing.lg,
      gap: spacing.lg,
    } as ViewStyle,
    courseItem: {
      width: '100%',
    } as ViewStyle,
    courseCard: {
      padding: spacing.lg,
    } as ViewStyle,
    courseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    } as ViewStyle,
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      backgroundColor: themeColors.text.tertiary,
    } as ViewStyle,
    badgeText: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      color: themeColors.white,
    } as TextStyle,
    courseContent: {
      marginBottom: spacing.md,
    } as ViewStyle,
    courseTitle: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      marginBottom: spacing.xs,
      color: themeColors.text.primary,
      fontFamily: typography.fonts.celtic,
    } as TextStyle,
    courseTitleTarget: {
      fontSize: typography.sizes.xl,
      fontStyle: 'italic',
      marginBottom: spacing.sm,
      color: themeColors.secondary,
      fontFamily: typography.fonts.celtic,
    } as TextStyle,
    courseDescription: {
      fontSize: typography.sizes.sm,
      lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
      color: themeColors.text.secondary,
    } as TextStyle,
    progressText: {
      fontSize: typography.sizes.xs,
      color: themeColors.text.tertiary,
      marginTop: spacing.xs,
      fontWeight: typography.weights.medium,
    } as TextStyle,
    courseFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.tiontuGoldDark,
    } as ViewStyle,
    arrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 12,
      borderTopWidth: 10,
      borderBottomWidth: 10,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    } as ViewStyle,
  };
};
