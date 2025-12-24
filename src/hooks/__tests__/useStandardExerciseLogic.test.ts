import {renderHook, act} from '@testing-library/react-native';
import {useStandardExerciseLogic} from '../useStandardExerciseLogic';

// Mock services
jest.mock('@/services/audio', () => ({
  playSuccess: jest.fn().mockResolvedValue(undefined),
  playError: jest.fn().mockResolvedValue(undefined),
  playComplete: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/haptics', () => ({
  hapticCorrect: jest.fn().mockResolvedValue(undefined),
  hapticIncorrect: jest.fn().mockResolvedValue(undefined),
  hapticWordComplete: jest.fn().mockResolvedValue(undefined),
}));

// Mock utils if needed, or use real ones if available
// For now, let's assume Jest can resolve the aliases from tsconfig/babel.

describe('useStandardExerciseLogic XP Logic', () => {
  const onSentenceComplete = jest.fn();
  const onXP = jest.fn();
  const onMistake = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setupHook = () =>
    renderHook(() =>
      useStandardExerciseLogic({
        onSentenceComplete,
        onXP,
        onMistake,
      }),
    );

  it('awards full XP for correct word without help or mistakes', () => {
    const {result} = setupHook();

    // Initialize with a simple word
    act(() => {
      result.current.initializeSentence({
        targetText: 'Hi',
        sourceText: 'Hi',
        id: '1',
        content: {source: 'Hi', target: 'Hi'},
      } as any);
    });

    // Type 'H'
    act(() => result.current.typeLetter('H'));
    // Type 'i'
    act(() => result.current.typeLetter('i'));

    // Handle timeout for completion
    act(() => {
      jest.runAllTimers();
    });

    // 10 (base) + 2 (mistakes) + 2 (help) = 14
    expect(onXP).toHaveBeenLastCalledWith(14, 0, {
      hasMistakes: false,
      helpUsed: false,
    });
  });

  it('does NOT award No Mistakes bonus if a mistake was made', () => {
    const {result} = setupHook();

    act(() => {
      result.current.initializeSentence({
        targetText: 'Hi',
        sourceText: 'Hi',
        id: '1',
        content: {source: 'Hi', target: 'Hi'},
      } as any);
    });

    // Type 'X' (mistake)
    act(() => result.current.typeLetter('X'));

    // Type 'H'
    act(() => result.current.typeLetter('H'));
    // Type 'i'
    act(() => result.current.typeLetter('i'));

    // Handle timeout for completion
    act(() => {
      jest.runAllTimers();
    });

    // 10 (base) + 0 (mistakes) + 2 (help) = 12
    const lastCallArgs = onXP.mock.calls[onXP.mock.calls.length - 1];
    const xpAwarded = lastCallArgs[0];
    const stats = lastCallArgs[2];

    expect(xpAwarded).toBe(12);
    expect(xpAwarded).not.toBe(14);
    expect(stats.hasMistakes).toBe(true);
  });

  it('does NOT award No Help bonus if reveal was used', () => {
    const {result} = setupHook();

    act(() => {
      result.current.initializeSentence({
        targetText: 'Hi',
        sourceText: 'Hi',
        id: '1',
        content: {source: 'Hi', target: 'Hi'},
      } as any);
    });

    // Use reveal (reveals H)
    act(() => result.current.revealLetter());

    // Type 'i'
    act(() => result.current.typeLetter('i'));

    // Handle timeout for completion
    act(() => {
      jest.runAllTimers();
    });

    // 10 (base) + 2 (mistakes) + 0 (help) = 12
    const lastCallArgs = onXP.mock.calls[onXP.mock.calls.length - 1];
    const xpAwarded = lastCallArgs[0];
    const stats = lastCallArgs[2];

    expect(xpAwarded).toBe(12);
    expect(xpAwarded).not.toBe(14);
    expect(stats.helpUsed).toBe(true);
  });
});
