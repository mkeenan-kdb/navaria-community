import {StateCreator} from 'zustand';
import {Lesson, Exercise, LetterSlotStatus, Sentence} from '@/types';

export interface LessonSlice {
  currentLesson: (Lesson | Exercise) | null;
  currentUnitIndex: number;
  completedUnitIds: Set<string>;
  showSourceText: boolean;
  isPlaying: boolean;

  initializeLesson: (lesson: Lesson | Exercise, completedIds: string[]) => void;
  nextUnit: () => void;
  previousUnit: () => void;
  goToUnit: (index: number) => void;
  markCurrentUnitComplete: () => void;
  markUnitComplete: (unitId: string) => void;
  toggleSourceText: () => void;
  setPlaying: (playing: boolean) => void;
  resetLesson: () => void;
  clearLesson: () => void;

  getCurrentUnit: () => Sentence | null;
  getProgress: () => number;
  isComplete: () => boolean;
  canProceed: () => boolean;
}

export interface InputSlice {
  allWords: string[];
  currentWordIndex: number;
  revealedWords: string[];
  typedLetters: (string | null)[];
  slotStates: LetterSlotStatus[];
  isCurrentWordLetter: boolean[];
  currentLetterIndex: number;
  currentWordHasMistakes: boolean;
  currentWordHelpUsed: boolean;
  revealedLetterCount: number;

  typeLetter: (letter: string) => void;
  backspace: () => void;
  revealLetter: () => void;

  getCurrentWord: () => string;
  isWordComplete: () => boolean;
}

export interface NavigationSlice {
  navigateToPreviousWord: () => void;
  navigateToNextWord: () => void;
  canNavigatePrevious: () => boolean;
  canNavigateNext: () => boolean;
  goToWord: (index: number) => void;
}

export interface StatsSlice {
  sessionStartTime: number;
  mistakes: number;
  sessionXP: number;
  lastClickPosition: {x: number; y: number} | null;

  getSessionStats: () => {
    timeSpentMinutes: number;
    mistakes: number;
    sessionXP: number;
  };
  addSessionXP: (amount: number) => void;
  setLastClickPosition: (position: {x: number; y: number} | null) => void;
}

export type ExerciseState = LessonSlice &
  InputSlice &
  NavigationSlice &
  StatsSlice;

export type ExerciseSlice<T> = StateCreator<ExerciseState, [], [], T>;
