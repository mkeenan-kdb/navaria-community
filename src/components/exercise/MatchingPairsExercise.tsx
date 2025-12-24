import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  ScrollView,
  Animated,
  GestureResponderEvent,
} from 'react-native';

import {MatchingGroupUnit} from '@/types/content';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {useTheme} from '@/components/shared';
import {useShakeAnimation} from '@/hooks/useShakeAnimation';
import {useExerciseFeedback} from '@/hooks/useExerciseFeedback';
import {useExerciseStore} from '@/stores/exerciseStore';
import {GAMEPLAY} from '@/constants';
import {CheckCircle2} from 'lucide-react-native';

interface Props {
  unit: MatchingGroupUnit;
  onComplete: () => void;
  onXP: (amount: number) => void;
}

interface MatchingCard {
  id: string;
  text: string;
  pairId: string;
  type: 'source' | 'target';
  isMatched: boolean;
}

const createStyles = (themeColors: any) => ({
  containerExtra: {
    padding: spacing.xs,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: spacing.md,
    color: themeColors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  columnsContainerExtra: {
    gap: spacing.md,
  },
  columnExtra: {
    gap: spacing.sm,
  },
  cardExtra: {
    padding: spacing.sm,
    minHeight: 60,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: borderRadius.md,
    shadowColor: themeColors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSelected: {
    borderColor: themeColors.primary,
    backgroundColor: themeColors.primary + '15',
    borderWidth: 2,
  },
  cardMatched: {
    opacity: 0,
  },
  cardError: {
    borderColor: themeColors.error,
    backgroundColor: themeColors.error + '15',
  },
  text: {
    fontSize: typography.sizes.sm,
    color: themeColors.text.primary,
    textAlign: 'center' as const,
    fontWeight: typography.weights.medium,
  },
  groupCompleteContainerExtra: {
    padding: spacing.xl,
    gap: spacing.lg,
    minHeight: 300,
  },
  groupCompleteText: {
    fontSize: typography.sizes.xl,
    color: themeColors.success,
    fontWeight: typography.weights.bold,
    textAlign: 'center' as const,
  },
});

export const MatchingPairsExercise: React.FC<Props> = ({
  unit,
  onComplete,
  onXP,
}) => {
  const styles = useThemedStyles(createStyles);
  const {colors} = useTheme();
  const common = createCommonStyles(colors);
  const {shakeAnim, shake} = useShakeAnimation();
  const {triggerCorrect, triggerIncorrect} = useExerciseFeedback();

  const [leftCards, setLeftCards] = useState<MatchingCard[]>([]);
  const [rightCards, setRightCards] = useState<MatchingCard[]>([]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
  const [errorPair, setErrorPair] = useState<{
    left: string;
    right: string;
  } | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Initial Setup
  useEffect(() => {
    const pairs = unit.content.pairs || [];

    const sources: MatchingCard[] = pairs.map((p, idx) => {
      const pairId = p.id || `pair-${idx}`;
      return {
        id: `${pairId}_source`,
        text: p.source,
        pairId: pairId,
        type: 'source',
        isMatched: false,
      };
    });

    const targets: MatchingCard[] = pairs.map((p, idx) => {
      const pairId = p.id || `pair-${idx}`;
      return {
        id: `${pairId}_target`,
        text: p.target,
        pairId: pairId,
        type: 'target',
        isMatched: false,
      };
    });

    setLeftCards(sources.sort(() => Math.random() - 0.5));
    setRightCards(targets.sort(() => Math.random() - 0.5));
    setIsComplete(false);
  }, [unit]);

  const {setLastClickPosition} = useExerciseStore();

  const handleCardPress = (
    card: MatchingCard,
    event?: GestureResponderEvent,
  ) => {
    if (event) {
      setLastClickPosition({
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY,
      });
    }
    if (errorPair || card.isMatched || isComplete) {
      return;
    }

    if (card.type === 'source') {
      setSelectedLeftId(prev => (prev === card.id ? null : card.id));
    } else {
      setSelectedRightId(prev => (prev === card.id ? null : card.id));
    }
  };

  const handleMatch = useCallback(
    (pairId: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      setLeftCards(prev =>
        prev.map(c => (c.pairId === pairId ? {...c, isMatched: true} : c)),
      );
      setRightCards(prev =>
        prev.map(c => (c.pairId === pairId ? {...c, isMatched: true} : c)),
      );

      setSelectedLeftId(null);
      setSelectedRightId(null);

      triggerCorrect(GAMEPLAY.XP.MATCH_PAIR);
      onXP(GAMEPLAY.XP.MATCH_PAIR);
    },
    [triggerCorrect, onXP],
  );

  const handleMismatch = useCallback(
    (leftId: string | null, rightId: string | null) => {
      if (!leftId || !rightId) {
        return;
      }
      setErrorPair({left: leftId, right: rightId});
      triggerIncorrect();
      shake();

      setTimeout(() => {
        setErrorPair(null);
        setSelectedLeftId(null);
        setSelectedRightId(null);
      }, 400);
    },
    [triggerIncorrect, shake],
  );

  // Check Matches
  useEffect(() => {
    if (selectedLeftId && selectedRightId) {
      const leftCard = leftCards.find(c => c.id === selectedLeftId);
      const rightCard = rightCards.find(c => c.id === selectedRightId);

      if (leftCard && rightCard) {
        if (leftCard.pairId === rightCard.pairId) {
          handleMatch(leftCard.pairId);
        } else {
          handleMismatch(selectedLeftId, selectedRightId);
        }
      }
    }
  }, [
    selectedLeftId,
    selectedRightId,
    leftCards,
    rightCards,
    handleMatch,
    handleMismatch,
  ]);

  // Check Completion
  useEffect(() => {
    if (
      leftCards.length > 0 &&
      leftCards.every(c => c.isMatched) &&
      !isComplete
    ) {
      setIsComplete(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [leftCards, isComplete, onComplete]);

  if (isComplete) {
    return (
      <View
        style={[
          common.flex1,
          common.centered,
          styles.groupCompleteContainerExtra,
        ]}>
        <CheckCircle2 size={64} color={colors.success} />
        <Text style={styles.groupCompleteText}>Matched!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[common.flex1, styles.containerExtra]}>
      <Text style={styles.header}>Tap matching pairs</Text>

      <View
        style={[
          common.rowBetween,
          {alignItems: 'stretch'},
          styles.columnsContainerExtra,
        ]}>
        <View style={[common.flex1, styles.columnExtra]}>
          {leftCards.map(card => {
            const isSelected = selectedLeftId === card.id;
            const isError = errorPair?.left === card.id;

            if (card.isMatched) {
              return null;
            }

            return (
              <Animated.View
                key={card.id}
                style={{transform: [{translateX: shakeAnim}]}}>
                <TouchableOpacity
                  style={[
                    common.flex1,
                    common.centered,
                    styles.cardExtra,
                    isSelected && styles.cardSelected,
                    isError && styles.cardError,
                  ]}
                  onPress={() => handleCardPress(card)}
                  activeOpacity={0.7}>
                  <Text style={styles.text}>{card.text}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <View style={[common.flex1, styles.columnExtra]}>
          {rightCards.map(card => {
            const isSelected = selectedRightId === card.id;
            const isError = errorPair?.right === card.id;

            if (card.isMatched) {
              return null;
            }

            return (
              <Animated.View
                key={card.id}
                style={{transform: [{translateX: shakeAnim}]}}>
                <TouchableOpacity
                  style={[
                    common.flex1,
                    common.centered,
                    styles.cardExtra,
                    isSelected && styles.cardSelected,
                    isError && styles.cardError,
                  ]}
                  onPress={() => handleCardPress(card)}
                  activeOpacity={0.7}>
                  <Text style={styles.text}>{card.text}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};
