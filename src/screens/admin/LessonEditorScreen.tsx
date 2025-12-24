import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { draftService } from '@/services/admin/draftService';
import { supabase } from '@/services/supabase';
import { ContentBlockRenderer } from '@/components/content/ContentBlockRenderer';
import { ThemeProvider, useTheme } from '@/components/shared/ThemeProvider';
import { MediaUploader } from '@/components/admin/MediaUploader';
import { ExerciseEditor } from '@/components/admin/ExerciseEditor';
import { AppBar } from '@/components/shared/AppBar';
import { Save, Upload } from 'lucide-react-native';
import { generateUUID } from '@/utils/uuid';
import type { Tables } from '@/types/database';
import type { ContentBlock } from '@/types/content';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing, borderRadius, typography, opacity } from '@/theme';
import { createCommonStyles } from '@/theme/commonStyles';

type AdminStackParamList = {
  LessonEditor: { courseId: string; lessonId?: string; mode: 'create' | 'edit' };
};

export const LessonEditorScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminStackParamList, 'LessonEditor'>>();
  const { courseId, lessonId, mode } = route.params;
  const windowWidth = Dimensions.get('window').width;
  const isLargeScreen = windowWidth > 900;
  const { colors } = useTheme();
  const common = createCommonStyles(colors);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Draft State
  const [lesson, setLesson] = useState<Partial<Tables<'lessons'>>>({
    title: '',
    title_target: '',
    description: '',
    estimated_minutes: 10,
    display_order: 0,
    course_id: courseId,
  });
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [defaultLanguageId, setDefaultLanguageId] = useState<string | null>(
    null,
  ); // Initialize to null

  // Prerequisite State
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [availablePrerequisites, setAvailablePrerequisites] = useState<
    Tables<'lessons'>[]
  >([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Use useFocusEffect to reload data when screen comes into focus
  // This ensures data is fresh after publishing and navigating back
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        if (mode === 'create') {
          // Load other lessons for prerequisites even in create mode
          if (courseId) {
            // Load course language
            const { data: courseData } = await supabase
              .from('courses')
              .select('language_id')
              .eq('id', courseId)
              .single();

            if ((courseData as any)?.language_id) {
              setDefaultLanguageId((courseData as any).language_id);
            }

            const { data: otherLessons } = await supabase
              .from('lessons')
              .select('*')
              .eq('course_id', courseId)
              .order('display_order');

            if (otherLessons) {
              setAvailablePrerequisites(otherLessons);
            }
          }
          return;
        }
        if (!lessonId) {
          return;
        }

        setLoading(true);
        try {
          // Load other lessons for prerequisites
          const { data: otherLessons } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .neq('id', lessonId) // Exclude current lesson
            .order('display_order');

          if (otherLessons) {
            setAvailablePrerequisites(otherLessons);
          }

          // Try to load draft first
          try {
            const draft = await draftService.loadDraft('lesson', lessonId);
            if (draft && draft.data) {
              setLesson(draft.data.lesson);
              setBlocks(draft.data.blocks || []);
              // Try to infer language from first block
              if (draft.data.blocks && draft.data.blocks.length > 0) {
                setDefaultLanguageId(draft.data.blocks[0].languageId || 'en');
              }
              // TODO: Load prerequisites from draft if we decide to store them there
              setLoading(false);
              return;
            }
          } catch (e) {
            console.log('No draft found, loading from DB');
          }

          // Load from DB
          const { data: lessonData, error: lessonError } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();

          if (lessonError) {
            throw lessonError;
          }
          setLesson(lessonData);

          // Load prerequisites
          const { data: prereqData } = await supabase
            .from('lesson_prerequisites')
            .select('prerequisite_lesson_id')
            .eq('lesson_id', lessonId);

          if (prereqData) {
            setPrerequisites(
              (prereqData as any[]).map(p => p.prerequisite_lesson_id),
            );
          }

          // Load course to get language_id
          const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('language_id')
            .eq('id', courseId)
            .single();

          if (courseError) {
            console.error('Error loading course:', courseError);
          } else if ((courseData as any)?.language_id) {
            setDefaultLanguageId((courseData as any).language_id);
          }

          // Load blocks
          const { data: blockData, error: blockError } = await supabase
            .from('content_blocks')
            .select('*')
            .eq('parent_id', lessonId)
            .eq('parent_type', 'lesson')
            .order('display_order', { ascending: true });

          if (blockError) {
            throw blockError;
          }

          // Map DB blocks to ContentBlock type
          const mappedBlocks: ContentBlock[] = await Promise.all(
            ((blockData as any[]) || []).map(async b => {
              const block: ContentBlock = {
                id: b.id,
                parentType: 'lesson',
                parentId: lessonId,
                blockType: b.block_type as any,
                content: b.content as any,
                metadata: b.metadata as any,
                displayOrder: b.display_order,
                isAvailable: b.is_available ?? true,
                languageId:
                  b.language_id || (courseData as any)?.language_id || 'en',
                createdAt: b.created_at,
                updatedAt: b.updated_at || b.created_at,
              };

              // If exercise, fetch sentences to populate the editor
              if (
                block.blockType === 'exercise' &&
                (block.content as any).exerciseId
              ) {
                // Fetch exercise details (including type)
                const { data: exerciseData } = await supabase
                  .from('exercises')
                  .select('type, title')
                  .eq('id', (block.content as any).exerciseId)
                  .single();

                (block.content as any).type =
                  (exerciseData as any)?.type || 'standard';
                (block.content as any).title = (exerciseData as any)?.title;

                const { data: units } = (await supabase
                  .from('exercise_units')
                  .select('*')
                  .eq('exercise_id', (block.content as any).exerciseId)
                  .order('display_order')) as { data: any[] | null };

                if (units) {
                  // Fetch sentence audio (using sentence_id as unit_id FK)
                  const { data: sentenceAudio } = (await supabase
                    .from('sentence_audio')
                    .select('*')
                    .in(
                      'sentence_id',
                      units.map(u => u.id),
                    )) as { data: any[] | null };

                  // Fetch word audio
                  const { data: wordAudio } = (await supabase
                    .from('word_audio')
                    .select('*')
                    .in(
                      'sentence_id',
                      units.map(u => u.id),
                    )) as { data: any[] | null };

                  (block.content as any).units = units.map((u: any) => {
                    const audio = sentenceAudio
                      ?.filter(sa => sa.sentence_id === u.id)
                      .map(sa => ({
                        url: sa.audio_url,
                        speakerId: sa.speaker_id,
                      }));

                    const wordAudioUrls: Record<string, any> = {};
                    const unitWordAudio = wordAudio?.filter(
                      wa => wa.sentence_id === u.id,
                    );

                    if (unitWordAudio) {
                      unitWordAudio.forEach(wa => {
                        const word = wa.word;
                        if (!wordAudioUrls[word]) {
                          wordAudioUrls[word] = [];
                        }
                        if (!Array.isArray(wordAudioUrls[word])) {
                          const existing = wordAudioUrls[word];
                          wordAudioUrls[word] = existing ? [existing] : [];
                        }

                        (wordAudioUrls[word] as any[]).push({
                          url: wa.audio_url,
                          speakerId: wa.speaker_id,
                        });
                      });
                    }

                    // Construct metadata with audio
                    const metadata = u.metadata || {};
                    // If audio exists, put it in metadata.audio (standardized format)
                    if (audio && audio.length > 0) {
                      metadata.audio = audio;
                    }
                    if (Object.keys(wordAudioUrls).length > 0) {
                      metadata.wordAudioUrls = wordAudioUrls;
                    }

                    return {
                      id: u.id,
                      unitType: u.unit_type,
                      content: u.content,
                      metadata: metadata,
                    };
                  });
                }
              }

              return block;
            }),
          );
          setBlocks(mappedBlocks);

          // If we didn't get language from course (e.g. error or missing), try to infer from blocks
          if (!(courseData as any)?.language_id && mappedBlocks.length > 0) {
            setDefaultLanguageId(mappedBlocks[0].languageId || 'en');
          }
        } catch (error) {
          console.error('Error loading lesson:', error);
          Alert.alert('Error', 'Failed to load lesson');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [lessonId, courseId, mode]),
  );

  const handleSaveDraft = async () => {
    console.log('💾 handleSaveDraft called');

    if (!lesson.title) {
      console.log('❌ No lesson title');
      Alert.alert('Error', 'Lesson title is required');
      return;
    }

    setSaving(true);
    try {
      const id = lessonId || lesson.id || generateUUID();
      console.log('📦 Saving draft with ID:', id);

      const data = {
        lesson: { ...lesson, id }, // Ensure ID is present
        blocks,
        updatedAt: new Date().toISOString(),
      };

      console.log('📦 Draft data:', data);
      console.log('📦 Calling draftService.saveDraft...');

      await draftService.saveDraft('lesson', id, data, lesson.title);
      console.log('✅ Draft saved successfully');
      Alert.alert('Success', 'Draft saved!');

      // Update lesson state with the ID if it was newly generated
      if (!lesson.id) {
        setLesson({ ...lesson, id });
      }
    } catch (error) {
      console.error('❌ Error saving draft:', error);
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
    if (!defaultLanguageId) {
      Alert.alert(
        'Wait',
        'Course language is still loading. Please try again in a moment.',
      );
      return;
    }

    // Ensure we have a lesson ID before adding blocks
    let currentLessonId = lessonId || lesson.id;

    // If no ID exists, generate one and update state
    if (!currentLessonId) {
      currentLessonId = generateUUID();
      console.log(
        '🆕 Generated new lesson ID for block addition:',
        currentLessonId,
      );
      setLesson(prev => ({ ...prev, id: currentLessonId }));
    }

    const newBlock: ContentBlock = {
      id: generateUUID(),
      parentType: 'lesson',
      parentId: currentLessonId, // Must be a valid UUID
      blockType,
      content: {} as any,
      displayOrder: blocks.length,
      isAvailable: true,
      languageId: defaultLanguageId, // Use course language
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
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        caption: 'Sample Video',
      };
    } else if (blockType === 'audio') {
      newBlock.content = {
        url: '',
        title: 'New Audio',
        description: '',
      };
    } else if (blockType === 'exercise') {
      // Generate exercise ID upfront
      const exerciseId = generateUUID();
      newBlock.content = {
        exerciseId: exerciseId,
        units: [],
        type: 'standard',
      };
    }

    setBlocks([...blocks, newBlock]);
  };

  const updateBlockContent = (blockId: string, content: any) => {
    setBlocks(
      blocks.map(b =>
        b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b,
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

    // Update displayOrder property just in case, though publish uses array index
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
        <Text style={styles.sectionHeader}>Metadata</Text>
        <TextInput
          style={styles.input}
          placeholder="Lesson Title"
          value={lesson.title}
          onChangeText={t => setLesson({ ...lesson, title: t })}
          placeholderTextColor={colors.text.secondary}
        />
        <TextInput
          style={styles.input}
          placeholder="Lesson Title (Target Language)"
          value={lesson.title_target || ''}
          onChangeText={t => setLesson({ ...lesson, title_target: t })}
          placeholderTextColor={colors.text.secondary}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={lesson.description || ''}
          onChangeText={t => setLesson({ ...lesson, description: t })}
          multiline
          placeholderTextColor={colors.text.secondary}
        />

        <Text style={styles.label}>Estimated Minutes</Text>
        <TextInput
          style={styles.input}
          value={String(lesson.estimated_minutes || 0)}
          onChangeText={t =>
            setLesson({ ...lesson, estimated_minutes: parseInt(t, 10) || 0 })
          }
          keyboardType="numeric"
          placeholderTextColor={colors.text.secondary}
        />

        <Text style={[styles.label, { marginTop: spacing.sm }]}>
          Prerequisites
        </Text>
        <View style={[common.row, styles.prereqContainerExtra]}>
          {availablePrerequisites.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[
                common.row,
                styles.prereqItemExtra,
                prerequisites.includes(p.id) && styles.prereqItemSelected,
              ]}
              onPress={() => {
                if (prerequisites.includes(p.id)) {
                  setPrerequisites(prerequisites.filter(id => id !== p.id));
                } else {
                  setPrerequisites([...prerequisites, p.id]);
                }
              }}>
              <Text
                style={[
                  styles.prereqText,
                  prerequisites.includes(p.id) && styles.prereqTextSelected,
                ]}>
                {p.title}
              </Text>
            </TouchableOpacity>
          ))}
          {availablePrerequisites.length === 0 && (
            <Text style={{ color: colors.text.secondary, fontStyle: 'italic' }}>
              No other lessons available to set as prerequisites.
            </Text>
          )}
        </View>
      </View>

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
              style={styles.miniBtn}
              onPress={() => handleAddBlock('exercise')}>
              <Text style={styles.miniBtnText}>+ Exercise</Text>
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
                    <Text style={styles.reorderBtnText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                    style={[
                      styles.reorderBtn,
                      index === blocks.length - 1 && styles.disabledBtn,
                    ]}>
                    <Text style={styles.reorderBtnText}>↓</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.blockTitle}>
                  {index + 1}. {block.blockType.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeBlock(block.id)}>
                <Text style={{ color: colors.error }}>Remove</Text>
              </TouchableOpacity>
            </View>

            {block.blockType === 'text' && (
              <TextInput
                style={[styles.input, styles.codeArea]}
                value={(block.content as any).text}
                onChangeText={t => updateBlockContent(block.id, { text: t })}
                multiline
                placeholder="Markdown content..."
                placeholderTextColor={colors.text.secondary}
              />
            )}

            {block.blockType === 'image' && (
              <View>
                <Text style={styles.label}>Image URL</Text>
                <View style={{ gap: spacing.sm }}>
                  <TextInput
                    style={styles.input}
                    value={(block.content as any).url}
                    onChangeText={t => updateBlockContent(block.id, { url: t })}
                    placeholderTextColor={colors.text.secondary}
                  />
                  <MediaUploader
                    mediaType="image"
                    onUploadComplete={url =>
                      updateBlockContent(block.id, { url })
                    }
                  />
                </View>
                <Text style={styles.label}>Caption/Alt</Text>
                <TextInput
                  style={styles.input}
                  value={(block.content as any).alt}
                  onChangeText={t => updateBlockContent(block.id, { alt: t })}
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            )}

            {block.blockType === 'video' && (
              <View>
                <Text style={styles.label}>Video URL</Text>
                <View style={{ gap: spacing.sm }}>
                  <TextInput
                    style={styles.input}
                    value={(block.content as any).url}
                    onChangeText={t => updateBlockContent(block.id, { url: t })}
                    placeholderTextColor={colors.text.secondary}
                  />
                  <MediaUploader
                    mediaType="video"
                    onUploadComplete={url =>
                      updateBlockContent(block.id, { url })
                    }
                  />
                </View>
              </View>
            )}

            {block.blockType === 'audio' && (
              <View>
                <Text style={styles.label}>Audio URL</Text>
                <View style={{ gap: spacing.sm }}>
                  <TextInput
                    style={styles.input}
                    value={(block.content as any).url}
                    onChangeText={t => updateBlockContent(block.id, { url: t })}
                    placeholderTextColor={colors.text.secondary}
                  />
                  <MediaUploader
                    mediaType="audio"
                    onUploadComplete={url =>
                      updateBlockContent(block.id, { url })
                    }
                  />
                </View>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={(block.content as any).title}
                  onChangeText={t => updateBlockContent(block.id, { title: t })}
                  placeholderTextColor={colors.text.secondary}
                />
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={(block.content as any).description}
                  onChangeText={t =>
                    updateBlockContent(block.id, { description: t })
                  }
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            )}

            {block.blockType === 'exercise' && (
              <ExerciseEditor
                content={block.content as any}
                onChange={content => updateBlockContent(block.id, content)}
              />
            )}

            {/* Add other block editors here */}
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
              style={{ flex: 1 }}
              contentContainerStyle={[
                styles.previewContent,
                { backgroundColor: colors.background },
              ]}
              showsVerticalScrollIndicator={false}>
              <Text style={[styles.previewTitle, { color: colors.text.primary }]}>
                {lesson.title || 'Untitled Lesson'}
              </Text>
              {blocks.map(block => (
                <View key={block.id} style={{ marginBottom: spacing.md }}>
                  <ContentBlockRenderer block={block} containerWidth={335} />
                </View>
              ))}
            </ScrollView>
          </ThemeProvider>
        </View>
      </View>
    </View>
  );

  const handlePublish = async () => {
    console.log('🚀 Publish button clicked!');
    console.log('lessonId:', lessonId);
    console.log('lesson.id:', lesson.id);
    console.log('lesson:', lesson);
    console.log('blocks:', blocks);

    if (!lesson.title) {
      Alert.alert('Error', 'Lesson title is required');
      return;
    }

    // Ensure lesson has an ID
    const idToPublish = lessonId || lesson.id || generateUUID();
    console.log('📤 Publishing with ID:', idToPublish);

    // Update blocks to ensure they all have the correct parentId
    // Deep clone to avoid any state corruption issues
    const updatedBlocks = blocks.map(block => ({
      ...block,
      parentId: idToPublish, // Ensure all blocks reference the correct lesson
      content: JSON.parse(JSON.stringify(block.content)), // Deep clone content
    }));

    // Validate blocks
    const invalidBlocks = updatedBlocks.filter(
      block => !block.parentId || block.parentId === '',
    );
    if (invalidBlocks.length > 0) {
      Alert.alert(
        'Error',
        'Some blocks have invalid parent IDs. Please check your content.',
      );
      console.error('❌ Invalid blocks:', invalidBlocks);
      return;
    }

    setSaving(true);
    try {
      const lessonData = { ...lesson, id: idToPublish };

      // Publish directly to database (no storage draft required)
      console.log('📝 Publishing lesson to database...');
      await draftService.publishLesson(
        lessonData,
        updatedBlocks,
        prerequisites,
      );
      console.log('✅ Publish complete!');

      // Prerequisites are now handled inside draftService.publishLesson using the fresh client
      console.log('🔗 Prerequisites updated via draftService');

      Alert.alert('Success', 'Lesson published successfully!', [
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
        `Failed to publish lesson: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setSaving(false);
      console.log('🏁 Publish process finished');
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
        title="Lesson Editor"
        showBack
        onBackPress={() => navigation.goBack()}
        rightElement={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.draftButton,
                !isLargeScreen && { paddingHorizontal: 8, paddingVertical: 8 },
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
                !isLargeScreen && { paddingHorizontal: 8, paddingVertical: 8 },
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
    </View>
  );
};

const createStyles = (colors: any) => ({
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
  backText: { color: colors.primary, fontSize: typography.sizes.sm },
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
  headerActionsExtra: { gap: spacing.sm },
  draftButton: {
    padding: spacing.sm,
    backgroundColor: colors.borderSubtle,
    borderRadius: borderRadius.sm,
  },
  draftButtonText: { color: colors.text.primary },
  publishButton: {
    padding: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
  },
  publishButtonText: { color: colors.white, fontWeight: typography.weights.bold },

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
    padding: spacing.md, // Reduced padding for potentially smaller screens
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
  textArea: { height: 80, textAlignVertical: 'top' as const },
  codeArea: {
    height: 150,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  // Use: [common.rowBetween, styles.rowExtra]
  rowExtra: {
    alignItems: 'center' as const,
  },
  halfInput: { width: '48%' as const },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: 4,
  },

  addButtonsExtra: { gap: spacing.sm },
  miniBtn: {
    padding: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.sm,
  },
  miniBtnText: { color: colors.text.primary, fontSize: typography.sizes.xs },

  blockEditor: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  blockHeaderExtra: {
    marginBottom: spacing.sm,
  },
  blockTitle: {
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },

  // Use: [common.flex1, styles.previewContainerExtra] (alignItems: center is specific here)
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
  previewTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
    color: colors.text.primary,
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
  activeTab: { borderTopWidth: 2, borderColor: colors.primary },

  prereqContainerExtra: {
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  prereqItemExtra: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    gap: spacing.xs,
  },
  prereqItemSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  prereqText: {
    color: colors.text.primary,
  },
  prereqTextSelected: {
    color: colors.surface,
    fontWeight: typography.weights.bold,
  },

  blockHeaderLeftExtra: {
    gap: spacing.sm,
  },
  reorderControlsExtra: {
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  reorderBtn: {
    padding: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    width: 30,
    alignItems: 'center' as const,
  },
  reorderBtnText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  disabledBtn: {
    opacity: opacity.disabled,
  },
  tabText: {
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
});
