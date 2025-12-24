import {useRef, useCallback} from 'react';
import {Animated} from 'react-native';

/**
 * Reusable shake animation hook for error feedback.
 * Used across MatchingPairs, Cloze, and SentenceUnderscoreDisplay.
 */
export const useShakeAnimation = () => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const reset = useCallback(() => {
    shakeAnim.stopAnimation();
    shakeAnim.setValue(0);
  }, [shakeAnim]);

  const shake = useCallback(() => {
    // Stop any existing animation and reset first
    shakeAnim.stopAnimation();
    shakeAnim.setValue(0);

    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Ensure reset to 0 after animation completes
      shakeAnim.setValue(0);
    });
  }, [shakeAnim]);

  return {shakeAnim, shake, reset};
};
