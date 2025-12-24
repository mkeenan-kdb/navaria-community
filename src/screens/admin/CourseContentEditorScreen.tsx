import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {AppBar} from '@/components/shared/AppBar';
import {Save, Upload} from 'lucide-react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import {draftService} from '@/services/admin/draftService';
import {supabase} from '@/services/supabase';
import {ContentBlockRenderer} from '@/components/content/ContentBlockRenderer';
import {ThemeProvider} from '@/components/shared/ThemeProvider';
import {useTheme} from '@/components/shared';
import type {Tables} from '@/types/database';
import type {ContentBlock, Lesson} from '@/types/content';
import {generateUUID} from '@/utils/uuid';
import {MediaUploader} from '@/components/admin/MediaUploader';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {spacing, borderRadius, typography, opacity} from '@/theme';
import {createCommonStyles} from '@/theme/commonStyles';

type AdminStackParamList = {
  CourseContentEditor: {courseId: string};
};

export const CourseContentEditorScreen: React.FC = () => {
  const {colors} = useTheme();
  const common = createCommonStyles(colors);
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<AdminStackParamList, 'CourseContentEditor'>>();
  const {courseId} = route.params;
  const windowWidth = Dimensions.get('window').width;
  const isLargeScreen = windowWidth > 900;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Draft State
  const [course, setCourse] = useState<Partial<Tables<'courses'>>>({
    title: '',
    description: '',
  });
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        if (!courseId) {
          return;
        }

        setLoading(true);
        try {
          // Try to load draft first
          try {
            const draft = await draftService.loadDraft('course', courseId);
            if (draft && draft.data) {
              setCourse(draft.data.course);
              setBlocks(draft.data.blocks || []);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.log('No draft found, loading from DB');
          }

          // Load from DB
          const {data: courseData, error: courseError} = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

          if (courseError) {
            throw courseError;
          }
          setCourse(courseData);

          // Load blocks
          const {data: blockData, error: blockError} = await supabase
            .from('content_blocks')
            .select('*')
            .eq('parent_id', courseId)
            .eq('parent_type', 'course')
            .order('display_order', {ascending: true});

          if (blockError) {
            throw blockError;
          }

          // Map DB blocks to ContentBlock type
          const mappedBlocks: ContentBlock[] = ((blockData as any[]) || []).map(
            b => ({
              id: b.id,
              parentType: 'course',
              parentId: courseId,
              blockType: b.block_type as any,
              content: b.content as any,
              metadata: b.metadata as any,
              displayOrder: b.display_order,
              isAvailable: b.is_available ?? true,
              languageId:
                b.language_id || (courseData as any).language_id || null,
              createdAt: b.created_at,
              updatedAt: b.updated_at || b.created_at,
            }),
          );
          setBlocks(mappedBlocks);

          // Load lessons for selection
          const {data: lessonData, error: lessonError} = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .order('display_order');

          if (lessonError) {
            throw lessonError;
          }

          if (lessonData) {
            const mappedLessons: Lesson[] = lessonData.map((l: any) => ({
              id: l.id,
              courseId: l.course_id,
              title: l.title,
              titleTarget: l.title_target,
              description: l.description,
              iconName: l.icon_name,
              iconUrl: l.icon_url,
              displayOrder: l.display_order,
              estimatedMinutes: l.estimated_minutes,
              isAvailable: l.is_available,
              createdAt: l.created_at,
              updatedAt: l.updated_at,
              requiresPrerequisites: l.requires_prerequisites,
              unlockDescription: l.unlock_description,
            }));
            setLessons(mappedLessons);
          }
        } catch (error) {
          console.error('Error loading course:', error);
          Alert.alert('Error', 'Failed to load course');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [courseId]),
  );

  const handleSaveDraft = async () => {
    console.log('💾 handleSaveDraft called for course');
    console.log('📋 courseId:', courseId);
    console.log('📋 course:', course);

    if (!courseId) {
      console.error('❌ No courseId provided');
      Alert.alert('Error', 'Course ID is required');
      return;
    }

    if (!course.title && !course.title_target) {
      console.error('❌ No course title provided');
      Alert.alert('Error', 'Course title is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        course: {...course, id: courseId},
        blocks,
        updatedAt: new Date().toISOString(),
      };

      console.log('📦 Saving course draft...');
      console.log('📦 Data to save:', JSON.stringify(data, null, 2));
      console.log(
        '📦 Data size estimate:',
        JSON.stringify(data).length,
        'characters',
      );
      await draftService.saveDraft(
        'course',
        courseId,
        data,
        course.title || 'Untitled Course',
      );
      console.log('✅ Course draft saved');
      Alert.alert('Success', 'Draft saved!');
    } catch (error) {
      console.error('❌ Error saving course draft:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Error',
        `Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: Draft storage requires admin permissions and the content_drafts bucket to be set up.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (blockType: ContentBlock['blockType']) => {
    if (blockType === 'lesson') {
      setShowLessonModal(true);
      return;
    }

    const newBlock: ContentBlock = {
      id: generateUUID(),
      parentType: 'course',
      parentId: courseId,
      blockType,
      content: {} as any,
      displayOrder: blocks.length,
      isAvailable: true,
      languageId: (course as any).language_id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (blockType === 'text') {
      newBlock.content = {
        text: 'New text block. Edit me!',
        markdown: true,
      };
    } else if (blockType === 'image') {
      newBlock.content = {
        url: 'https://placehold.co/600x400',
        alt: 'Placeholder image',
      };
    } else if (blockType === 'video') {
      newBlock.content = {
        url: '',
        caption: '',
      };
    } else if (blockType === 'audio') {
      newBlock.content = {
        url: '',
        title: 'New Audio',
        description: '',
      };
    }

    setBlocks([...blocks, newBlock]);
  };

  const handleAddLessonBlock = (lesson: Lesson) => {
    const newBlock: ContentBlock = {
      id: generateUUID(),
      parentType: 'course',
      parentId: courseId,
      blockType: 'lesson',
      content: {
        lessonId: lesson.id,
        showPreview: true,
      },
      displayOrder: blocks.length,
      isAvailable: true,
      languageId: (course as any).language_id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBlocks([...blocks, newBlock]);
    setShowLessonModal(false);
  };

  const updateBlockContent = (blockId: string, content: any) => {
    setBlocks(
      blocks.map(b =>
        b.id === blockId ? {...b, content: {...b.content, ...content}} : b,
      ),
    );
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap
    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];

    // Update displayOrder property
    newBlocks.forEach((b, i) => {
      b.displayOrder = i;
    });

    setBlocks(newBlocks);
  };

  const renderEditor = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.editorScroll}>
      <View style={styles.formSection}>
        <View style={[common.rowBetween, styles.sectionHeaderRowExtra]}>
          <Text style={styles.sectionHeader}>Content Blocks</Text>
          <View style={[common.row, styles.addButtonsExtra]}>
            <TouchableOpacity
              style={styles.miniBtn}
              onPress={() => handleAddBlock('text')}>
              <Text style={styles.miniBtnText}>+ Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.miniBtn}
              onPress={() => handleAddBlock('image')}>
              <Text style={styles.miniBtnText}>+ Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.miniBtn}
              onPress={() => handleAddBlock('video')}>
              <Text style={styles.miniBtnText}>+ Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.miniBtn}
              onPress={() => handleAddBlock('audio')}>
              <Text style={styles.miniBtnText}>+ Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.lessonBtn}
              onPress={() => handleAddBlock('lesson')}>
              <Text style={styles.lessonBtnText}>+ Lesson</Text>
            </TouchableOpacity>
          </View>
        </View>

        {blocks.map((block, index) => (
          <View key={block.id} style={styles.blockEditor}>
            <View style={[common.rowBetween, styles.blockHeaderExtra]}>
              <View style={[common.row, styles.blockHeaderLeftExtra]}>
                <View style={[common.row, styles.reorderControlsExtra]}>
                  <TouchableOpacity
                    onPress={() => moveBlock(index, 'up')}
                    disabled={index === 0}
                    style={[
                      styles.reorderBtn,
                      index === 0 && styles.disabledBtn,
                    ]}>
                    <Text style={{color: colors.text.primary}}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                    style={[
                      styles.reorderBtn,
                      index === blocks.length - 1 && styles.disabledBtn,
                    ]}>
                    <Text style={{color: colors.text.primary}}>↓</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.blockTitle}>
                  {index + 1}. {block.blockType.toUpperCase()}
                  {block.blockType === 'lesson' && (
                    <Text style={styles.blockSubtitle}>
                      {' - '}
                      {lessons.find(
                        l => l.id === (block.content as any).lessonId,
                      )?.title || 'Unknown Lesson'}
                    </Text>
                  )}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeBlock(block.id)}>
                <Text style={{color: colors.error}}>Remove</Text>
              </TouchableOpacity>
            </View>

            {block.blockType === 'text' && (
              <TextInput
                style={[styles.input, styles.codeArea]}
                value={(block.content as any).text}
                onChangeText={t => updateBlockContent(block.id, {text: t})}
                multiline
                placeholder="Markdown content..."
              />
            )}

            {block.blockType === 'text' && (
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => setShowHelpModal(true)}>
                <Text style={styles.helpButtonText}>Formatting Help</Text>
              </TouchableOpacity>
            )}

            {block.blockType === 'image' && (
              <View>
                <Text style={styles.label}>Image URL</Text>
                <View style={styles.rowExtra}>
                  <TextInput
                    style={styles.input}
                    value={(block.content as any).url}
                    onChangeText={t => updateBlockContent(block.id, {url: t})}
                  />
                  <MediaUploader
                    mediaType="image"
                    onUploadComplete={url =>
                      updateBlockContent(block.id, {url})
                    }
                  />
                </View>
                <Text style={styles.label}>Caption/Alt</Text>
                <TextInput
                  style={styles.input}
                  value={(block.content as any).alt}
                  onChangeText={t => updateBlockContent(block.id, {alt: t})}
                />
              </View>
            )}

            {block.blockType === 'video' && (
              <View>
                <Text style={styles.label}>Video URL</Text>
                <View style={styles.rowExtra}>
                  <TextInput
                    style={styles.input}
                    value={(block.content as any).url}
                    onChangeText={t => updateBlockContent(block.id, {url: t})}
                  />
                  <MediaUploader
                    mediaType="video"
                    onUploadComplete={url =>
                      updateBlockContent(block.id, {url})
                    }
                  />
                </View>
              </View>
            )}

            {block.blockType === 'audio' && (
              <View>
                <Text style={styles.label}>Audio URL</Text>
                <View style={styles.rowExtra}>
                  <TextInput
                    style={styles.input}
                    value={(block.content as any).url}
                    onChangeText={t => updateBlockContent(block.id, {url: t})}
                  />
                  <MediaUploader
                    mediaType="audio"
                    onUploadComplete={url =>
                      updateBlockContent(block.id, {url})
                    }
                  />
                </View>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={(block.content as any).title}
                  onChangeText={t => updateBlockContent(block.id, {title: t})}
                />
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={(block.content as any).description}
                  onChangeText={t =>
                    updateBlockContent(block.id, {description: t})
                  }
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPreview = () => (
    <View style={[common.flex1, styles.previewContainerExtra]}>
      <View style={styles.phoneFrame}>
        <View style={styles.phoneScreen}>
          <ThemeProvider>
            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={[
                styles.previewContent,
                {backgroundColor: colors.background},
              ]}
              showsVerticalScrollIndicator={false}>
              {/* Course Header Mockup */}
              <View style={styles.courseHeader}>
                <Text style={styles.previewTitle}>{course.title}</Text>
                {(course as any).title_target && (
                  <Text style={styles.previewSubtitle}>
                    {(course as any).title_target}
                  </Text>
                )}

                {blocks.map(block => (
                  <View key={block.id} style={{marginBottom: spacing.md}}>
                    <ContentBlockRenderer block={block} containerWidth={335} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </ThemeProvider>
        </View>
      </View>
    </View>
  );

  const handlePublish = async () => {
    console.log('🚀 Publish course content clicked!');
    setSaving(true);
    try {
      // Publish directly to database (no storage draft required)
      console.log('📝 Publishing course content to database...');
      await draftService.publishCourse(courseId, blocks);
      console.log('✅ Course content publish complete!');

      Alert.alert('Success', 'Course content published successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('❌ Publish error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Error',
        `Failed to publish course content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const styles = useThemedStyles(createStyles);

  if (loading) {
    return (
      <View style={[common.flex1, common.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={common.container}>
      <AppBar
        title="Course Content"
        showBack
        onBackPress={() => navigation.goBack()}
        rightElement={
          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity
              style={[
                styles.draftButton,
                !isLargeScreen && {paddingHorizontal: 8, paddingVertical: 8},
              ]}
              onPress={handleSaveDraft}
              disabled={saving}>
              {isLargeScreen ? (
                <Text style={styles.draftButtonText}>
                  {saving ? 'Saving...' : 'Save Draft'}
                </Text>
              ) : (
                <Save size={20} color={colors.text.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.publishButton,
                !isLargeScreen && {paddingHorizontal: 8, paddingVertical: 8},
              ]}
              onPress={handlePublish}
              disabled={saving}>
              {isLargeScreen ? (
                <Text style={styles.publishButtonText}>Publish</Text>
              ) : (
                <Upload size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      {/* Main Content */}
      <View style={styles.splitView}>
        {/* Editor Panel */}
        {(isLargeScreen || activeTab === 'edit') && (
          <View style={[styles.panel, styles.editorPanel]}>
            {renderEditor()}
          </View>
        )}

        {/* Preview Panel */}
        {(isLargeScreen || activeTab === 'preview') && (
          <View style={[styles.panel, styles.previewPanel]}>
            {renderPreview()}
          </View>
        )}
      </View>

      {/* Mobile Tab Bar */}
      {!isLargeScreen && (
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
      )}

      <Modal
        visible={showLessonModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLessonModal(false)}>
        <View style={[common.flex1, common.centered, styles.modalOverlayExtra]}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Lesson</Text>
            <FlatList
              data={lessons}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.lessonItem}
                  onPress={() => handleAddLessonBlock(item)}>
                  <Text style={styles.lessonTitle}>{item.title}</Text>
                  {item.titleTarget && (
                    <Text style={styles.lessonSubtitle}>
                      {item.titleTarget}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLessonModal(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHelpModal(false)}>
        <View style={[common.flex1, common.centered, styles.modalOverlayExtra]}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Markdown Formatting Guide</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{maxHeight: 400}}>
              <Text style={styles.helpText}>
                <Text style={{fontWeight: typography.weights.bold}}>Bold:</Text>{' '}
                **text**
              </Text>
              <Text style={styles.helpText}>
                <Text style={{fontStyle: 'italic'}}>Italic:</Text> *text*
              </Text>
              <Text style={styles.helpText}>
                <Text style={{fontWeight: typography.weights.bold}}>Link:</Text>{' '}
                [Link Text](https://example.com)
              </Text>
              <Text style={styles.helpText}>
                <Text style={{fontWeight: typography.weights.bold}}>List:</Text>{' '}
                - Item 1
              </Text>
              <View style={styles.divider} />
              <Text style={styles.noteText}>
                Note: Colors and Underlining are not standard Markdown and are
                not supported directly. Use Bold/Italic for emphasis. Links will
                appear blue and underlined automatically.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHelpModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) => {
  return {
    headerExtra: {
      minHeight: 60,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    backText: {color: colors.primary, fontSize: typography.sizes.sm},
    headerTitle: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
    },
    exitButton: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exitButtonText: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      fontWeight: typography.weights.semibold,
    },
    headerActionsExtra: {
      gap: spacing.sm,
      flexWrap: 'wrap' as const,
    },
    draftButton: {
      padding: spacing.sm,
      backgroundColor: colors.borderSubtle,
      borderRadius: borderRadius.sm,
    },
    draftButtonText: {color: colors.text.primary},
    publishButton: {
      padding: spacing.sm,
      backgroundColor: colors.success,
      borderRadius: borderRadius.sm,
    },
    publishButtonText: {
      color: colors.white,
      fontWeight: typography.weights.bold,
    },

    splitView: {
      flex: 1,
      flexDirection: 'row' as const,
      overflow: 'hidden' as const,
    },
    panel: {
      flex: 1,
      overflow: 'hidden' as const,
    },
    editorPanel: {
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    previewPanel: {
      backgroundColor: colors.surfaceSubtle,
      overflow: 'scroll' as const,
    },

    editorScroll: {
      flex: 1,
      padding: spacing.lg,
      ...Platform.select({
        web: {
          height: '100%' as any,
          overflowY: 'auto' as any,
        },
      }),
    } as any,
    formSection: {
      marginBottom: spacing.lg,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.md,
    },
    sectionHeader: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.bold,
      marginBottom: spacing.sm,
      color: colors.text.primary,
    },
    sectionHeaderRowExtra: {
      marginBottom: spacing.sm,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface,
      color: colors.text.primary,
      fontSize: typography.sizes.sm,
    },
    codeArea: {
      height: 150,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    label: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    addButtonsExtra: {
      gap: spacing.sm,
      flexWrap: 'wrap' as const,
    },
    miniBtn: {
      padding: spacing.xs,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: borderRadius.sm,
    },
    miniBtnText: {color: colors.text.primary, fontSize: typography.sizes.xs},
    lessonBtn: {
      padding: spacing.xs,
      backgroundColor: colors.success,
      borderRadius: borderRadius.sm,
    },
    lessonBtnText: {
      color: colors.white,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
    },

    blockEditor: {
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.sm,
    },
    blockHeaderExtra: {},
    helpButton: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 16,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    helpButtonText: {
      fontSize: typography.sizes.xs,
      color: colors.primary,
      fontWeight: typography.weights.semibold,
    },
    helpText: {
      fontSize: typography.sizes.sm,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    noteText: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
      fontStyle: 'italic' as const,
      marginTop: spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 15,
    },
    blockHeaderLeftExtra: {
      gap: spacing.sm,
    },
    reorderControlsExtra: {
      gap: spacing.xs,
    },
    reorderBtn: {
      padding: spacing.xs,
      backgroundColor: colors.borderSubtle,
      borderRadius: borderRadius.sm,
      minWidth: 25,
      alignItems: 'center' as const,
    },
    disabledBtn: {
      opacity: opacity.disabled,
    },
    blockTitle: {
      fontWeight: typography.weights.bold,
      fontSize: typography.sizes.xs,
      color: colors.text.primary,
    },
    blockSubtitle: {
      fontWeight: typography.weights.normal,
      fontSize: 11,
      color: colors.text.secondary,
    },

    previewContainerExtra: {
      alignItems: 'center' as const,
      justifyContent: 'flex-start' as const,
      padding: spacing.sm,
    },
    phoneFrame: {
      width: 375,
      height: 667,
      backgroundColor: colors.text.primary,
      borderRadius: borderRadius.xl,
      padding: spacing.sm,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 10,
    },
    phoneScreen: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      overflow: 'hidden' as const,
    },
    previewContent: {
      padding: spacing.lg,
      flexGrow: 0,
    },
    courseHeader: {marginBottom: spacing.lg},
    previewTitle: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      marginBottom: 5,
      color: colors.text.primary,
    },
    previewSubtitle: {
      fontSize: typography.sizes.base,
      color: colors.success,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      marginBottom: spacing.sm,
      color: colors.text.primary,
    },
    mockLessonItem: {
      padding: spacing.md,
      backgroundColor: colors.surfaceSubtle,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },

    tabBarExtra: {
      height: 50,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    tabText: {
      color: colors.text.primary,
      fontWeight: typography.weights.medium,
    },
    activeTab: {borderTopWidth: 2, borderColor: colors.primary},
    rowExtra: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    modalOverlayExtra: {
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '80%',
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      elevation: 5,
    } as any,
    modalTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      marginBottom: 15,
      textAlign: 'center' as const,
      color: colors.text.primary,
    },
    lessonItem: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    lessonTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
    },
    lessonSubtitle: {
      fontSize: typography.sizes.xs,
      color: colors.text.secondary,
    },
    closeButton: {
      marginTop: 15,
      padding: spacing.sm,
      backgroundColor: colors.borderSubtle,
      borderRadius: 5,
      alignItems: 'center' as const,
    },
    closeButtonText: {
      color: colors.text.primary,
      fontWeight: typography.weights.bold,
    },
  };
};
