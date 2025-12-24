import React, {useRef, memo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useTheme, Card} from '@/components/shared';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {LetterSlotStatus} from '@/types';
import {Eye} from 'lucide-react-native';
import {playUrl} from '@/services/audio';
import {WordDisplay} from './WordDisplay';

interface SentenceUnderscoreDisplayProps {
  allWords: string[];
  revealedWords: string[];
  currentWordIndex: number;
  targetWord: string;
  typedLetters: (string | null)[];
  slotStates: LetterSlotStatus[];
  isCurrentWordLetter: boolean[];
  wordAudioUrls?: Record<string, any> | null;
  onRevealLetter?: () => void;
  animationsEnabled?: boolean;
  onRegisterWordRef?: (index: number, ref: View | null) => void;
}

// Helper to check if word is punctuation
const isPunctuation = (word: string) => {
  return /^[.,!?;:]+$/.test(word);
};

export const SentenceUnderscoreDisplay: React.FC<SentenceUnderscoreDisplayProps> =
  memo(
    ({
      allWords,
      revealedWords,
      currentWordIndex,
      targetWord,
      typedLetters,
      slotStates,
      isCurrentWordLetter,
      wordAudioUrls,
      onRevealLetter,
      animationsEnabled = true,
      onRegisterWordRef,
    }) => {
      const {colors, fontFamily} = useTheme();
      const containerRef = useRef<View>(null);

      const styles = useThemedStyles(themeColors => ({
        container: {
          padding: spacing.md,
        },
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        },
        wordCounter: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
          marginHorizontal: spacing.sm,
          color: themeColors.text.secondary,
        },
        sentenceContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 80,
          gap: 1,
        },
        revealedWord: {
          fontSize: typography.sizes['2xl'],
          fontWeight: typography.weights.normal,
          color: themeColors.text.primary,
        },
        unrevealedWord: {
          fontSize: typography.sizes['2xl'],
          fontWeight: typography.weights.normal,
          letterSpacing: spacing.xs,
          color: themeColors.text.tertiary,
        },
        punctuation: {
          fontSize: typography.sizes['2xl'],
          fontWeight: typography.weights.normal,
          marginHorizontal: -2,
          color: themeColors.text.primary,
        },
        wordContainer: {
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: spacing.xs,
        },
        underline: {
          height: 2,
          width: '100%',
          marginTop: 2,
          borderRadius: 1,
          backgroundColor: themeColors.border,
        },
        underlineRevealed: {
          backgroundColor: themeColors.tiontuGreen,
        },
        revealButton: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 6,
          paddingHorizontal: 12,
          borderRadius: borderRadius.full,
          gap: 4,
          shadowColor: themeColors.black,
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          backgroundColor: themeColors.surfaceElevated,
        },
        revealText: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
          color: themeColors.text.primary,
        },
      }));

      return (
        <Card style={styles.container}>
          {/* Top Row: Word Counter and Help */}
          <View style={styles.headerRow}>
            <Text style={styles.wordCounter}>
              Word {currentWordIndex + 1} / {allWords.length}
            </Text>

            {/* Reveal Button - Placed in header */}
            <TouchableOpacity
              onPress={onRevealLetter}
              style={styles.revealButton}
              activeOpacity={0.7}>
              <Eye size={20} color={colors.text.primary} />
              <Text style={styles.revealText}>Reveal</Text>
            </TouchableOpacity>
          </View>

          <View ref={containerRef} style={styles.sentenceContainer}>
            {allWords.map((word, wordIndex) => {
              const isCurrentWord = wordIndex === currentWordIndex;
              const isRevealed = revealedWords[wordIndex] === word;

              if (isCurrentWord) {
                // Get audio for current word
                const cleanWord = targetWord
                  .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
                  .toLowerCase();
                const hasAudio = wordAudioUrls && wordAudioUrls[cleanWord];

                return (
                  <WordDisplay
                    key={wordIndex}
                    word={targetWord}
                    typedLetters={typedLetters}
                    slotStates={slotStates}
                    isCurrentWordLetter={isCurrentWordLetter}
                    fontFamily={fontFamily}
                    animationsEnabled={animationsEnabled}
                    onPress={() => {
                      if (hasAudio) {
                        const audioEntry = wordAudioUrls[cleanWord];
                        const url = Array.isArray(audioEntry)
                          ? audioEntry[0]?.url
                          : audioEntry;
                        if (typeof url === 'string') {
                          playUrl(url);
                        }
                      }
                    }}
                    onRef={ref => onRegisterWordRef?.(wordIndex, ref)}
                  />
                );
              }

              if (isPunctuation(word)) {
                return (
                  <Text
                    key={wordIndex}
                    style={[styles.punctuation, {fontFamily}]}>
                    {word}
                  </Text>
                );
              }

              if (isRevealed) {
                // Clean word for audio lookup (remove punctuation)
                const cleanWord = word
                  .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
                  .toLowerCase();
                const hasAudio = wordAudioUrls && wordAudioUrls[cleanWord];

                return (
                  <TouchableOpacity
                    key={wordIndex}
                    onPress={() => {
                      // Only play audio on click, no navigation
                      if (hasAudio) {
                        const audioEntry = wordAudioUrls[cleanWord];
                        const url = Array.isArray(audioEntry)
                          ? audioEntry[0]?.url
                          : audioEntry;
                        if (typeof url === 'string') {
                          playUrl(url);
                        }
                      }
                    }}
                    activeOpacity={0.7}
                    ref={ref => onRegisterWordRef?.(wordIndex, ref)}>
                    <View style={styles.wordContainer}>
                      <Text style={[styles.revealedWord, {fontFamily}]}>
                        {word}
                      </Text>
                      <View
                        style={[styles.underline, styles.underlineRevealed]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              }

              // Generic fallback for unrevealed
              const cleanWord = word
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
                .toLowerCase();
              const hasAudio = wordAudioUrls && wordAudioUrls[cleanWord];

              return (
                <TouchableOpacity
                  key={wordIndex}
                  onPress={() => {
                    // Only play audio on click, no navigation
                    if (hasAudio) {
                      const audioEntry = wordAudioUrls[cleanWord];
                      const url = Array.isArray(audioEntry)
                        ? audioEntry[0]?.url
                        : audioEntry;
                      if (typeof url === 'string') {
                        playUrl(url);
                      }
                    }
                  }}
                  activeOpacity={0.7}
                  ref={ref => onRegisterWordRef?.(wordIndex, ref)}>
                  <View style={styles.wordContainer}>
                    <Text style={styles.unrevealedWord}>
                      {word
                        .split('')
                        .map(() => '_')
                        .join('')}
                    </Text>
                    <View style={styles.underline} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      );
    },
  );

SentenceUnderscoreDisplay.displayName = 'SentenceUnderscoreDisplay';
