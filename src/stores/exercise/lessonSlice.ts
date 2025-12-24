import {ExerciseSlice} from './types';
import {Exercise, Lesson} from '@/types';
import {tokenizeIrishText, isPunctuation} from '@/utils/textUtils';
import {LetterSlotStatus} from '@/types';

// Helper to initialize word state (needs access to set/get from store)
export const initializeWordState = (set: any, get: any) => {
  const state = get();
  const sentence = state.getCurrentUnit();

  if (!sentence) {
    set({
      allWords: [],
      currentWordIndex: 0,
      revealedWords: [],
    });
    return;
  }

  const words = tokenizeIrishText(sentence.targetText);
  set({
    allWords: words,
    revealedWords: new Array(words.length).fill(''),
    currentWordIndex: 0,
  });

  initializeCurrentWord(set, get);
};

export const initializeCurrentWord = (set: any, get: any) => {
  const state = get();
  const word = state.allWords[state.currentWordIndex];
  if (!word) {
    return;
  }

  // Skip punctuation
  if (isPunctuation(word)) {
    const newRevealed = [...state.revealedWords];
    newRevealed[state.currentWordIndex] = word;
    set({revealedWords: newRevealed});

    if (state.currentWordIndex < state.allWords.length - 1) {
      set({currentWordIndex: state.currentWordIndex + 1});
      initializeCurrentWord(set, get);
    }
    return;
  }

  // Initialize letter arrays
  const typedLetters = new Array(word.length).fill(null);
  const slotStates = new Array(word.length).fill('empty' as LetterSlotStatus);
  const isCurrentWordLetter = word
    .split('')
    .map((char: string) => !isPunctuation(char));

  // Set first letter slot to focused
  for (let i = 0; i < word.length; i++) {
    if (isCurrentWordLetter[i]) {
      slotStates[i] = 'focused' as LetterSlotStatus;
      break;
    }
  }

  set({
    typedLetters,
    slotStates,
    isCurrentWordLetter,
    currentLetterIndex: 0,
    currentWordHasMistakes: false,
    currentWordHelpUsed: false,
    revealedLetterCount: 0,
  });
};

export const createLessonSlice: ExerciseSlice<any> = (set, get) => ({
  currentLesson: null,
  currentUnitIndex: 0,
  completedUnitIds: new Set<string>(),
  showSourceText: false,
  isPlaying: false,

  initializeLesson: (
    lesson: Lesson | Exercise,
    completedIds: string[] = [],
  ) => {
    const sentences = (lesson as Exercise).sentences || [];
    const completedSet = new Set(completedIds);

    // Find first uncompleted sentence
    let startIndex = 0;
    if (sentences.length > 0) {
      for (let i = 0; i < sentences.length; i++) {
        if (!completedSet.has(sentences[i].id)) {
          startIndex = i;
          break;
        }
      }
    }

    set({
      currentLesson: lesson,
      currentUnitIndex: startIndex,
      completedUnitIds: completedSet,
      showSourceText: false,
      isPlaying: false,
      sessionStartTime: Date.now(),
      mistakes: 0,
      sessionXP: 0,
      currentWordHasMistakes: false,
      currentWordHelpUsed: false,
      revealedLetterCount: 0,
    });

    // Initialize word state for current sentence
    const state = get();
    if (state.currentLesson && sentences && sentences.length > 0) {
      initializeWordState(set, get);
    }
  },

  nextUnit: () => {
    const state = get();
    const sentences = (state.currentLesson as Exercise)?.sentences || [];
    if (
      state.currentLesson &&
      sentences.length > 0 &&
      state.currentUnitIndex < sentences.length - 1
    ) {
      set({
        currentUnitIndex: state.currentUnitIndex + 1,
        showSourceText: false,
      });
      initializeWordState(set, get);
    }
  },

  previousUnit: () => {
    const state = get();
    if (state.currentUnitIndex > 0) {
      set({
        currentUnitIndex: state.currentUnitIndex - 1,
        showSourceText: false,
      });
      initializeWordState(set, get);
    }
  },

  goToUnit: (index: number) => {
    const state = get();
    const sentences = (state.currentLesson as Exercise)?.sentences || [];
    if (
      state.currentLesson &&
      sentences.length > 0 &&
      index >= 0 &&
      index < sentences.length
    ) {
      set({
        currentUnitIndex: index,
        showSourceText: false,
      });
      initializeWordState(set, get);
    }
  },

  markCurrentUnitComplete: () => {
    const state = get();
    const sentence = state.getCurrentUnit();
    if (sentence) {
      const newCompleted = new Set(state.completedUnitIds);
      newCompleted.add(sentence.id);
      set({completedUnitIds: newCompleted});
    }
  },

  markUnitComplete: (unitId: string) => {
    const state = get();
    const newCompleted = new Set(state.completedUnitIds);
    newCompleted.add(unitId);
    set({completedUnitIds: newCompleted});
  },

  toggleSourceText: () =>
    set((state: any) => ({showSourceText: !state.showSourceText})),

  setPlaying: (playing: boolean) => set({isPlaying: playing}),

  resetLesson: () => {
    set({
      currentUnitIndex: 0,
      completedUnitIds: new Set<string>(),
      showSourceText: false,
      isPlaying: false,
      sessionStartTime: Date.now(),
      mistakes: 0,
      sessionXP: 0,
      currentWordHasMistakes: false,
    });
    initializeWordState(set, get);
  },

  clearLesson: () => {
    set({
      currentLesson: null,
      currentUnitIndex: 0,
      completedUnitIds: new Set<string>(),
      allWords: [],
      currentWordIndex: 0,
      revealedWords: [],
      typedLetters: [],
      slotStates: [],
      isCurrentWordLetter: [],
      currentLetterIndex: 0,
      showSourceText: false,
      isPlaying: false,
      sessionStartTime: Date.now(),
      mistakes: 0,
      sessionXP: 0,
      currentWordHasMistakes: false,
    });
  },

  getCurrentUnit: () => {
    const state = get();
    const sentences = (state.currentLesson as Exercise)?.sentences || [];
    return sentences[state.currentUnitIndex] || null;
  },

  getProgress: () => {
    const state = get();
    const sentences = (state.currentLesson as Exercise)?.sentences || [];
    if (!state.currentLesson || sentences.length === 0) {
      return 0;
    }
    return (state.completedUnitIds.size / sentences.length) * 100;
  },

  isComplete: () => {
    const state = get();
    const sentences = (state.currentLesson as Exercise)?.sentences || [];
    if (!state.currentLesson || sentences.length === 0) {
      return false;
    }
    return state.completedUnitIds.size === sentences.length;
  },

  canProceed: () => {
    const state = get();
    const sentence = state.getCurrentUnit();
    return sentence ? state.completedUnitIds.has(sentence.id) : false;
  },
});
