import React from 'react';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import {useTheme} from '@/components/shared';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {MediaUploader} from './MediaUploader';
import {playUrl} from '@/services/audio';
import {Play} from 'lucide-react-native';
import type {ExerciseBlockContent, DraftExerciseUnit} from '@/types/content';
import {spacing, borderRadius, typography} from '@/theme';
import {ThemeColors} from '@/theme/colors';
import {createCommonStyles} from '@/theme/commonStyles';

interface Props {
  content: ExerciseBlockContent;
  onChange: (content: ExerciseBlockContent) => void;
}

import {supabase} from '@/services/supabase';

type Speaker = {
  id: string;
  display_name: string;
  name: string;
};

// Styles factory function - extracted and using theme constants
const createStyles = (colors: ThemeColors) => ({
  container: {
    marginTop: spacing.sm,
  },
  header: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  pairContainer: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  // Use: [common.rowBetween, styles.pairHeaderExtra]
  pairHeaderExtra: {
    marginBottom: spacing.xs,
  },
  pairTitle: {
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
  },
  removeText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    color: colors.text.primary,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  labelNoMarginTop: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: 0,
  },
  labelItalic: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontStyle: 'italic' as const,
  },
  // Use: [common.row, styles.rowWrapExtra]
  rowWrapExtra: {
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  wordAudioContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Use: [common.rowBetween, styles.wordRowExtra]
  wordRowExtra: {
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  addButton: {
    backgroundColor: colors.primary + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center' as const,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  addButtonTextSmall: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
  // Group container styles (matching pairs)
  groupContainer: {
    marginBottom: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  // Use: [common.rowBetween, styles.groupHeaderExtra]
  groupHeaderExtra: {
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontWeight: typography.weights.bold,
    color: colors.primary,
    fontSize: typography.sizes.base,
  },
  // Speaker selector styles
  speakerContainer: {
    marginBottom: spacing.sm,
  },
  speakerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  speakerChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  speakerChipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  speakerChipTextSelected: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  speakerChipTextUnselected: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  // Use: [common.rowBetween, styles.audioRowExtra]
  audioRowExtra: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xs,
  },
  // Use: [common.row, styles.audioRowActionsExtra]
  audioRowActionsExtra: {
    gap: spacing.sm,
  },
  playButton: {
    padding: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  // Use: [common.rowBetween, styles.wordAudioItemExtra]
  wordAudioItemExtra: {
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  wordAudioItemText: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  // Use: [common.row, styles.wordAudioItemActionsExtra]
  wordAudioItemActionsExtra: {
    gap: spacing.xs,
  },
  wordLabel: {
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
    color: colors.text.primary,
  },
  removeTextSmall: {
    fontSize: typography.sizes.xs,
    color: colors.error,
  },
  // Exercise type chip styles
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  typeChipTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.medium,
    textTransform: 'capitalize' as const,
  },
  typeChipTextUnselected: {
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
    textTransform: 'capitalize' as const,
  },
  // Use: [common.row, styles.requiredRowExtra]
  requiredRowExtra: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  requiredChipActive: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.success,
  },
  requiredChipInactive: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requiredTextActive: {
    color: colors.white,
  },
  requiredTextInactive: {
    color: colors.text.secondary,
  },
  // Add group button (dashed border variant)
  addGroupButton: {
    backgroundColor: colors.success + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: colors.success,
    borderStyle: 'dashed' as const,
  },
  addGroupButtonText: {
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  // Add pair button (lighter variant)
  addPairButton: {
    backgroundColor: colors.primary + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center' as const,
  },
  // Helper text styles
  helperText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  textPrimary: {
    color: colors.text.primary,
  },
  // Use: [common.row, styles.typeRowExtra]
  typeRowExtra: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
});

export const ExerciseEditor: React.FC<Props> = ({content, onChange}) => {
  const {colors: themeColors} = useTheme();
  const styles = useThemedStyles(createStyles);
  const common = createCommonStyles(themeColors);

  // We'll initialize from units or empty.
  const units = content.units || [];

  const [speakers, setSpeakers] = React.useState<Speaker[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = React.useState<string>('');

  React.useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    console.log('🔈 Loading speakers...');
    const {data, error} = await supabase
      .from('speakers' as any)
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error loading speakers:', error);
      return;
    }

    console.log('✅ Loaded speakers:', data?.length);
    if (data) {
      setSpeakers(data as any);
      if (data.length > 0) {
        setSelectedSpeakerId((data[0] as any).id);
      }
    }
  };

  const updateUnit = (index: number, newUnit: any) => {
    const newUnits = [...units];
    newUnits[index] = newUnit;
    onChange({...content, units: newUnits});
  };

  const removeUnit = (index: number) => {
    const newUnits = units.filter((_, i) => i !== index);
    onChange({...content, units: newUnits});
  };

  /*
   * MATCHING PAIRS EDITOR - Uses MatchingGroupUnit
   */
  const renderMatchingPairsEditor = () => {
    // We only care about units that are 'matching_group'
    const matchingUnits = units
      .map((u, i) => ({unit: u, index: i}))
      .filter(
        (
          item,
        ): item is {
          unit: Extract<DraftExerciseUnit, {unitType: 'matching_group'}>;
          index: number;
        } => item.unit.unitType === 'matching_group',
      );

    const addGroup = () => {
      const newGroup = {
        unitType: 'matching_group',
        content: {pairs: []},
        metadata: {},
      };
      onChange({...content, units: [...units, newGroup as any]});
    };

    const addPairToGroup = (realIndex: number) => {
      const unit = units[realIndex];
      // Type guard technically needed but we know it's matching_group from context when called from matchingUnits list
      if (unit.unitType !== 'matching_group') {
        return;
      }

      const newPairs = [
        ...(unit.content.pairs || []),
        {source: '', target: ''},
      ];
      const newUnit = {...unit, content: {...unit.content, pairs: newPairs}};
      updateUnit(realIndex, newUnit);
    };

    const updatePair = (
      realIndex: number,
      pairIndex: number,
      field: string,
      value: string,
    ) => {
      const unit = units[realIndex];
      if (unit.unitType !== 'matching_group') {
        return;
      }

      const newPairs = [...unit.content.pairs];
      newPairs[pairIndex] = {...newPairs[pairIndex], [field]: value};

      const newUnit = {...unit, content: {...unit.content, pairs: newPairs}};
      updateUnit(realIndex, newUnit);
    };

    const removePair = (realIndex: number, pairIndex: number) => {
      const unit = units[realIndex];
      if (unit.unitType !== 'matching_group') {
        return;
      }

      const newPairs = unit.content.pairs.filter((_, i) => i !== pairIndex);
      const newUnit = {...unit, content: {...unit.content, pairs: newPairs}};
      updateUnit(realIndex, newUnit);
    };

    return (
      <View>
        <Text style={styles.header}>Matching Pairs</Text>
        <Text style={styles.labelItalic}>
          Organize pairs into groups. Each group is a separate "Unit".
        </Text>

        {matchingUnits.map(({unit, index: realIndex}, groupIndex) => (
          <View key={realIndex} style={styles.groupContainer}>
            <View style={[common.rowBetween, styles.groupHeaderExtra]}>
              <Text style={styles.groupTitle}>Group {groupIndex + 1}</Text>
              <TouchableOpacity onPress={() => removeUnit(realIndex)}>
                <Text style={styles.removeText}>Remove Group</Text>
              </TouchableOpacity>
            </View>

            {(unit.content.pairs || []).map((pair: any, pairIndex: number) => (
              <View key={pairIndex} style={styles.pairContainer}>
                <View style={[common.rowBetween, styles.pairHeaderExtra]}>
                  <Text style={styles.pairTitle}>Pair</Text>
                  <TouchableOpacity
                    onPress={() => removePair(realIndex, pairIndex)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <View style={common.row}>
                  <View style={common.flex1}>
                    <Text style={styles.label}>Item A</Text>
                    <TextInput
                      style={styles.input}
                      value={pair.source}
                      onChangeText={t =>
                        updatePair(realIndex, pairIndex, 'source', t)
                      }
                      placeholder="Source Text"
                      placeholderTextColor={themeColors.text.secondary}
                    />
                  </View>
                  <View style={common.spacerSm} />
                  <View style={common.flex1}>
                    <Text style={styles.label}>Item B</Text>
                    <TextInput
                      style={styles.input}
                      value={pair.target}
                      onChangeText={t =>
                        updatePair(realIndex, pairIndex, 'target', t)
                      }
                      placeholder="Target Text"
                      placeholderTextColor={themeColors.text.secondary}
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addPairButton}
              onPress={() => addPairToGroup(realIndex)}>
              <Text style={styles.addButtonTextSmall}>+ Add Pair to Group</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addGroupButton} onPress={addGroup}>
          <Text style={styles.addGroupButtonText}>+ Add Group</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /*
   * CLOZE EDITOR - Uses ClozeUnit
   */
  const renderClozeEditor = () => {
    const clozeUnits = units
      .map((u, i) => ({unit: u, index: i}))
      .filter(
        (
          item,
        ): item is {
          unit: Extract<DraftExerciseUnit, {unitType: 'cloze'}>;
          index: number;
        } => item.unit.unitType === 'cloze',
      );

    const addCloze = () => {
      const newUnit = {
        unitType: 'cloze',
        content: {source: '', target: ''},
        metadata: {distractors: []},
      };
      onChange({...content, units: [...units, newUnit as any]});
    };

    const updateCloze = (realIndex: number, field: string, value: any) => {
      const unit = units[realIndex];
      if (unit.unitType !== 'cloze') {
        return;
      }

      let newUnit;
      if (
        field === 'metadata' ||
        field === 'distractors' ||
        field === '_rawDistractors'
      ) {
        // Handle metadata updates
        const currentMeta = unit.metadata || {};
        const newMeta =
          field === 'metadata' ? value : {...currentMeta, [field]: value};
        // Special case for distractors updating from raw text helper
        if (field === '_rawDistractors') {
          const distractors = value
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
          newMeta.distractors = distractors;
          newMeta._rawDistractors = value;
        }
        newUnit = {...unit, metadata: newMeta};
      } else {
        // Content updates
        newUnit = {...unit, content: {...unit.content, [field]: value}};
      }
      updateUnit(realIndex, newUnit);
    };

    return (
      <View>
        <Text style={styles.header}>Fill in the Blanks (Cloze)</Text>
        <Text style={styles.labelItalic}>
          Use brackets [ ] to mark the blank words.
        </Text>

        {/* Speaker Selector */}
        <View style={styles.speakerContainer}>
          <Text style={styles.labelNoMarginTop}>Record as Speaker:</Text>
          <View style={[common.row, styles.rowWrapExtra]}>
            {speakers.map(s => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedSpeakerId(s.id)}
                style={[
                  styles.speakerChip,
                  selectedSpeakerId === s.id
                    ? styles.speakerChipSelected
                    : styles.speakerChipUnselected,
                ]}>
                <Text
                  style={
                    selectedSpeakerId === s.id
                      ? styles.speakerChipTextSelected
                      : styles.speakerChipTextUnselected
                  }>
                  {s.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {clozeUnits.map(({unit, index: realIndex}, i) => (
          <View key={realIndex} style={styles.pairContainer}>
            <View style={[common.rowBetween, styles.pairHeaderExtra]}>
              <Text style={styles.pairTitle}>Sentence {i + 1}</Text>
              <TouchableOpacity onPress={() => removeUnit(realIndex)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>English/Source</Text>
            <TextInput
              style={styles.input}
              value={unit.content.source}
              onChangeText={t => updateCloze(realIndex, 'source', t)}
              placeholder="e.g. The cat sat on the mat"
              placeholderTextColor={themeColors.text.secondary}
            />

            <Text style={styles.label}>Irish/Target (With brackets)</Text>
            <TextInput
              style={styles.input}
              value={unit.content.target}
              onChangeText={t => updateCloze(realIndex, 'target', t)}
              placeholder="e.g. [cat] ar an [mata]"
              placeholderTextColor={themeColors.text.secondary}
            />

            <Text style={styles.label}>Distractors</Text>
            <TextInput
              style={styles.input}
              value={
                unit.metadata?._rawDistractors ??
                unit.metadata?.distractors?.join(', ') ??
                ''
              }
              onChangeText={t => updateCloze(realIndex, '_rawDistractors', t)}
              placeholder="e.g. madra, bó"
              placeholderTextColor={themeColors.text.secondary}
            />

            <Text style={styles.label}>Sentence Audio</Text>

            {/* Audio List */}
            {(unit.metadata?.audio || []).map(
              (audio: any, audioIndex: number) => {
                const speaker = speakers.find(s => s.id === audio.speakerId);
                return (
                  <View
                    key={audioIndex}
                    style={[common.rowBetween, styles.audioRowExtra]}>
                    <Text style={styles.textPrimary}>
                      🎤 {speaker?.display_name || 'Unknown'}
                    </Text>
                    <View style={[common.row, styles.audioRowActionsExtra]}>
                      <TouchableOpacity
                        onPress={() => playUrl(audio.url, 1.0, 1.0)}
                        style={styles.playButton}>
                        <Play size={16} color={themeColors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          const currentAudio = [
                            ...(unit.metadata?.audio || []),
                          ];
                          currentAudio.splice(audioIndex, 1);
                          updateUnit(realIndex, {
                            ...unit,
                            metadata: {...unit.metadata, audio: currentAudio},
                          });
                        }}>
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              },
            )}

            <View>
              <MediaUploader
                mediaType="audio"
                onUploadComplete={(url: string) => {
                  if (selectedSpeakerId) {
                    const currentAudio = unit.metadata?.audio || [];
                    updateUnit(realIndex, {
                      ...unit,
                      metadata: {
                        ...unit.metadata,
                        audio: [
                          ...currentAudio,
                          {url, speakerId: selectedSpeakerId},
                        ],
                      },
                    });
                  }
                }}
              />
              <Text style={[styles.helperText, {marginTop: 4}]}>
                {selectedSpeakerId
                  ? '(Add for selected speaker)'
                  : '(Select a speaker first)'}
              </Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addCloze}>
          <Text style={styles.addButtonText}>+ Add Sentence</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /*
   * STANDARD EDITOR - Uses TranslationUnit (unit_type='sentence')
   */
  const renderStandardEditor = () => {
    const sentenceUnits = units
      .map((u, i) => ({unit: u, index: i}))
      .filter(
        (
          item,
        ): item is {
          unit: Extract<DraftExerciseUnit, {unitType: 'sentence'}>;
          index: number;
        } => item.unit.unitType === 'sentence',
      );

    const addSentence = () => {
      const newUnit = {
        unitType: 'sentence',
        content: {source: '', target: ''},
        metadata: {},
      };
      onChange({...content, units: [...units, newUnit as any]});
    };

    const updateSentence = (realIndex: number, field: string, value: any) => {
      const unit = units[realIndex];
      if (unit.unitType !== 'sentence') {
        return;
      }

      if (field === 'source' || field === 'target') {
        updateUnit(realIndex, {
          ...unit,
          content: {...unit.content, [field]: value},
        });
      } else if (field === 'metadata') {
        updateUnit(realIndex, {
          ...unit,
          metadata: {...(unit.metadata || {}), ...value},
        });
      }
    };

    const updateWordAudio = (
      realIndex: number,
      word: string,
      audioEntry: any,
    ) => {
      const unit = units[realIndex];
      const currentMeta = unit.metadata || {};
      const currentWordAudio = currentMeta.wordAudioUrls || {};
      const existingEntry = currentWordAudio[word];

      let newEntry;
      if (Array.isArray(existingEntry)) {
        newEntry = [...existingEntry, audioEntry];
      } else if (existingEntry) {
        newEntry = [existingEntry, audioEntry];
      } else {
        newEntry = [audioEntry];
      }

      updateUnit(realIndex, {
        ...unit,
        metadata: {
          ...currentMeta,
          wordAudioUrls: {...currentWordAudio, [word]: newEntry},
        },
      });
    };

    const removeWordAudio = (
      realIndex: number,
      word: string,
      audioIndex: number,
    ) => {
      const unit = units[realIndex];
      const currentMeta = unit.metadata || {};
      const currentWordAudio = currentMeta.wordAudioUrls || {};
      const existingEntry = currentWordAudio[word];

      // Convert to array if not already (legacy safety)
      let newEntry = Array.isArray(existingEntry)
        ? [...existingEntry]
        : existingEntry
          ? [existingEntry]
          : [];

      if (newEntry.length > audioIndex) {
        newEntry.splice(audioIndex, 1);
      }

      // Clean up empty arrays or keep empty? Keep empty array is safer for now.
      updateUnit(realIndex, {
        ...unit,
        metadata: {
          ...currentMeta,
          wordAudioUrls: {...currentWordAudio, [word]: newEntry},
        },
      });
    };

    // Helper to add audio to main sentence list (now in metadata.audio - legacy array structure or just audioUrl?)
    // The Schema supports `audioUrl` on metadata (single) OR `sentence_audio` table (many).
    // Let's assume we stick to `metadata.audioUrl` for single, or if we want multi-speaker we store references?
    // The previous code stored an array `audio: [{url, speakerId}]` in the JSON sent to draftService.
    // DraftService then inserts into `sentence_audio`.
    // Let's support that array in `metadata` for draft purposes.

    const addAudio = (realIndex: number, url: string, speakerId: string) => {
      const unit = units[realIndex];
      const currentMeta = unit.metadata || {};
      const currentAudio = currentMeta.audio || []; // Array of {url, speakerId}

      updateUnit(realIndex, {
        ...unit,
        metadata: {
          ...currentMeta,
          audio: [...currentAudio, {url, speakerId}],
        },
      });
    };

    const removeAudio = (realIndex: number, audioIndex: number) => {
      const unit = units[realIndex];
      const currentMeta = unit.metadata || {};
      const currentAudio = [...(currentMeta.audio || [])];
      currentAudio.splice(audioIndex, 1);
      updateUnit(realIndex, {
        ...unit,
        metadata: {...currentMeta, audio: currentAudio},
      });
    };

    return (
      <View>
        <Text style={styles.header}>Exercise Sentences</Text>

        {/* Speaker Selector */}
        <View style={styles.speakerContainer}>
          <Text style={styles.labelNoMarginTop}>Record as Speaker:</Text>
          <View style={[common.row, styles.rowWrapExtra]}>
            {speakers.map(s => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedSpeakerId(s.id)}
                style={[
                  styles.speakerChip,
                  selectedSpeakerId === s.id
                    ? styles.speakerChipSelected
                    : styles.speakerChipUnselected,
                ]}>
                <Text
                  style={
                    selectedSpeakerId === s.id
                      ? styles.speakerChipTextSelected
                      : styles.speakerChipTextUnselected
                  }>
                  {s.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {sentenceUnits.map(({unit, index: realIndex}, i) => (
          <View key={realIndex} style={styles.pairContainer}>
            <View style={[common.rowBetween, styles.pairHeaderExtra]}>
              <Text style={styles.pairTitle}>Pair {i + 1}</Text>
              <TouchableOpacity onPress={() => removeUnit(realIndex)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>English (Source)</Text>
            <TextInput
              style={styles.input}
              placeholder="English"
              value={unit.content.source}
              onChangeText={t => updateSentence(realIndex, 'source', t)}
              placeholderTextColor={themeColors.text.disabled}
            />

            <Text style={styles.label}>Irish (Target)</Text>
            <TextInput
              style={styles.input}
              placeholder="Irish"
              value={unit.content.target}
              onChangeText={t => updateSentence(realIndex, 'target', t)}
              placeholderTextColor={themeColors.text.disabled}
            />

            <Text style={styles.label}>Sentence Audio</Text>

            {/* Audio List */}
            {(unit.metadata?.audio || []).map((audio, audioIndex) => {
              const speaker = speakers.find(s => s.id === audio.speakerId);
              return (
                <View
                  key={audioIndex}
                  style={[common.rowBetween, styles.audioRowExtra]}>
                  <Text style={styles.textPrimary}>
                    🎤 {speaker?.display_name || 'Unknown'}
                  </Text>
                  <View style={[common.row, styles.audioRowActionsExtra]}>
                    <TouchableOpacity
                      onPress={() => playUrl(audio.url, 1.0, 1.0)}
                      style={styles.playButton}>
                      <Play size={16} color={themeColors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeAudio(realIndex, audioIndex)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <View>
              <MediaUploader
                mediaType="audio"
                onUploadComplete={(url: string) => {
                  if (selectedSpeakerId) {
                    addAudio(realIndex, url, selectedSpeakerId);
                  }
                }}
              />
              <Text style={[styles.helperText, {marginTop: 4}]}>
                {selectedSpeakerId
                  ? '(Add for selected speaker)'
                  : '(Select a speaker first)'}
              </Text>
            </View>

            <Text style={styles.label}>Word Audio</Text>
            <View style={styles.wordAudioContainer}>
              {/* Word Audio Logic similar to before but updating metadata.wordAudioUrls */}
              {unit.content.target
                .split(' ')
                .filter((w: string) => w.trim())
                .map((word: string, wIndex: number) => {
                  const cleanWord = word
                    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
                    .toLowerCase();
                  const wordMeta = unit.metadata?.wordAudioUrls?.[cleanWord];
                  const audioList = Array.isArray(wordMeta)
                    ? wordMeta
                    : wordMeta
                      ? [wordMeta]
                      : [];

                  return (
                    <View
                      key={wIndex}
                      style={[common.rowBetween, styles.wordRowExtra]}>
                      <Text style={styles.wordLabel}>{word}</Text>

                      {/* List Existing Word Audio */}
                      {audioList.map((audio: any, aIndex: number) => {
                        const sp = speakers.find(s => s.id === audio.speakerId);
                        return (
                          <View
                            key={aIndex}
                            style={[
                              common.rowBetween,
                              styles.wordAudioItemExtra,
                            ]}>
                            <Text style={styles.wordAudioItemText}>
                              {sp?.display_name || 'Unknown'}
                            </Text>
                            <View
                              style={[
                                common.row,
                                styles.wordAudioItemActionsExtra,
                              ]}>
                              <TouchableOpacity
                                onPress={() => playUrl(audio.url, 1.0, 1.0)}>
                                <Play size={14} color={themeColors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() =>
                                  removeWordAudio(realIndex, cleanWord, aIndex)
                                }>
                                <Text style={styles.removeTextSmall}>X</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}

                      <MediaUploader
                        mediaType="audio"
                        compact={true}
                        onUploadComplete={url => {
                          if (selectedSpeakerId) {
                            updateWordAudio(realIndex, cleanWord, {
                              url,
                              speakerId: selectedSpeakerId,
                            });
                          }
                        }}
                      />
                    </View>
                  );
                })}
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addSentence}>
          <Text style={styles.addButtonText}>+ Add Sentence</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Exercise Settings</Text>

      <Text style={styles.label}>Exercise Title</Text>
      <TextInput
        style={styles.input}
        value={content.title || ''}
        onChangeText={t => onChange({...content, title: t})}
        placeholder="e.g. Basic Greetings..."
      />

      <Text style={styles.label}>Exercise Type</Text>
      <View style={[common.row, styles.typeRowExtra]}>
        {(['standard', 'matching_pairs', 'cloze'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.typeChip,
              content.type === t || (!content.type && t === 'standard')
                ? styles.typeChipSelected
                : styles.typeChipUnselected,
            ]}
            onPress={() => onChange({...content, type: t})}>
            <Text
              style={
                content.type === t || (!content.type && t === 'standard')
                  ? styles.typeChipTextSelected
                  : styles.typeChipTextUnselected
              }>
              {t.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[common.row, styles.requiredRowExtra]}>
        <Text style={styles.labelNoMarginTop}>Required:</Text>
        <TouchableOpacity
          style={
            content.isRequired !== false
              ? styles.requiredChipActive
              : styles.requiredChipInactive
          }
          onPress={() =>
            onChange({
              ...content,
              isRequired: content.isRequired === false ? true : false,
            })
          }>
          <Text
            style={
              content.isRequired !== false
                ? styles.requiredTextActive
                : styles.requiredTextInactive
            }>
            {content.isRequired !== false ? '✓ Required' : 'Optional'}
          </Text>
        </TouchableOpacity>
      </View>

      {content.type === 'matching_pairs'
        ? renderMatchingPairsEditor()
        : content.type === 'cloze'
          ? renderClozeEditor()
          : renderStandardEditor()}
    </View>
  );
};
