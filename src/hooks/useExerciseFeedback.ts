import {useCallback} from 'react';
import {GestureResponderEvent} from 'react-native';
import {useExerciseStore} from '@/stores/exerciseStore';
import {playComplete, playError} from '@/services/audio';

/**
 * Unified hook for exercise feedback (XP + sound + click tracking).
 * Simplifies correct/incorrect response handling across exercise types.
 */
export const useExerciseFeedback = () => {
  const {setLastClickPosition} = useExerciseStore();

  const triggerCorrect = useCallback(
    (xp: number, event?: GestureResponderEvent) => {
      if (event) {
        setLastClickPosition({
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        });
      }
      // XP is now handled by the specific exercise component via callbacks
      // addSessionXP(xp);
      playComplete();
    },
    [setLastClickPosition],
  );

  const triggerIncorrect = useCallback(() => {
    playError();
  }, []);

  return {triggerCorrect, triggerIncorrect};
};
