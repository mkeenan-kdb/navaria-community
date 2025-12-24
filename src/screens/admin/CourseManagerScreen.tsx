import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  Dimensions, // Add Dimensions
} from 'react-native';
import {AppBar} from '@/components/shared/AppBar';
import {Save, BookOpen} from 'lucide-react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import * as LucideIcons from 'lucide-react-native';
import {supabase} from '@/services/supabase';
import type {Tables} from '@/types/database';
import {Card} from '@/components/shared/Card';
import {useTheme} from '@/components/shared';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {spacing, borderRadius, typography} from '@/theme';
import {createCommonStyles} from '@/theme/commonStyles';

import {allIcons, getIconComponent} from '@/utils/iconMap';

type AdminStackParamList = {
  CourseManager: {courseId?: string; mode: 'create' | 'edit'};
  LessonEditor: {courseId: string; lessonId?: string; mode: 'create' | 'edit'};
};

export const CourseManagerScreen: React.FC = () => {
  const {colors} = useTheme();
  const common = createCommonStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminStackParamList, 'CourseManager'>>();
  const {courseId, mode} = route.params;
  const windowWidth = Dimensions.get('window').width;
  const isLargeScreen = windowWidth > 600;

  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<Array<{id: string; name: string}>>(
    [],
  );

  // Icon Picker State
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState('');

  const [course, setCourse] = useState<Partial<Tables<'courses'>>>({
    title: '',
    description: '',
    color: '#58CC02',
    is_available: false,
    display_order: 0,
    language_id: 'navajo', // Default to Navajo
  });
  const [lessons, setLessons] = useState<Tables<'lessons'>[]>([]);

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    loadLanguages();
  }, []);

  // Use useFocusEffect to reload lessons when returning from lesson editor
  useFocusEffect(
    React.useCallback(() => {
      const loadCourseData = async () => {
        if (!courseId) {
          return;
        }
        setLoading(true);
        try {
          // Load course
          const {data: courseData, error: courseError} = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

          if (courseError) {
            throw courseError;
          }
          setCourse(courseData);

          // Load lessons
          const {data: lessonsData, error: lessonsError} = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .order('display_order', {ascending: true});

          if (lessonsError) {
            throw lessonsError;
          }
          setLessons(lessonsData || []);
        } catch (error) {
          console.error('Error loading data:', error);
          Alert.alert('Error', 'Failed to load course data');
        } finally {
          setLoading(false);
        }
      };

      if (mode === 'edit' && courseId) {
        loadCourseData();
      }
    }, [courseId, mode]),
  );

  const loadLanguages = async () => {
    try {
      const {data, error} = await supabase
        .from('languages')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }
      setLanguages(data || []);
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const handleSaveCourse = async () => {
    try {
      if (!course.title || !course.title_target) {
        Alert.alert(
          'Error',
          'Please enter both English and Target Language titles',
        );
        return;
      }
      setLoading(true);
      if (mode === 'create') {
        const {data, error} = await supabase
          .from('courses')
          // @ts-ignore - Database types not properly inferred
          .insert([course as any])
          .select()
          .single();

        if (error) {
          throw error;
        }
        Alert.alert('Success', 'Course created');
        // @ts-ignore - data type not properly inferred
        navigation.replace('CourseManager', {courseId: data.id, mode: 'edit'});
      } else {
        if (!courseId) {
          return;
        }
        const {error} = await supabase
          .from('courses')
          // @ts-ignore - Database types not properly inferred
          .update(course as any)
          .eq('id', courseId);

        if (error) {
          throw error;
        }
        Alert.alert('Success', 'Course updated');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      Alert.alert('Error', 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = () => {
    if (!courseId) {
      Alert.alert('Notice', 'Please save the course first');
      return;
    }
    navigation.navigate('LessonEditor', {
      courseId,
      mode: 'create',
    });
  };

  const handleEditLesson = (lesson: Tables<'lessons'>) => {
    if (!courseId) {
      return;
    }
    navigation.navigate('LessonEditor', {
      courseId,
      lessonId: lesson.id,
      mode: 'edit',
    });
  };

  const filteredIcons = useMemo(() => {
    if (!iconSearchQuery) {
      return allIcons;
    }
    const lowerQuery = iconSearchQuery.toLowerCase();
    return allIcons.filter(i => i.name.toLowerCase().includes(lowerQuery));
  }, [iconSearchQuery]);

  const styles = useThemedStyles(createStyles);

  const renderIconItem = ({
    item,
  }: {
    item: {name: string; icon: LucideIcons.LucideIcon};
  }) => {
    const IconComponent = item.icon;
    const isSelected = course.icon_name === item.name;

    return (
      <TouchableOpacity
        style={[styles.iconOption, isSelected && styles.iconOptionSelected]}
        onPress={() => {
          setCourse({...course, icon_name: item.name});
          setShowIconPicker(false);
        }}>
        <IconComponent
          size={24}
          color={isSelected ? colors.white : colors.text.primary}
        />
        <Text
          style={[styles.iconName, isSelected && {color: colors.white}]}
          numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPreview = () => {
    return (
      <View
        style={[common.flex1, common.centered, styles.previewContainerExtra]}>
        <View style={styles.cardPreview}>
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
                  const IconComponent = getIconComponent(course.icon_name);
                  return (
                    <IconComponent size={40} color={course.color || '#ccc'} />
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
              <Text style={styles.courseTitle}>
                {course.title || 'Course Title'}
              </Text>
              <Text style={styles.courseTitleTarget}>
                {course.title_target || 'Course Title (Target)'}
              </Text>
              <Text style={styles.courseDescription} numberOfLines={3}>
                {course.description || 'Course description...'}
              </Text>
            </View>

            <View style={styles.courseFooter}>
              <View
                style={[
                  styles.cardArrow,
                  {borderLeftColor: course.color || '#ccc'},
                ]}
              />
            </View>
          </Card>
        </View>
      </View>
    );
  };

  return (
    <View style={common.container}>
      <AppBar
        title={mode === 'create' ? 'New Course' : 'Edit Course'}
        showBack
        onBackPress={() => navigation.goBack()}
        rightElement={
          <View style={{flexDirection: 'row', gap: 8}}>
            {mode === 'edit' && (
              <TouchableOpacity
                style={[
                  styles.contentButton,
                  !isLargeScreen && {paddingHorizontal: 8, paddingVertical: 8},
                ]}
                onPress={() =>
                  navigation.navigate('CourseContentEditor', {courseId})
                }>
                {isLargeScreen ? (
                  <Text style={styles.contentButtonText}>Edit Content</Text>
                ) : (
                  <BookOpen size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.saveButton,
                !isLargeScreen && {paddingHorizontal: 8, paddingVertical: 8},
              ]}
              onPress={handleSaveCourse}
              disabled={loading}>
              {isLargeScreen ? (
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              ) : (
                <Save size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      {activeTab === 'edit' ? (
        <ScrollView style={styles.scrollContent}>
          <View style={styles.formSection}>
            <Text style={styles.sectionHeader}>Course Details</Text>

            <Text style={styles.label}>Title (English)</Text>
            <TextInput
              style={styles.input}
              value={course.title}
              onChangeText={text => setCourse({...course, title: text})}
              placeholder="Course Title (e.g., Learn Navajo)"
            />

            <Text style={styles.label}>Title (Target Language)</Text>
            <TextInput
              style={styles.input}
              value={course.title_target || ''}
              onChangeText={text => setCourse({...course, title_target: text})}
              placeholder="Course title in target language"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={course.description || ''}
              onChangeText={text => setCourse({...course, description: text})}
              placeholder="Brief description of the course"
              multiline
            />

            <Text style={styles.label}>Icon</Text>
            <TouchableOpacity
              style={styles.iconPickerButton}
              onPress={() => setShowIconPicker(true)}>
              <View
                style={{
                  flexDirection: 'row' as const,
                  alignItems: 'center' as const,
                  gap: spacing.sm,
                }}>
                {course.icon_name &&
                  (() => {
                    const iconEntry = allIcons.find(
                      i => i.name === course.icon_name,
                    );
                    if (iconEntry) {
                      const IconComponent = iconEntry.icon;
                      return (
                        <IconComponent size={20} color={colors.text.primary} />
                      );
                    }
                    return null;
                  })()}
                <Text style={styles.iconPickerButtonText}>
                  {course.icon_name || 'Select Icon (Click to search)'}
                </Text>
              </View>
            </TouchableOpacity>

            <Modal
              visible={showIconPicker}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => setShowIconPicker(false)}>
              <SafeAreaView style={styles.modalContainer}>
                <View style={[common.rowBetween, styles.modalHeaderExtra]}>
                  <Text style={styles.modalTitle}>Select Icon</Text>
                  <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>

                <View style={[common.row, styles.searchContainerExtra]}>
                  <LucideIcons.Search size={20} color={colors.text.secondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search icons..."
                    value={iconSearchQuery}
                    onChangeText={setIconSearchQuery}
                    autoFocus
                  />
                  {iconSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setIconSearchQuery('')}>
                      <LucideIcons.X size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <FlatList
                  data={filteredIcons}
                  renderItem={renderIconItem}
                  keyExtractor={item => item.name}
                  numColumns={4}
                  contentContainerStyle={styles.iconListContent}
                  keyboardShouldPersistTaps="handled"
                />
              </SafeAreaView>
            </Modal>

            <Text style={styles.label}>Icon URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={course.icon_url || ''}
              onChangeText={text => setCourse({...course, icon_url: text})}
              placeholder="Custom icon URL (overrides icon name)"
            />

            <View style={styles.colorSection}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Color</Text>
                <View style={[common.row, styles.colorPickerContainerExtra]}>
                  {[
                    '#58CC02', // Green (Duolingo-style)
                    '#1CB0F6', // Blue
                    '#FF9600', // Orange
                    '#CE82FF', // Purple
                    '#FF4B4B', // Red
                    '#FFC800', // Yellow
                    '#00CD9C', // Teal
                    '#E5E5E5', // Gray
                  ].map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        {backgroundColor: color},
                        course.color === color && styles.colorSwatchSelected,
                      ]}
                      onPress={() => setCourse({...course, color})}>
                      {course.color === color && (
                        <Text style={styles.colorCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.colorHexLabel}>
                  Selected: {course.color}
                </Text>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Display Order</Text>
                <TextInput
                  style={styles.input}
                  value={String(course.display_order || 0)}
                  onChangeText={text =>
                    setCourse({
                      ...course,
                      display_order: parseInt(text, 10) || 0,
                    })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.label}>Language</Text>
            <View style={[common.row, styles.pickerContainerExtra]}>
              {languages.map(lang => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageOption,
                    course.language_id === lang.id &&
                      styles.languageOptionSelected,
                  ]}
                  onPress={() => setCourse({...course, language_id: lang.id})}>
                  <Text
                    style={[
                      styles.languageOptionText,
                      course.language_id === lang.id &&
                        styles.languageOptionTextSelected,
                    ]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[common.rowBetween, styles.rowExtra]}>
              <Text style={styles.label}>Available?</Text>
              <Switch
                value={course.is_available}
                onValueChange={val => setCourse({...course, is_available: val})}
              />
            </View>
          </View>

          {mode === 'edit' && (
            <View style={styles.lessonsSection}>
              <View style={[common.rowBetween, styles.sectionHeaderRowExtra]}>
                <Text style={styles.sectionHeader}>Lesson Management</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddLesson}>
                  <Text style={styles.addButtonText}>+ Create New Lesson</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Create lessons here, then add them to your course content using
                the "Edit Content" button above.
              </Text>

              {lessons.length > 0 && (
                <View style={styles.lessonListContainer}>
                  {lessons.map(lesson => (
                    <TouchableOpacity
                      key={lesson.id}
                      style={[common.rowBetween, styles.lessonItemExtra]}
                      onPress={() => handleEditLesson(lesson)}>
                      <View>
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        {lesson.title_target && (
                          <Text style={styles.lessonSubtitle}>
                            {lesson.title_target}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        renderPreview()
      )}

      {/* Tab Bar */}
      <View style={[common.row, styles.tabBarExtra]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'edit' && styles.activeTab]}
          onPress={() => setActiveTab('edit')}>
          <Text style={styles.tabText}>Editor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
          onPress={() => setActiveTab('preview')}>
          <Text style={styles.tabText}>Preview</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => {
  return {
    headerExtra: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    backButton: {
      padding: spacing.sm,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
    },
    title: {
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
    },
    backToAppButton: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backToAppText: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      fontWeight: typography.weights.semibold,
    },
    saveButton: {
      backgroundColor: colors.success,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.xl,
    },
    saveButtonText: {
      color: colors.white,
      fontWeight: typography.weights.bold,
    },
    headerActionsExtra: {
      gap: spacing.sm,
      flexWrap: 'wrap' as const,
    },
    contentButton: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contentButtonText: {
      color: colors.primary,
      fontWeight: typography.weights.bold,
    },
    formSection: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      marginTop: 20,
      marginHorizontal: 20,
      borderRadius: 10,
    },
    sectionHeader: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.bold,
      marginBottom: 15,
      color: colors.text.primary,
    },
    label: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      marginBottom: 5,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginBottom: 15,
      fontSize: typography.sizes.sm,
      backgroundColor: colors.surface,
      color: colors.text.primary,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top' as const,
    },
    rowExtra: {
      marginBottom: 15,
      flexWrap: 'wrap' as const,
      gap: 15,
    },
    halfInput: {
      width: '100%' as const,
      minWidth: 150,
      flex: 1,
    },
    lessonsSection: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      marginTop: 20,
      marginHorizontal: 20,
      borderRadius: 10,
      marginBottom: spacing.xs,
    },
    sectionHeaderRowExtra: {
      marginBottom: 15,
    },
    addButton: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    addButtonText: {
      color: colors.text.primary,
      fontWeight: typography.weights.semibold,
    },
    lessonListContainer: {
      marginTop: 15,
      gap: spacing.sm,
    },
    lessonItemExtra: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    lessonTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.text.primary,
    },
    lessonSubtitle: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
    },
    arrow: {
      fontSize: typography.sizes.lg,
      color: colors.text.disabled,
    },
    helperText: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      fontStyle: 'italic' as const,
      marginTop: 8,
    },
    pickerContainerExtra: {
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      marginBottom: 15,
    },
    languageOption: {
      paddingHorizontal: 12,
      paddingVertical: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    languageOptionSelected: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    languageOptionText: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
    },
    languageOptionTextSelected: {
      color: colors.white,
      fontWeight: typography.weights.bold,
    },
    iconPickerButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginBottom: 15,
      backgroundColor: colors.surfaceSubtle,
    },
    iconPickerButtonText: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
    },

    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeaderExtra: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    modalTitle: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
    },
    closeButtonText: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    searchContainerExtra: {
      padding: spacing.sm,
      backgroundColor: colors.surfaceSubtle,
      margin: 10,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: typography.sizes.sm,
      color: colors.text.primary,
      padding: 4,
    },
    iconListContent: {
      padding: spacing.sm,
    },
    iconOption: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      margin: 4,
      padding: 4,
    },
    iconOptionSelected: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    iconName: {
      fontSize: 10,
      color: colors.text.secondary,
      marginTop: 4,
      textAlign: 'center' as const,
    },

    // New Styles
    scrollContent: {
      flex: 1,
    },
    colorSection: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 15,
      flexWrap: 'wrap' as const,
      gap: 20,
    },
    colorPickerContainerExtra: {
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      marginBottom: 5,
    },
    colorSwatch: {
      width: 24,
      height: 24,
      borderRadius: borderRadius.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    colorSwatchSelected: {
      borderWidth: 2,
      borderColor: colors.text.primary,
    },
    colorCheckmark: {
      color: '#fff',
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
    },
    colorHexLabel: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      marginTop: 4,
    },

    // Preview Styles
    previewContainerExtra: {
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    cardPreview: {
      width: '100%' as const,
      maxWidth: 350,
    },
    courseCard: {
      padding: 0,
      overflow: 'hidden' as const,
    },
    courseHeader: {
      flexDirection: 'row' as const,
      padding: spacing.md,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 15,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    badge: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.lg,
    },
    badgeText: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      fontWeight: typography.weights.bold,
    },
    courseContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: 16,
    },
    courseTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    courseTitleTarget: {
      fontSize: typography.sizes.sm,
      color: colors.success,
      marginBottom: spacing.sm,
      fontWeight: typography.weights.semibold,
    },
    courseDescription: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    courseFooter: {
      height: 4, // Decorative bottom bar
      backgroundColor: colors.borderSubtle,
      flexDirection: 'row' as const,
    },
    cardArrow: {
      flex: 1,
      borderBottomWidth: 4, // Simulated progress bar
      borderBottomColor: 'transparent', // Or dynamic color
    },
    tabBarExtra: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      paddingVertical: 15,
      alignItems: 'center' as const,
    },
    activeTab: {
      borderTopWidth: 2,
      borderTopColor: colors.primary,
    },
    tabText: {
      fontWeight: typography.weights.semibold,
      color: colors.text.primary,
    },
  };
};
