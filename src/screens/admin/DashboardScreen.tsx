import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions, // Add Dimensions
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {supabase} from '@/services/supabase';
import type {Tables} from '@/types/database';
import {Card} from '@/components/shared/Card';
import {useTheme} from '@/components/shared';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {spacing, borderRadius, typography} from '@/theme';
import {ThemeColors} from '@/theme/colors';

import {getIconComponent} from '@/utils/iconMap';
import {AppBar} from '@/components/shared/AppBar';
import {Users, Plus} from 'lucide-react-native';

// Styles factory using theme constants
const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
    flexDirection: 'column' as const,
    alignItems: 'stretch' as const,
  },
  headerTopRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  backToAppButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backToAppText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  filterSection: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  languageList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  langChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langChipText: {
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  langChipTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
  },
  courseItem: {
    width: '100%' as const,
    maxWidth: 350,
    marginBottom: spacing.md,
  },
  courseCard: {
    padding: spacing.lg,
    height: '100%' as const,
  },
  courseHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.text.disabled,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  courseContent: {
    marginBottom: spacing.md,
    flex: 1,
  },
  courseTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
    color: colors.text.primary,
  },
  courseTitleTarget: {
    fontSize: typography.sizes.base,
    fontStyle: 'italic' as const,
    marginBottom: spacing.sm,
    color: colors.text.secondary,
  },
  courseDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  courseFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderTopColor: 'transparent' as const,
    borderBottomColor: 'transparent' as const,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontStyle: 'italic' as const,
    marginTop: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
});

export const DashboardScreen: React.FC = () => {
  const {colors} = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<any>();
  const windowWidth = Dimensions.get('window').width;
  const isLargeScreen = windowWidth > 600; // Define breakpoint
  const [courses, setCourses] = useState<Tables<'courses'>[]>([]);
  const [languages, setLanguages] = useState<{id: string; name: string}[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch Languages
      const {data: langData, error: langError} = await supabase
        .from('languages')
        .select('id, name')
        .order('name');

      if (langError) {
        throw langError;
      }

      setLanguages(langData || []);
      if (langData && langData.length > 0) {
        // Default to first language (or maybe English/Irish if preferred)
        setSelectedLanguageId((langData[0] as any).id);
      }

      // Fetch Courses
      const {data: courseData, error: courseError} = await supabase
        .from('courses')
        .select('*')
        .order('display_order', {ascending: true});

      if (courseError) {
        throw courseError;
      }
      setCourses(courseData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    navigation.navigate('CourseManager', {mode: 'create'});
  };

  const handleEditCourse = (course: Tables<'courses'>) => {
    navigation.navigate('CourseManager', {courseId: course.id, mode: 'edit'});
  };

  const filteredCourses = courses.filter(
    c => !selectedLanguageId || c.language_id === selectedLanguageId,
  );

  return (
    <View style={styles.container}>
      <AppBar
        title="Admin Dashboard"
        showBack
        onBackPress={() => navigation.navigate('Main')}
        rightElement={
          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: colors.secondary,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                },
                !isLargeScreen && {paddingHorizontal: 8},
              ]}
              onPress={() => navigation.navigate('SpeakerManager')}>
              {isLargeScreen ? (
                <Text style={styles.createButtonText}>Speakers</Text>
              ) : (
                <Users size={20} color={colors.white} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                {paddingVertical: 8, paddingHorizontal: 12},
                !isLargeScreen && {paddingHorizontal: 8},
              ]}
              onPress={handleCreateCourse}>
              {isLargeScreen ? (
                <Text style={styles.createButtonText}>+ New Course</Text>
              ) : (
                <Plus size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.languageList}>
          <TouchableOpacity
            style={[
              styles.langChip,
              selectedLanguageId === null && styles.langChipSelected,
            ]}
            onPress={() => setSelectedLanguageId(null)}>
            <Text
              style={[
                styles.langChipText,
                selectedLanguageId === null && styles.langChipTextSelected,
              ]}>
              All
            </Text>
          </TouchableOpacity>

          {languages.map(lang => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.langChip,
                selectedLanguageId === lang.id && styles.langChipSelected,
              ]}
              onPress={() => setSelectedLanguageId(lang.id)}>
              <Text
                style={[
                  styles.langChipText,
                  selectedLanguageId === lang.id && styles.langChipTextSelected,
                ]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>
          Courses ({filteredCourses.length})
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <View style={styles.grid}>
            {filteredCourses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseItem}
                onPress={() => handleEditCourse(course)}
                activeOpacity={0.7}>
                <Card
                  style={[
                    styles.courseCard,
                    {opacity: course.is_available ? 1 : 0.6},
                  ]}>
                  <View style={styles.courseHeader}>
                    <View
                      style={[
                        styles.iconContainer,
                        {backgroundColor: (course.color || '#ccc') + '20'},
                      ]}>
                      {(() => {
                        const Icon = getIconComponent(course.icon_name);
                        return (
                          <Icon size={40} color={course.color || '#ccc'} />
                        );
                      })()}
                    </View>
                    {!course.is_available && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Hidden</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.courseContent}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseTitleTarget}>
                      {course.title_target}
                    </Text>
                    <Text style={styles.courseDescription} numberOfLines={3}>
                      {course.description}
                    </Text>
                  </View>

                  <View style={styles.courseFooter}>
                    <View
                      style={[
                        styles.arrow,
                        {borderLeftColor: course.color || '#ccc'},
                      ]}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}

            {filteredCourses.length === 0 && (
              <Text style={styles.emptyText}>
                No courses found for this language.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
