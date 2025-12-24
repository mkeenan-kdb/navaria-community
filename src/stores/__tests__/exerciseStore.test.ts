import {useExerciseStore} from '../exerciseStore';
import type {Exercise} from '@/types';
import * as AudioService from '@/services/audio';

// Mock services
jest.mock('@/services/audio', () => ({
  playSuccess: jest.fn().mockResolvedValue(undefined),
  playError: jest.fn().mockResolvedValue(undefined),
  playComplete: jest.fn().mockResolvedValue(undefined),
  playLessonComplete: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/haptics', () => ({
  hapticCorrect: jest.fn().mockResolvedValue(undefined),
  hapticIncorrect: jest.fn().mockResolvedValue(undefined),
  hapticWordComplete: jest.fn().mockResolvedValue(undefined),
  hapticCompletion: jest.fn().mockResolvedValue(undefined),
}));

const mockExercise: Exercise = {
  id: 'ex-1',
  lessonId: 'lesson-1',
  title: 'Test Exercise',
  type: 'standard',
  displayOrder: 1,
  estimatedMinutes: 5,
  isAvailable: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sentences: [
    {
      id: 's-1',
      exerciseId: 'ex-1',
      unitType: 'sentence', // Added
      content: {
        target: 'Tá sé',
        source: 'It is',
      },
      targetText: 'Tá sé',
      sourceText: 'It is',
      displayOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

describe('exerciseStore', () => {
  beforeEach(() => {
    useExerciseStore.getState().clearLesson();
    jest.clearAllMocks();
  });

  it('initializes correctly', () => {
    const {initializeLesson, getCurrentUnit} = useExerciseStore.getState();

    initializeLesson(mockExercise, []);

    expect(getCurrentUnit()?.targetText).toBe('Tá sé');
    expect(useExerciseStore.getState().allWords).toEqual(['Tá', 'sé']);
  });

  it('handles correct typing', () => {
    const {initializeLesson, typeLetter} = useExerciseStore.getState();

    initializeLesson(mockExercise, []);

    // First word is "Tá"
    typeLetter('T');

    const state = useExerciseStore.getState();
    expect(state.typedLetters[0]).toBe('T');
    expect(state.slotStates[0]).toBe('correct');
    expect(AudioService.playSuccess).toHaveBeenCalled();
  });

  it('handles incorrect typing', () => {
    const {initializeLesson, typeLetter} = useExerciseStore.getState();

    initializeLesson(mockExercise, []);

    // First word is "Tá", try typing 'X'
    typeLetter('X');

    const state = useExerciseStore.getState();
    expect(state.slotStates[0]).toBe('incorrect');
    expect(AudioService.playError).toHaveBeenCalled();
  });

  it('handles word completion', () => {
    const {initializeLesson, typeLetter} = useExerciseStore.getState();

    initializeLesson(mockExercise, []);

    // Type "Tá"
    typeLetter('T');
    typeLetter('á');

    const state = useExerciseStore.getState();
    expect(state.revealedWords[0]).toBe('Tá');
    expect(AudioService.playComplete).toHaveBeenCalled();
  });

  it('clears incorrect state after delay', () => {
    jest.useFakeTimers();
    const {initializeLesson, typeLetter} = useExerciseStore.getState();

    initializeLesson(mockExercise, []);

    typeLetter('X');

    expect(useExerciseStore.getState().slotStates[0]).toBe('incorrect');

    jest.advanceTimersByTime(600);

    expect(useExerciseStore.getState().slotStates).toEqual([
      'focused',
      'empty',
    ]);

    jest.useRealTimers();
  });

  it('handles fada missing feedback', () => {
    const {initializeLesson, typeLetter} = useExerciseStore.getState();
    initializeLesson(mockExercise, []);

    // First word is "Tá", try typing 'a' (missing fada)
    // Note: The first letter is 'T', so we need to type 'T' first to get to 'á'
    typeLetter('T');
    typeLetter('a');

    const state = useExerciseStore.getState();
    // The second letter (index 1) should be incorrect/fadaMissing
    // The store treats fadaMissing as a specific result but sets slot state to that result
    expect(state.slotStates[1]).toBe('fadaMissing');
    expect(AudioService.playError).toHaveBeenCalled();
  });

  it('skips punctuation correctly', () => {
    const exerciseWithPunctuation: Exercise = {
      ...mockExercise,
      sentences: [
        {
          ...mockExercise.sentences![0],
          targetText: 'Dia duit!',
          content: {
            source: 'Hello',
            target: 'Dia duit!',
          },
        },
      ],
    };

    const {initializeLesson, typeLetter} = useExerciseStore.getState();
    initializeLesson(exerciseWithPunctuation, []);

    // Words: ["Dia", "duit", "!"]
    // Type "Dia"
    typeLetter('D');
    typeLetter('i');
    typeLetter('a');

    // Should auto-advance to "duit"
    const state = useExerciseStore.getState();
    expect(state.currentWordIndex).toBe(1);
    expect(state.getCurrentWord()).toBe('duit');
  });

  it('navigates between sentences', () => {
    const multiSentenceExercise: Exercise = {
      ...mockExercise,
      sentences: [
        {
          ...mockExercise.sentences![0],
          id: 's-1',
          targetText: 'A',
          content: {source: 'A', target: 'A'},
        },
        {
          ...mockExercise.sentences![0],
          id: 's-2',
          targetText: 'B',
          content: {source: 'B', target: 'B'},
        },
      ],
    };

    const {initializeLesson} = useExerciseStore.getState();
    initializeLesson(multiSentenceExercise, []);

    expect(useExerciseStore.getState().currentUnitIndex).toBe(0);

    useExerciseStore.getState().nextUnit();
    expect(useExerciseStore.getState().currentUnitIndex).toBe(1);

    useExerciseStore.getState().previousUnit();
    expect(useExerciseStore.getState().currentUnitIndex).toBe(0);
  });

  it('calculates progress correctly', () => {
    const multiSentenceExercise: Exercise = {
      ...mockExercise,
      sentences: [
        {...mockExercise.sentences![0], id: 's-1'},
        {...mockExercise.sentences![0], id: 's-2'},
      ],
    };

    const {initializeLesson, markCurrentUnitComplete} =
      useExerciseStore.getState();
    initializeLesson(multiSentenceExercise, []);

    expect(useExerciseStore.getState().getProgress()).toBe(0);

    markCurrentUnitComplete();
    expect(useExerciseStore.getState().getProgress()).toBe(50);
  });

  it('tracks session stats', () => {
    const {initializeLesson, typeLetter, getSessionStats} =
      useExerciseStore.getState();
    initializeLesson(mockExercise, []);

    // Make a mistake
    typeLetter('X');

    const stats = getSessionStats();
    expect(stats.mistakes).toBe(1);
    expect(stats.sessionXP).toBe(0);
  });
});
