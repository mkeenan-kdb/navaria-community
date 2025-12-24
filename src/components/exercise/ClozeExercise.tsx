import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import {Card, useTheme, AudioControlGroup} from '@/components/shared';
import {GAMEPLAY} from '@/constants';
import {ClozeUnit} from '@/types/content';
import {spacing, typography, borderRadius, opacity, withOpacity} from '@/theme';
import {createCommonStyles} from '@/theme/commonStyles';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {useShakeAnimation} from '@/hooks/useShakeAnimation';
import {useFlashingBorder} from '@/hooks/useFlashingBorder';
import {useExerciseFeedback} from '@/hooks/useExerciseFeedback';
import {useExerciseFont} from '@/hooks/useExerciseFont';
import {useExerciseStore} from '@/stores/exerciseStore';
import {preloadAudio} from '@/services/audio';
import {BlankSlot} from './BlankSlot';

interface Props {
  unit: ClozeUnit;
  onComplete: (unitId: string) => void;
  onXP: (amount: number) => void;
  selectedSpeakerId?: string | null;
}

interface Blank {
  id: number;
  answer: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
}

const createStyles = (themeColors: any) => ({
  containerExtra: {
    padding: spacing.sm,
  },
  cardExtra: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
    minHeight: 200,
  },
  sentenceContainerExtra: {
    gap: 1,
  },
  textPart: {
    fontSize: typography.sizes.xl,
    color: themeColors.text.primary,
    fontWeight: typography.weights.medium,
    lineHeight: 40,
  },
  optionsContainerExtra: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  optionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    minWidth: '40%' as any,
    alignItems: 'center' as const,
    shadowColor: themeColors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonUsed: {
    backgroundColor: themeColors.background,
    borderColor: themeColors.border,
    opacity: opacity.disabled,
  },
  optionText: {
    fontSize: typography.sizes.lg,
    color: themeColors.text.primary,
    fontWeight: typography.weights.medium,
  },
  sourceText: {
    fontSize: typography.sizes.base,
    color: themeColors.text.secondary,
    marginTop: spacing.lg,
    fontStyle: 'italic' as const,
  },
  audioButtonRowExtra: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionError: {
    borderColor: themeColors.error,
    backgroundColor: withOpacity(themeColors.error, opacity.tint20),
  },
});

export const ClozeExercise: React.FC<Props> = ({
  unit,
  onComplete,
  onXP,
  selectedSpeakerId,
}) => {
  const styles = useThemedStyles(createStyles);
  const {colors} = useTheme();
  const common = createCommonStyles(colors);

  // Get audio URL based on selected speaker
  const audioArray = unit.metadata?.audio;
  let effectiveAudioUrl: string | undefined;
  if (audioArray && Array.isArray(audioArray) && audioArray.length > 0) {
    const match = selectedSpeakerId
      ? audioArray.find((a: any) => a.speakerId === selectedSpeakerId)
      : audioArray[0];
    if (match) {
      effectiveAudioUrl = match.url;
    }
  }

  const [segments, setSegments] = useState<(string | Blank)[]>([]);
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [activeBlankIndex, setActiveBlankIndex] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);
  const [errorOptionIndex, setErrorOptionIndex] = useState<number | null>(null);

  // Refs to track blank slot elements for XP animation positioning
  const blankRefs = useRef<Map<number, View>>(new Map());

  // Use reusable hooks
  const {shakeAnim, shake} = useShakeAnimation();
  const borderOpacity = useFlashingBorder();
  const {triggerCorrect, triggerIncorrect} = useExerciseFeedback();
  const {currentFont} = useExerciseFont();
  const {setLastClickPosition} = useExerciseStore();

  // Preload audio when unit or speaker changes
  useEffect(() => {
    if (unit && effectiveAudioUrl) {
      preloadAudio(effectiveAudioUrl).catch(() => {
        // Ignore preload errors - audio will still work on-demand
      });
    }
  }, [unit, selectedSpeakerId, effectiveAudioUrl]);

  // Initialize Round
  useEffect(() => {
    if (!unit) {
      return;
    }

    // Parse Bracket Syntax from target text: "The [cat] sat"
    const rawText = unit.content.target;
    const parts = rawText.split(/(\[.*?\])/);

    const newSegments: (string | Blank)[] = [];
    const newBlanks: Blank[] = [];
    const correctAnswers: string[] = [];

    parts.forEach(part => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const answer = part.slice(1, -1).trim();
        const blank: Blank = {
          id: newBlanks.length,
          answer: answer,
          userAnswer: null,
          isCorrect: null,
        };
        newBlanks.push(blank);
        newSegments.push(blank);
        correctAnswers.push(answer);
      } else if (part.trim().length > 0) {
        newSegments.push(part);
      }
    });

    // 2. Prepare Options (Correct + Distractors)
    const distractors = unit.metadata?.distractors || [];
    const safeDistractors = Array.isArray(distractors) ? distractors : [];

    const pool = [...correctAnswers, ...safeDistractors];
    const shuffled = pool.sort(() => Math.random() - 0.5);

    setSegments(newSegments);
    setBlanks(newBlanks);
    setOptions(shuffled);
    setActiveBlankIndex(0);
    setIsChecking(false);
  }, [unit]);

  // Flashing border animation for active blank
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(borderOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [borderOpacity]);

  const handleOptionPress = (
    word: string,
    optionIndex: number,
    _event?: GestureResponderEvent,
  ) => {
    if (isChecking || errorOptionIndex !== null) {
      return;
    }

    // Find active blank
    if (activeBlankIndex >= blanks.length) {
      return;
    }

    const blank = blanks[activeBlankIndex];

    // Check if this is a distractor (wrong answer)
    const isDistractor = word !== blank.answer;

    if (isDistractor) {
      // Immediate error feedback for distractor
      setErrorOptionIndex(optionIndex);
      triggerIncorrect();
      shake();
      setTimeout(() => setErrorOptionIndex(null), 250);
      return;
    }

    // Measure the blank slot element position for XP animation
    const blankRef = blankRefs.current.get(activeBlankIndex);
    if (blankRef) {
      blankRef.measureInWindow((x: number, y: number, w: number, h: number) => {
        setLastClickPosition({x: x + w / 2, y: y + h / 2});
      });
    }
    // Correct answer - award XP and play sound
    triggerCorrect(GAMEPLAY.XP.CLOZE_BLANK);
    onXP(GAMEPLAY.XP.CLOZE_BLANK);

    // Fill the blank
    const updatedBlanks = [...blanks];
    updatedBlanks[activeBlankIndex].userAnswer = word;
    updatedBlanks[activeBlankIndex].isCorrect = true;
    setBlanks(updatedBlanks);

    // Advance to next empty blank if exists
    const nextTimeIndex = updatedBlanks.findIndex(b => b.userAnswer === null);
    if (nextTimeIndex !== -1) {
      setActiveBlankIndex(nextTimeIndex);
    } else {
      // All filled, proceed to next sentence
      if (unit) {
        setTimeout(() => {
          onComplete(unit.id);
        }, 300);
      }
    }
  };

  const handleBlankPress = (index: number) => {
    if (isChecking) {
      return;
    }

    // If blank has value, clear it and return to options
    const updatedBlanks = [...blanks];
    if (updatedBlanks[index].userAnswer) {
      updatedBlanks[index].userAnswer = null;
      updatedBlanks[index].isCorrect = null;
      setBlanks(updatedBlanks);
    }
    setActiveBlankIndex(index);
  };

  const handleRegisterRef = (index: number, ref: View | null) => {
    if (ref) {
      blankRefs.current.set(index, ref);
    } else {
      blankRefs.current.delete(index);
    }
  };

  if (!unit) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={[common.flex1, styles.containerExtra]}>
      <Card style={[common.centered, styles.cardExtra]}>
        <View
          style={[
            common.row,
            {justifyContent: 'center', flexWrap: 'wrap'},
            styles.sentenceContainerExtra,
          ]}>
          {segments.map((segment, idx) => {
            if (typeof segment === 'string') {
              return (
                <Text
                  key={`text-${idx}`}
                  style={[
                    styles.textPart,
                    currentFont !== 'System' && {fontFamily: currentFont},
                  ]}>
                  {segment}
                </Text>
              );
            } else {
              // Blank
              const blankIndex = segment.id;
              const blank = blanks[blankIndex];
              const isActive =
                activeBlankIndex === blankIndex && !blank.userAnswer;

              return (
                <BlankSlot
                  key={`blank-${blankIndex}`}
                  blank={blank}
                  isActive={isActive}
                  borderOpacity={borderOpacity}
                  onPress={handleBlankPress}
                  isChecking={isChecking}
                  currentFont={currentFont}
                  onRegisterRef={handleRegisterRef}
                />
              );
            }
          })}
        </View>

        {unit.content.source && (
          <Text style={styles.sourceText}>{unit.content.source}</Text>
        )}

        {effectiveAudioUrl && (
          <View
            style={[
              common.row,
              {justifyContent: 'center'},
              styles.audioButtonRowExtra,
            ]}>
            <AudioControlGroup
              audioUrl={effectiveAudioUrl}
              showSlowButton={true}
              disabled={false}
            />
          </View>
        )}
      </Card>

      <View
        style={[
          common.row,
          {justifyContent: 'center', flexWrap: 'wrap'},
          styles.optionsContainerExtra,
        ]}>
        {options.map((option, idx) => {
          const usedOccurrences = blanks.filter(
            b => b.userAnswer === option,
          ).length;

          const priorOccurrences = options
            .slice(0, idx)
            .filter(o => o === option).length;

          const isUsed = priorOccurrences < usedOccurrences;
          const isError = errorOptionIndex === idx;

          return (
            <Animated.View
              key={idx}
              style={{transform: [{translateX: shakeAnim}]}}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  isUsed && styles.optionButtonUsed,
                  isError && styles.optionError,
                ]}
                onPress={e => !isUsed && handleOptionPress(option, idx, e)}
                disabled={isUsed || isChecking || errorOptionIndex !== null}>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
};
