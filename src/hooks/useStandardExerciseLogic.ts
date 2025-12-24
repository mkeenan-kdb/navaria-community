import {useState, useCallback, useRef, useEffect} from 'react';
import {Sentence, LetterSlotStatus} from '@/types';
import {
  tokenizeIrishText,
  isPunctuation,
  compareChars,
} from '@/utils/textUtils';
import {playSuccess, playError, playComplete} from '@/services/audio';
import {
  hapticCorrect,
  hapticIncorrect,
  hapticWordComplete,
} from '@/services/haptics';
import {GAMEPLAY, TIMING} from '@/constants';

interface UseStandardLogicProps {
  onSentenceComplete: () => void;
  onMistake?: () => void;
  onXP: (
    amount: number,
    wordIndex?: number,
    stats?: {hasMistakes: boolean; helpUsed: boolean},
  ) => void;
}

export const useStandardExerciseLogic = ({
  onSentenceComplete,
  onMistake,
  onXP,
}: UseStandardLogicProps) => {
  // ============================================
  // STATE - Word and sentence tracking
  // ============================================
  const [allWords, setAllWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [revealedWords, setRevealedWords] = useState<string[]>([]);

  const [typedLetters, setTypedLetters] = useState<(string | null)[]>([]);
  const [slotStates, setSlotStates] = useState<LetterSlotStatus[]>([]);
  const [isCurrentWordLetter, setIsCurrentWordLetter] = useState<boolean[]>([]);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);

  // Scoring state - using Refs to avoid stale closures during rapid updates
  const currentWordHasMistakes = useRef(false);
  const currentWordHelpUsed = useRef(false);
  const revealedLetterCount = useRef(0);

  // ============================================
  // REFS - Avoid stale closures in timeouts
  // ============================================
  const onSentenceCompleteRef = useRef(onSentenceComplete);
  const stateRef = useRef({
    typedLetters,
    slotStates,
    allWords,
    currentWordIndex,
    revealedWords,
    isCurrentWordLetter,
  });

  useEffect(() => {
    onSentenceCompleteRef.current = onSentenceComplete;
  }, [onSentenceComplete]);

  useEffect(() => {
    stateRef.current = {
      typedLetters,
      slotStates,
      allWords,
      currentWordIndex,
      revealedWords,
      isCurrentWordLetter,
    };
  }, [
    typedLetters,
    slotStates,
    allWords,
    currentWordIndex,
    revealedWords,
    isCurrentWordLetter,
  ]);

  // ============================================
  // INITIALIZATION - Word and sentence setup
  // ============================================
  const initializeCurrentWordState = useCallback((word: string) => {
    // Skip punctuation logic handled in upper scope or recursive?
    // Doing it here:
    // If word is punctuation, we should've handled it before calling this,
    // OR we handle it here by immediately completing it?
    // Let's assume the caller handles "skipping" punctuation words,
    // or we do it inside initializeSentence.

    // Logic from lessonSlice:50
    const letters = word.split('');
    const _isCurrentWordLetter = letters.map(char => !isPunctuation(char));
    const _typedLetters = new Array(word.length).fill(null);
    const _slotStates = new Array(word.length).fill(LetterSlotStatus.Empty);

    // Focused first slot
    for (let i = 0; i < word.length; i++) {
      if (_isCurrentWordLetter[i]) {
        _slotStates[i] = LetterSlotStatus.Focused;
        break;
      }
    }

    setTypedLetters(_typedLetters);
    setSlotStates(_slotStates);
    setIsCurrentWordLetter(_isCurrentWordLetter);
    setCurrentLetterIndex(0);
    currentWordHasMistakes.current = false;
    currentWordHelpUsed.current = false;
    revealedLetterCount.current = 0;
  }, []);

  const initializeSentence = useCallback(
    (sentence: Sentence) => {
      const words = tokenizeIrishText(sentence.targetText || '');
      setAllWords(words);
      setRevealedWords(new Array(words.length).fill(''));
      setCurrentWordIndex(0);

      // Helper to auto-fill punctuation at start
      const initialRevealed = new Array(words.length).fill('');

      // Logic from initializeCurrentWord (lessonSlice:30)
      // It recursively skips punctuation.
      // We can simulate that loop.

      let i = 0;
      while (i < words.length && isPunctuation(words[i])) {
        initialRevealed[i] = words[i];
        i++;
      }

      setRevealedWords(initialRevealed);
      setCurrentWordIndex(i);

      if (i < words.length) {
        initializeCurrentWordState(words[i]);
      } else {
        // Sentence with only punctuation? Complete immediately.
        onSentenceCompleteRef.current();
      }
    },
    [initializeCurrentWordState],
  );

  // ============================================
  // WORD COMPLETION - Handle completing words
  // ============================================
  const completeCurrentWord = useCallback(() => {
    const word = stateRef.current.allWords[stateRef.current.currentWordIndex];
    if (!word) {
      return;
    }

    setRevealedWords(prev => {
      const next = [...prev];
      next[stateRef.current.currentWordIndex] = word;

      // Move to next word
      let nextIndex = stateRef.current.currentWordIndex + 1;
      // Auto-skip punctuation
      while (
        nextIndex < stateRef.current.allWords.length &&
        isPunctuation(stateRef.current.allWords[nextIndex])
      ) {
        next[nextIndex] = stateRef.current.allWords[nextIndex];
        nextIndex++;
      }

      // Check sentence completion
      const allRevealed = next.every(
        (w, idx) =>
          w === stateRef.current.allWords[idx] ||
          isPunctuation(stateRef.current.allWords[idx]),
      );

      if (allRevealed) {
        // Wait a tick for UI update then complete
        setTimeout(() => onSentenceCompleteRef.current(), 0);
      } else {
        if (nextIndex < stateRef.current.allWords.length) {
          setCurrentWordIndex(nextIndex);
          initializeCurrentWordState(stateRef.current.allWords[nextIndex]);
        } else {
          // End reached (trailing punctuation might cause this)
          setTimeout(() => onSentenceCompleteRef.current(), 0);
        }
      }
      return next;
    });
  }, [initializeCurrentWordState]);

  // ============================================
  // ACTIONS - User input handlers
  // ============================================
  const typeLetterAction = (letter: string) => {
    const word = allWords[currentWordIndex];
    if (!word) {
      return;
    }

    // Find actual index
    let actualIndex = -1;
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      if (isCurrentWordLetter[i]) {
        if (count === currentLetterIndex) {
          actualIndex = i;
          break;
        }
        count++;
      }
    }

    if (actualIndex === -1 || actualIndex >= word.length) {
      return;
    }
    if (slotStates[actualIndex] === LetterSlotStatus.Correct) {
      return;
    }

    const targetChar = word[actualIndex];
    const result = compareChars(letter, targetChar);

    const newTyped = [...typedLetters];
    const newStates = [...slotStates];

    if (result === 'correct') {
      playSuccess().catch(() => {});
      hapticCorrect().catch(() => {});

      newTyped[actualIndex] = letter;
      newStates[actualIndex] = LetterSlotStatus.Correct;

      // Next letter
      let nextIndex = actualIndex + 1;
      while (nextIndex < word.length && !isCurrentWordLetter[nextIndex]) {
        nextIndex++;
      }

      if (nextIndex < word.length) {
        newStates[nextIndex] = LetterSlotStatus.Focused;
        setTypedLetters(newTyped);
        setSlotStates(newStates);
        setCurrentLetterIndex(prev => prev + 1);
      } else {
        // Word Complete
        playComplete().catch(() => {});
        hapticWordComplete().catch(() => {});

        // XP
        let xp = GAMEPLAY.XP.CORRECT_WORD;
        if (!currentWordHasMistakes.current) {
          xp += GAMEPLAY.XP.NO_MISTAKES_BONUS;
        }
        if (!currentWordHelpUsed.current) {
          xp += GAMEPLAY.XP.NO_HELP_BONUS;
        }
        onXP(xp, currentWordIndex, {
          hasMistakes: currentWordHasMistakes.current,
          helpUsed: currentWordHelpUsed.current,
        });

        setTypedLetters(newTyped);
        setSlotStates(newStates);

        // Trigger completion logic
        setTimeout(() => completeCurrentWord(), 0);
      }
    } else {
      // Incorrect
      playError().catch(() => {});
      hapticIncorrect().catch(() => {});

      newTyped[actualIndex] = letter;
      newStates[actualIndex] = result as LetterSlotStatus; // 'incorrect' | 'fada_missing'

      setTypedLetters(newTyped);
      setSlotStates(newStates);
      currentWordHasMistakes.current = true;
      if (onMistake) {
        onMistake();
      }

      // Clear error - capture word index and letter index to avoid clearing wrong word's letters
      const errorWordIndex = currentWordIndex;
      const errorLetterIndex = actualIndex;
      const errorLetter = letter;
      setTimeout(() => {
        // Only clear if still on the same word and letter position is valid
        if (
          stateRef.current.currentWordIndex !== errorWordIndex ||
          errorLetterIndex >= stateRef.current.typedLetters.length
        ) {
          return;
        }
        setTypedLetters(prev => {
          if (prev[errorLetterIndex] === errorLetter) {
            const next = [...prev];
            next[errorLetterIndex] = null;
            return next;
          }
          return prev;
        });
        setSlotStates(prev => {
          const next = [...prev];
          if (
            errorLetterIndex < next.length &&
            next[errorLetterIndex] !== LetterSlotStatus.Correct
          ) {
            next[errorLetterIndex] = LetterSlotStatus.Focused;
          }
          return next;
        });
      }, TIMING.ERROR_CLEAR_DELAY);
    }
  };

  const backspaceAction = () => {
    if (currentLetterIndex > 0) {
      // Find prev index
      let targetCount = currentLetterIndex - 1;
      let actualIndex = -1;
      let count = 0;

      for (let i = 0; i < wordLen(); i++) {
        if (isCurrentWordLetter[i]) {
          if (count === targetCount) {
            actualIndex = i;
            break;
          }
          count++;
        }
      }

      if (actualIndex !== -1) {
        const newTyped = [...typedLetters];
        const newStates = [...slotStates];
        newTyped[actualIndex] = null;
        newStates[actualIndex] = LetterSlotStatus.Focused;

        // Remove focus from current
        // Find current focused
        let currentActual = -1;
        let c2 = 0;
        for (let i = 0; i < wordLen(); i++) {
          if (isCurrentWordLetter[i]) {
            if (c2 === currentLetterIndex) {
              currentActual = i;
              break;
            }
            c2++;
          }
        }
        if (currentActual !== -1 && currentActual < newStates.length) {
          newStates[currentActual] = LetterSlotStatus.Empty;
        }

        setTypedLetters(newTyped);
        setSlotStates(newStates);
        setCurrentLetterIndex(targetCount);
      }
    }
  };

  const wordLen = () => allWords[currentWordIndex]?.length || 0;

  const revealLetterAction = () => {
    const word = allWords[currentWordIndex];
    if (!word) {
      return;
    }

    let actualIndex = -1;
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      if (isCurrentWordLetter[i]) {
        if (count === currentLetterIndex) {
          actualIndex = i;
          break;
        }
        count++;
      }
    }

    if (actualIndex === -1) {
      return;
    }

    const targetChar = word[actualIndex];
    const newTyped = [...typedLetters];
    const newStates = [...slotStates];

    newTyped[actualIndex] = targetChar;
    newStates[actualIndex] = LetterSlotStatus.Correct;
    currentWordHelpUsed.current = true;

    let nextIndex = actualIndex + 1;
    while (nextIndex < word.length && !isCurrentWordLetter[nextIndex]) {
      nextIndex++;
    }

    if (nextIndex < word.length) {
      newStates[nextIndex] = LetterSlotStatus.Focused;
      setTypedLetters(newTyped);
      setSlotStates(newStates);
      setCurrentLetterIndex(prev => prev + 1);
      revealedLetterCount.current += 1;
    } else {
      // Complete
      playComplete().catch(() => {});
      hapticWordComplete().catch(() => {});

      // Reduced XP
      let total = isCurrentWordLetter.filter(Boolean).length;
      let xp = GAMEPLAY.XP.CORRECT_WORD;
      if (revealedLetterCount.current + 1 >= total) {
        xp = 0;
      } else {
        if (!currentWordHasMistakes.current) {
          xp += GAMEPLAY.XP.NO_MISTAKES_BONUS;
        }
      }
      onXP(xp, currentWordIndex, {
        hasMistakes: currentWordHasMistakes.current,
        helpUsed: currentWordHelpUsed.current,
      });

      setTypedLetters(newTyped);
      setSlotStates(newStates);
      setTimeout(() => completeCurrentWord(), 0);
    }
  };

  return {
    allWords,
    revealedWords,
    currentWordIndex,
    typedLetters,
    slotStates,
    isCurrentWordLetter,
    currentLetterIndex,

    typeLetter: typeLetterAction,
    backspace: backspaceAction,
    revealLetter: revealLetterAction,
    initializeSentence,
    getCurrentWord: () => allWords[currentWordIndex] || '',
  };
};
