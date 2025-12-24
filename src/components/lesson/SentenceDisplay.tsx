import React from 'react';
import {View, Text, TouchableOpacity, ViewStyle, TextStyle} from 'react-native';
import {useTheme, Card} from '@/components/shared';
import {spacing, typography, borderRadius} from '@/theme';
import {LetterSlotStatus} from '@/types';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface SentenceDisplayProps {
  allWords: string[];
  revealedWords: string[];
  currentWordIndex: number;
  targetWord: string;
  typedLetters: (string | null)[];
  slotStates: LetterSlotStatus[];
  isCurrentWordLetter: boolean[];
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
}

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  allWords,
  revealedWords,
  currentWordIndex,
  targetWord: _targetWord,
  typedLetters,
  slotStates,
  isCurrentWordLetter,
  onNavigatePrevious,
  onNavigateNext,
  canNavigatePrevious = false,
  canNavigateNext = false,
}) => {
  const {colors} = useTheme();
  const common = createCommonStyles(colors);

  const styles = useThemedStyles(themeColors => {
    return {
      ...common,
      containerExtra: {
        padding: spacing.md,
      } as ViewStyle,
      navigationExtra: {
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
      } as ViewStyle,
      navButtonExtra: {
        padding: spacing.sm,
      } as ViewStyle,
      navArrowExtra: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: themeColors.tiontuRed,
      } as TextStyle,
      wordCounterExtra: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
        color: themeColors.text.tertiary,
      } as TextStyle,
      sentenceContainerExtra: {
        flexWrap: 'wrap',
        minHeight: 60,
      } as ViewStyle,
      revealedWordExtra: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
      } as TextStyle,
      punctuationExtra: {
        marginLeft: -spacing.xs,
      } as TextStyle,
      currentWordContainerExtra: {
        marginRight: spacing.sm,
      } as ViewStyle,
      futureWordExtra: {
        marginRight: spacing.sm,
      } as ViewStyle,
      letterSlotExtra: {
        width: 32,
        height: 44,
        borderWidth: 2,
        borderRadius: borderRadius.sm,
        marginHorizontal: 2,
      } as ViewStyle,
      letterExtra: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.semibold,
      } as TextStyle,
      inlinePunctuationExtra: {
        fontSize: typography.sizes.xl,
        marginHorizontal: 2,
        color: themeColors.text.primary,
      } as TextStyle,
    };
  });

  const getSlotColor = (status: LetterSlotStatus) => {
    switch (status) {
      case 'correct':
        return colors.success;
      case 'incorrect':
        return colors.error;
      case 'fadaMissing':
        return colors.warning;
      case 'focused':
        return colors.tiontuGold;
      case 'disabled':
        return colors.text.tertiary;
      default:
        return colors.border;
    }
  };

  const isPunctuation = (word: string): boolean => {
    const punctuationChars = [
      '.',
      ',',
      '!',
      '?',
      ';',
      ':',
      '-',
      '—',
      '"',
      "'",
      '„',
      '‟',
      '(',
      ')',
      '[',
      ']',
      '{',
      '}',
    ];
    return word.length === 1 && punctuationChars.includes(word);
  };

  return (
    <Card style={styles.containerExtra}>
      {/* Word navigation */}
      <View style={[common.rowBetween, styles.navigationExtra]}>
        <TouchableOpacity
          onPress={onNavigatePrevious}
          disabled={!canNavigatePrevious}
          style={[
            styles.navButtonExtra,
            {opacity: canNavigatePrevious ? 1 : 0.3},
          ]}>
          <Text style={styles.navArrowExtra}>←</Text>
        </TouchableOpacity>

        <Text style={styles.wordCounterExtra}>
          Word {currentWordIndex + 1}/{allWords.length}
        </Text>

        <TouchableOpacity
          onPress={onNavigateNext}
          disabled={!canNavigateNext}
          style={[styles.navButtonExtra, {opacity: canNavigateNext ? 1 : 0.3}]}>
          <Text style={styles.navArrowExtra}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Sentence display */}
      <View style={[common.row, styles.sentenceContainerExtra]}>
        {allWords.map((word, wordIndex) => {
          // Show revealed words
          if (wordIndex < currentWordIndex || revealedWords[wordIndex]) {
            return (
              <Text
                key={wordIndex}
                style={[
                  styles.revealedWordExtra,
                  isPunctuation(word) && styles.punctuationExtra,
                ]}>
                {word}
                {!isPunctuation(word) && wordIndex < allWords.length - 1 && ' '}
              </Text>
            );
          }

          // Show current word with letter slots
          if (wordIndex === currentWordIndex) {
            return (
              <View
                key={wordIndex}
                style={[common.row, styles.currentWordContainerExtra]}>
                {word.split('').map((char, charIndex) => {
                  const status = slotStates[charIndex] || 'empty';
                  const typedChar = typedLetters[charIndex];
                  const isLetter = isCurrentWordLetter[charIndex];

                  if (!isLetter) {
                    // Punctuation within word
                    return (
                      <Text
                        key={charIndex}
                        style={styles.inlinePunctuationExtra}>
                        {char}
                      </Text>
                    );
                  }

                  return (
                    <View
                      key={charIndex}
                      style={[
                        common.centered,
                        styles.letterSlotExtra,
                        {
                          borderColor: getSlotColor(status),
                          backgroundColor:
                            status === 'focused'
                              ? getSlotColor(status) + '20'
                              : 'transparent',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.letterExtra,
                          {
                            color:
                              status === 'correct' || status === 'fadaMissing'
                                ? getSlotColor(status)
                                : status === 'incorrect'
                                  ? colors.error
                                  : colors.text.tertiary,
                          },
                        ]}>
                        {typedChar || (status === 'focused' ? '|' : '_')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          }

          // Future words (not revealed yet)
          return (
            <View key={wordIndex} style={[common.row, styles.futureWordExtra]}>
              {word.split('').map((char, charIndex) => (
                <View
                  key={charIndex}
                  style={[
                    common.centered,
                    styles.letterSlotExtra,
                    {borderColor: colors.border},
                  ]}>
                  <Text
                    style={[styles.letterExtra, {color: colors.text.tertiary}]}>
                    _
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </Card>
  );
};
