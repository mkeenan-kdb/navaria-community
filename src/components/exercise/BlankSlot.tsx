import React from 'react';
import {View, Text, TouchableOpacity, Animated} from 'react-native';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {useTheme} from '@/components/shared';
import {spacing, borderRadius, typography, opacity, withOpacity} from '@/theme';

interface Blank {
  id: number;
  answer: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
}

interface BlankSlotProps {
  blank: Blank;
  isActive: boolean;
  borderOpacity: Animated.Value;
  onPress: (index: number) => void;
  isChecking: boolean;
  currentFont: string;
  onRegisterRef: (index: number, ref: View | null) => void;
}

const createStyles = (themeColors: any) => ({
  blankSlot: {
    minWidth: 80,
    height: 44,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: themeColors.border,
    paddingHorizontal: spacing.sm,
    backgroundColor: themeColors.surfaceElevated,
    borderRadius: borderRadius.md,
    marginHorizontal: 2,
  },
  blankSlotActive: {
    borderColor: themeColors.primary,
    borderStyle: 'dashed' as const,
    backgroundColor: withOpacity(themeColors.primary, opacity.tint10),
  },
  blankSlotCorrect: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  blankSlotWrong: {
    borderColor: themeColors.error,
    borderStyle: 'solid' as const,
    backgroundColor: withOpacity(themeColors.error, opacity.tint20),
  },
  blankText: {
    fontSize: typography.sizes.xl,
    color: themeColors.primary,
    fontWeight: typography.weights.bold,
  },
  blankTextCorrect: {
    color: themeColors.success,
  },
});

export const BlankSlot: React.FC<BlankSlotProps> = React.memo(
  ({
    blank,
    isActive,
    borderOpacity,
    onPress,
    isChecking,
    currentFont,
    onRegisterRef,
  }) => {
    const {colors} = useTheme();
    const styles = useThemedStyles(createStyles);
    const common = createCommonStyles(colors);

    const isCorrect = blank.isCorrect === true;

    const slotStyle = [
      common.centered,
      styles.blankSlot,
      isActive && styles.blankSlotActive,
      isCorrect && styles.blankSlotCorrect,
      blank.isCorrect === false && styles.blankSlotWrong,
    ];

    const textStyle = [
      styles.blankText,
      isCorrect && styles.blankTextCorrect,
      currentFont !== 'System' && {fontFamily: currentFont},
    ];

    return (
      <Animated.View
        style={isActive ? {opacity: borderOpacity} : undefined}
        ref={(ref: View | null) => onRegisterRef(blank.id, ref)}>
        <TouchableOpacity
          style={slotStyle}
          onPress={() => onPress(blank.id)}
          disabled={isChecking || isCorrect}>
          <Text style={textStyle}>{blank.userAnswer || ''}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

BlankSlot.displayName = 'BlankSlot';
