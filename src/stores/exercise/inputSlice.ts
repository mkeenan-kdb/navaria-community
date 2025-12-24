import {ExerciseSlice} from './types';
import {LetterSlotStatus} from '@/types';
import {compareChars, isPunctuation} from '@/utils/textUtils';
import {playSuccess, playError, playComplete} from '@/services/audio';
import {
  hapticCorrect,
  hapticIncorrect,
  hapticWordComplete,
} from '@/services/haptics';
import {initializeCurrentWord} from './lessonSlice';
import {GAMEPLAY, TIMING} from '@/constants';

// Helper to check if word is complete
export const completeCurrentWord = (set: any, get: any) => {
  const state = get();
  const word = state.allWords[state.currentWordIndex];
  const newRevealed = [...state.revealedWords];
  newRevealed[state.currentWordIndex] = word;

  // Check if sentence is complete
  const allRevealed = newRevealed.every(
    (w: string, i: number) =>
      w === state.allWords[i] || isPunctuation(state.allWords[i]),
  );

  if (allRevealed) {
    // Sentence complete!
    state.markCurrentSentenceComplete();
    set({revealedWords: newRevealed});
  } else {
    // Move to next word
    if (state.currentWordIndex < state.allWords.length - 1) {
      set({
        revealedWords: newRevealed,
        currentWordIndex: state.currentWordIndex + 1,
      });
      initializeCurrentWord(set, get);
    }
  }
};

export const createInputSlice: ExerciseSlice<any> = (set, get) => ({
  allWords: [],
  currentWordIndex: 0,
  revealedWords: [],
  typedLetters: [],
  slotStates: [],
  isCurrentWordLetter: [],
  currentLetterIndex: 0,
  currentWordHasMistakes: false,
  currentWordHelpUsed: false,
  revealedLetterCount: 0,

  typeLetter: (letter: string) => {
    const state = get();
    const word = state.allWords[state.currentWordIndex];
    if (!word) {
      return;
    }

    // Find current letter position
    let actualIndex = -1;
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      if (state.isCurrentWordLetter[i]) {
        if (count === state.currentLetterIndex) {
          actualIndex = i;
          break;
        }
        count++;
      }
    }

    if (actualIndex === -1 || actualIndex >= word.length) {
      return;
    }

    // Prevent typing if the slot is already correct (e.g. from a previous correct input or reveal)
    if (state.slotStates[actualIndex] === 'correct') {
      return;
    }

    if (actualIndex >= word.length) {
      return;
    }

    const targetChar = word[actualIndex];
    const result = compareChars(letter, targetChar);

    const newTypedLetters = [...state.typedLetters];
    const newSlotStates = [...state.slotStates];

    if (result === 'correct') {
      // Play correct feedback synchronously for minimum latency
      playSuccess().catch(console.warn);
      hapticCorrect().catch(console.warn);

      newTypedLetters[actualIndex] = letter;
      newSlotStates[actualIndex] = 'correct' as LetterSlotStatus;

      // Move to next letter
      let nextIndex = actualIndex + 1;
      while (nextIndex < word.length && !state.isCurrentWordLetter[nextIndex]) {
        nextIndex++;
      }

      if (nextIndex < word.length) {
        newSlotStates[nextIndex] = 'focused' as LetterSlotStatus;
        set({
          typedLetters: newTypedLetters,
          slotStates: newSlotStates,
          currentLetterIndex: state.currentLetterIndex + 1,
        });
      } else {
        // Word complete - play completion feedback synchronously for minimum latency
        playComplete().catch(console.warn);
        hapticWordComplete().catch(console.warn);

        // Bonus logic
        let xpToAdd = GAMEPLAY.XP.CORRECT_WORD;
        if (!state.currentWordHasMistakes) {
          xpToAdd += GAMEPLAY.XP.NO_MISTAKES_BONUS;
        }
        if (!state.currentWordHelpUsed) {
          xpToAdd += GAMEPLAY.XP.NO_HELP_BONUS;
        }

        set({
          typedLetters: newTypedLetters,
          slotStates: newSlotStates,
          sessionXP: state.sessionXP + xpToAdd,
        });
        completeCurrentWord(set, get);
      }
    } else {
      // Incorrect or fada missing - play error feedback synchronously for minimum latency
      playError().catch(console.warn);
      hapticIncorrect().catch(console.warn);

      newTypedLetters[actualIndex] = letter;
      newSlotStates[actualIndex] = result as LetterSlotStatus;

      set({
        typedLetters: newTypedLetters,
        slotStates: newSlotStates,
        mistakes: state.mistakes + 1,
        currentWordHasMistakes: true,
      });

      // Clear after delay
      setTimeout(() => {
        const currentState = get();
        // Ensure we are still on the same word/letter before clearing
        // Simple check: if typedLetters at actualIndex is still the incorrect letter
        if (currentState.typedLetters[actualIndex] === letter) {
          const clearedTyped = [...currentState.typedLetters];
          const clearedStates = [...currentState.slotStates];
          clearedTyped[actualIndex] = null;
          clearedStates[actualIndex] = 'focused' as LetterSlotStatus;
          set({
            typedLetters: clearedTyped,
            slotStates: clearedStates,
          });
        }
      }, TIMING.ERROR_CLEAR_DELAY);
    }
  },

  backspace: () => {
    const state = get();
    if (state.currentLetterIndex > 0) {
      // Find the actual index of the previous letter
      let count = 0;
      let actualIndex = -1;
      // We want the (currentLetterIndex - 1)-th letter
      const targetCount = state.currentLetterIndex - 1;

      for (let i = 0; i < state.isCurrentWordLetter.length; i++) {
        if (state.isCurrentWordLetter[i]) {
          if (count === targetCount) {
            actualIndex = i;
            break;
          }
          count++;
        }
      }

      if (actualIndex !== -1) {
        const newTypedLetters = [...state.typedLetters];
        const newSlotStates = [...state.slotStates];

        // Clear the previous letter
        newTypedLetters[actualIndex] = null;
        newSlotStates[actualIndex] = 'focused' as LetterSlotStatus;

        // Clear focus from current slot if it exists
        let currentFocusIndex = -1;
        let c2 = 0;
        for (let i = 0; i < state.isCurrentWordLetter.length; i++) {
          if (state.isCurrentWordLetter[i]) {
            if (c2 === state.currentLetterIndex) {
              currentFocusIndex = i;
              break;
            }
            c2++;
          }
        }
        if (
          currentFocusIndex !== -1 &&
          currentFocusIndex < newSlotStates.length
        ) {
          newSlotStates[currentFocusIndex] = 'empty' as LetterSlotStatus;
        }

        set({
          typedLetters: newTypedLetters,
          slotStates: newSlotStates,
          currentLetterIndex: targetCount,
        });
      }
    }
  },

  revealLetter: () => {
    const state = get();
    const word = state.allWords[state.currentWordIndex];
    if (!word) {
      return;
    }

    // Find first unrevealed letter
    let actualIndex = -1;
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      if (state.isCurrentWordLetter[i]) {
        if (count === state.currentLetterIndex) {
          actualIndex = i;
          break;
        }
        count++;
      }
    }

    if (actualIndex === -1 || actualIndex >= word.length) {
      return;
    }

    const targetChar = word[actualIndex];
    const newTypedLetters = [...state.typedLetters];
    const newSlotStates = [...state.slotStates];

    // Reveal the letter as if typed correctly
    newTypedLetters[actualIndex] = targetChar;
    newSlotStates[actualIndex] = 'correct' as LetterSlotStatus;

    // Mark help as used
    set({currentWordHelpUsed: true});

    // Move to next letter
    let nextIndex = actualIndex + 1;
    while (nextIndex < word.length && !state.isCurrentWordLetter[nextIndex]) {
      nextIndex++;
    }

    if (nextIndex < word.length) {
      newSlotStates[nextIndex] = 'focused' as LetterSlotStatus;
      set({
        typedLetters: newTypedLetters,
        slotStates: newSlotStates,
        currentLetterIndex: state.currentLetterIndex + 1,
        revealedLetterCount: state.revealedLetterCount + 1,
      });
    } else {
      // Word complete - synchronously for minimum latency
      playComplete().catch(console.warn);
      hapticWordComplete().catch(console.warn);

      // Bonus logic
      let xpToAdd = GAMEPLAY.XP.CORRECT_WORD;

      // If we revealed the whole word, no XP
      // We just revealed one, so check if previous count + 1 equals total letters
      const totalLetters = state.isCurrentWordLetter.filter(Boolean).length;
      if (state.revealedLetterCount + 1 >= totalLetters) {
        xpToAdd = 0;
      } else {
        if (!state.currentWordHasMistakes) {
          xpToAdd += GAMEPLAY.XP.NO_MISTAKES_BONUS;
        }
        // No help bonus is 0 because we used help
      }

      set({
        typedLetters: newTypedLetters,
        slotStates: newSlotStates,
        sessionXP: state.sessionXP + xpToAdd,
        revealedLetterCount: state.revealedLetterCount + 1,
      });
      completeCurrentWord(set, get);
    }
  },

  getCurrentWord: () => {
    const state = get();
    return state.allWords[state.currentWordIndex] || '';
  },

  isWordComplete: () => {
    const state = get();
    const word = state.getCurrentWord();
    if (!word) {
      return false;
    }

    for (let i = 0; i < word.length; i++) {
      if (state.isCurrentWordLetter[i]) {
        if (state.slotStates[i] !== ('correct' as LetterSlotStatus)) {
          return false;
        }
      }
    }
    return true;
  },
});
