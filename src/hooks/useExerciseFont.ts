import {useFontStore} from '@/stores/fontStore';

/**
 * Reusable hook for exercise font handling.
 * Returns current font and a style object for easy application.
 */
export const useExerciseFont = () => {
  const {currentFont} = useFontStore();
  const fontStyle =
    currentFont !== 'System' ? {fontFamily: currentFont} : undefined;

  return {currentFont, fontStyle};
};
