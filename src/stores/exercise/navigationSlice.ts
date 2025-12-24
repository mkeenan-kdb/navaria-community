import {ExerciseSlice} from './types';
import {isPunctuation} from '@/utils/textUtils';
import {initializeCurrentWord} from './lessonSlice';

export const createNavigationSlice: ExerciseSlice<any> = (set, get) => ({
  navigateToPreviousWord: () => {
    const state = get();
    if (state.currentWordIndex > 0) {
      let newIndex = state.currentWordIndex - 1;
      // Skip punctuation and revealed words
      while (
        newIndex > 0 &&
        (isPunctuation(state.allWords[newIndex]) ||
          state.revealedWords[newIndex])
      ) {
        newIndex--;
      }

      if (
        isPunctuation(state.allWords[newIndex]) ||
        state.revealedWords[newIndex]
      ) {
        return; // No previous unrevealed word found
      }

      set({currentWordIndex: newIndex});
      initializeCurrentWord(set, get);
    }
  },

  canNavigatePrevious: () => {
    const state = get();
    let index = state.currentWordIndex - 1;
    while (index >= 0) {
      if (
        !isPunctuation(state.allWords[index]) &&
        !state.revealedWords[index]
      ) {
        return true;
      }
      index--;
    }
    return false;
  },

  canNavigateNext: () => {
    const state = get();
    let index = state.currentWordIndex + 1;
    while (index < state.allWords.length) {
      if (
        !isPunctuation(state.allWords[index]) &&
        !state.revealedWords[index]
      ) {
        return true;
      }
      index++;
    }
    return false;
  },

  navigateToNextWord: () => {
    const state = get();
    if (state.currentWordIndex < state.allWords.length - 1) {
      let newIndex = state.currentWordIndex + 1;
      // Skip punctuation and revealed words
      while (
        newIndex < state.allWords.length - 1 &&
        (isPunctuation(state.allWords[newIndex]) ||
          state.revealedWords[newIndex])
      ) {
        newIndex++;
      }

      // Check if the found index is valid (not punctuation/revealed)
      if (
        isPunctuation(state.allWords[newIndex]) ||
        state.revealedWords[newIndex]
      ) {
        return; // No next unrevealed word found
      }

      set({currentWordIndex: newIndex});
      initializeCurrentWord(set, get);
    }
  },

  goToWord: (index: number) => {
    const state = get();
    if (index >= 0 && index < state.allWords.length) {
      // Skip if punctuation
      if (isPunctuation(state.allWords[index])) {
        return;
      }
      set({currentWordIndex: index});
      initializeCurrentWord(set, get);
    }
  },
});
