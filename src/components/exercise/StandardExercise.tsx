import React, {useEffect, useCallback, useRef} from 'react';
import {View, Text, ScrollView, Platform} from 'react-native';
import {Card, AudioControlGroup} from '@/components/shared';
import {useTheme} from '@/components/shared';
import {SentenceUnderscoreDisplay} from '@/components/lesson/SentenceUnderscoreDisplay';
import {PointerIcon} from 'lucide-react-native';
import {preloadAudio} from '@/services/audio';
import {spacing, typography, useResponsive} from '@/theme';
import {createCommonStyles} from '@/theme/commonStyles';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {TranslationUnit} from '@/types/content';
import {useStandardExerciseLogic} from '@/hooks/useStandardExerciseLogic';
import {IrishKeyboard} from '@/components/lesson/IrishKeyboard';
import {useSettingsStore} from '@/stores/settingsStore';
import {useExerciseStore} from '@/stores/exerciseStore';

interface StandardExerciseProps {
  unit: TranslationUnit;
  onSentenceComplete: () => void;
  onXP: (
    amount: number,
    wordIndex?: number,
    stats?: {hasMistakes: boolean; helpUsed: boolean},
  ) => void;
  onMistake?: () => void;
  isActive: boolean;
  selectedSpeakerId?: string | null;
}

const createStyles = (themeColors: any) => ({
  scrollContent: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  promptCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  promptHeaderExtra: {
    marginBottom: spacing.xs,
  },
  promptLabel: {
    fontSize: typography.sizes.sm,
    color: themeColors.text.secondary,
  },
  // audioButton styles removed (replaced by AudioControlGroup)
  promptText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
    color: themeColors.text.primary,
  },
  wordAudioHintExtra: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: themeColors.text.tertiary,
  },
});

export const StandardExercise: React.FC<StandardExerciseProps> = ({
  unit,
  onSentenceComplete,
  onXP,
  onMistake,
  isActive,
  selectedSpeakerId,
}) => {
  const styles = useThemedStyles(createStyles);
  const {colors} = useTheme();
  const common = createCommonStyles(colors);
  const {animationsEnabled} = useSettingsStore();
  const {setLastClickPosition} = useExerciseStore();
  const {isTablet, isDesktop} = useResponsive();

  const wordRefs = useRef<Map<number, View>>(new Map());

  const handleRegisterWordRef = useCallback(
    (index: number, ref: View | null) => {
      if (ref) {
        wordRefs.current.set(index, ref);
      } else {
        wordRefs.current.delete(index);
      }
    },
    [],
  );

  const handleXP = useCallback(
    (
      amount: number,
      wordIndex?: number,
      stats?: {hasMistakes: boolean; helpUsed: boolean},
    ) => {
      if (typeof wordIndex === 'number') {
        const ref = wordRefs.current.get(wordIndex);
        if (ref) {
          ref.measureInWindow((x, y, w, h) => {
            setLastClickPosition({x: x + w / 2, y: y + h / 2});
            onXP(amount, wordIndex, stats);
          });
          return;
        }
      }
      // Fallback if no ref or no index
      onXP(amount, wordIndex, stats);
    },
    [onXP, setLastClickPosition],
  );

  // Source text for display
  const sourceText = unit.content.source;

  // Get audio URL based on selected speaker
  const audioArray = unit.metadata?.audio;
  let audioUrl: string | undefined;
  if (audioArray && Array.isArray(audioArray) && audioArray.length > 0) {
    // Filter by selected speaker if provided, otherwise use first
    const match = selectedSpeakerId
      ? audioArray.find((a: any) => a.speakerId === selectedSpeakerId)
      : audioArray[0];
    if (match) {
      audioUrl = match.url;
    }
  }
  // Process word audio map to select correct URL for speaker
  const wordAudioMap = React.useMemo(() => {
    const rawMap = unit.metadata?.wordAudioUrls;
    if (!rawMap) {
      return null;
    }

    const processedMap: Record<string, string> = {};
    Object.keys(rawMap).forEach(word => {
      const audioEntry = rawMap[word];
      if (Array.isArray(audioEntry)) {
        // Find specific speaker or default to first
        const match = selectedSpeakerId
          ? audioEntry.find((a: any) => a.speakerId === selectedSpeakerId)
          : audioEntry[0];
        if (match?.url) {
          processedMap[word] = match.url;
        }
      } else if (typeof audioEntry === 'string') {
        processedMap[word] = audioEntry;
      } else if (audioEntry?.url) {
        // Handle legacy object format if strictly {url: string}
        processedMap[word] = audioEntry.url;
      }
    });
    return processedMap;
  }, [unit.metadata?.wordAudioUrls, selectedSpeakerId]);

  const {
    allWords,
    revealedWords,
    currentWordIndex,
    typedLetters,
    slotStates,
    isCurrentWordLetter,
    typeLetter,
    backspace,
    revealLetter,
    initializeSentence,
    getCurrentWord,
  } = useStandardExerciseLogic({
    onSentenceComplete,
    onXP: handleXP,
    onMistake,
  });

  useEffect(() => {
    if (unit && isActive) {
      // useStandardExerciseLogic expects a Sentence-like object with sourceText/targetText
      initializeSentence({
        sourceText: unit.content.source,
        targetText: unit.content.target,
        ...unit,
      } as any);
    }
  }, [unit, unit.id, isActive, initializeSentence]);

  // Preload audio when unit or speaker changes
  useEffect(() => {
    if (unit && isActive) {
      // Preload sentence audio
      if (audioUrl) {
        preloadAudio(audioUrl).catch(() => {
          // Ignore preload errors - audio will still work on-demand
        });
      }

      // Preload word audio
      if (wordAudioMap) {
        Object.values(wordAudioMap).forEach(url => {
          if (typeof url === 'string') {
            preloadAudio(url).catch(() => {
              // Ignore preload errors - audio will still work on-demand
            });
          }
        });
      }
    }
  }, [unit, selectedSpeakerId, isActive, audioUrl, wordAudioMap]);

  // Keep refs to latest action functions to avoid re-binding keyboard listener
  const latestActions = useRef({typeLetter, backspace});
  useEffect(() => {
    latestActions.current = {typeLetter, backspace};
  }, [typeLetter, backspace]);

  // Keyboard input handler for Web/Desktop
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const fadaPending = {current: false};

    const handleKeyDown = (e: any) => {
      // Ignore if modifier keys (Cmd/Ctrl) are pressed (allow shortcuts)
      if (e.metaKey || e.ctrlKey) {
        return;
      }

      if (e.key === 'Backspace') {
        latestActions.current.backspace();
        fadaPending.current = false;
        e.preventDefault();
        return;
      }

      // Handle Fada shortcut (Option+e or Dead key)
      // Standard Mac US/Irish layout: Option+E produces a dead key state
      if (e.key === 'Dead' || (e.altKey && e.key.toLowerCase() === 'e')) {
        fadaPending.current = true;
        e.preventDefault();
        return;
      }

      // If key is a valid single character
      if (e.key.length === 1) {
        let char = e.key;

        // Apply fada if pending
        if (fadaPending.current) {
          const fadaMap: Record<string, string> = {
            a: 'á',
            e: 'é',
            i: 'í',
            o: 'ó',
            u: 'ú',
            A: 'Á',
            E: 'É',
            I: 'Í',
            O: 'Ó',
            U: 'Ú',
          };
          if (fadaMap[char]) {
            char = fadaMap[char];
          }
          fadaPending.current = false;
        }

        // Only process if it's not a special key press (like F-keys which have length > 1, caught above)
        // We pass to typeLetter which handles validity against current word
        latestActions.current.typeLetter(char);

        // Prevent default for Space to avoid scrolling,
        // but allow other keys if they might be useful (though we likely consumed it)
        if (char === ' ') {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <View style={common.flex1}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Responsive Container */}
        <View style={isTablet || isDesktop ? common.row : common.column}>
          {/* Prompt Section */}
          <View
            style={
              isTablet || isDesktop
                ? {flex: 1, marginRight: spacing.md}
                : {width: '100%'}
            }>
            <Card style={styles.promptCard}>
              <View style={[common.rowBetween, styles.promptHeaderExtra]}>
                <Text style={styles.promptLabel}>Translate to Irish:</Text>
                {audioUrl && (
                  <AudioControlGroup
                    audioUrl={audioUrl}
                    showSlowButton={true}
                    disabled={!isActive}
                  />
                )}
              </View>
              <Text style={styles.promptText}>{sourceText}</Text>

              {/* Word Audio Hint */}
              <View style={[common.row, styles.wordAudioHintExtra]}>
                <PointerIcon size={14} color={colors.text.tertiary} />
                <Text style={styles.hintText}>
                  Tap words below to hear pronunciation
                </Text>
              </View>
            </Card>
          </View>

          {/* Sentence Display Section */}
          <View style={isTablet || isDesktop ? {flex: 1} : {width: '100%'}}>
            <SentenceUnderscoreDisplay
              allWords={allWords}
              revealedWords={revealedWords}
              currentWordIndex={currentWordIndex}
              targetWord={getCurrentWord()}
              typedLetters={typedLetters}
              slotStates={slotStates}
              isCurrentWordLetter={isCurrentWordLetter}
              wordAudioUrls={wordAudioMap}
              onRegisterWordRef={handleRegisterWordRef}
              onRevealLetter={revealLetter}
              animationsEnabled={animationsEnabled}
            />
          </View>
        </View>
      </ScrollView>

      {/* Keyboard fixed at bottom */}
      <IrishKeyboard onLetterPress={typeLetter} onBackspace={backspace} />
    </View>
  );
};
