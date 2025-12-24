import React, {useEffect, useRef, memo} from 'react';
import {Text, Animated} from 'react-native';
import {useTheme} from '@/components/shared';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {typography} from '@/theme';
import {ANIMATION} from '@/constants';
import {LetterSlotStatus} from '@/types';

interface LetterSlotProps {
  char: string | null;
  status: LetterSlotStatus;
  fontFamily: string;
  animationsEnabled: boolean;
}

export const LetterSlot: React.FC<LetterSlotProps> = memo(
  ({char, status, fontFamily, animationsEnabled}) => {
    const {colors} = useTheme();
    const styles = useThemedStyles(_themeColors => ({
      letter: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.normal,
        minWidth: 20,
        textAlign: 'center',
      },
    }));

    const shakeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (!animationsEnabled) {
        shakeAnim.setValue(0);
        pulseAnim.setValue(1);
        return;
      }

      if (status === 'incorrect' || status === 'fadaMissing') {
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: ANIMATION.DURATION.SHAKE / 6,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: ANIMATION.DURATION.SHAKE / 6,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: ANIMATION.DURATION.SHAKE / 6,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: ANIMATION.DURATION.SHAKE / 6,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (status === 'focused') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: ANIMATION.DURATION.PULSE,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: ANIMATION.DURATION.PULSE,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      } else {
        shakeAnim.setValue(0);
        pulseAnim.setValue(1);
      }
    }, [status, shakeAnim, pulseAnim, animationsEnabled]);

    const getLetterColor = () => {
      switch (status) {
        case 'correct':
          return colors.accent;
        case 'incorrect':
          return colors.error;
        case 'fadaMissing':
          return colors.tiontuGold;
        case 'focused':
          return colors.primary;
        default:
          return colors.text.tertiary;
      }
    };

    return (
      <Animated.View
        style={{
          transform: [
            {translateX: shakeAnim},
            {scale: status === 'focused' ? pulseAnim : 1},
          ],
        }}>
        <Text
          style={[
            styles.letter,
            {
              color: getLetterColor(),
              // Only apply custom font to actual letters, not underscores
              fontFamily: char ? fontFamily : undefined,
            },
          ]}>
          {char || '_'}
        </Text>
      </Animated.View>
    );
  },
);

LetterSlot.displayName = 'LetterSlot';
