import {useRef, useEffect} from 'react';
import {Animated} from 'react-native';

/**
 * Reusable flashing border animation hook for active elements.
 * Used in ClozeExercise and SentenceUnderscoreDisplay.
 */
export const useFlashingBorder = () => {
  const borderOpacity = useRef(new Animated.Value(1)).current;

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

  return borderOpacity;
};
