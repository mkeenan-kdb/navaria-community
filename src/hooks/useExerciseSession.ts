import {useState, useCallback, useMemo} from 'react';
import {ExerciseUnit} from '@/types/content';

interface UseExerciseSessionProps {
  units: ExerciseUnit[];
  onComplete?: (results: SessionResults) => void;
}

export interface SessionResults {
  correctCount: number;
  mistakeCount: number;
  timeSpentMs: number;
}

export const useExerciseSession = ({
  units,
  onComplete,
}: UseExerciseSessionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const currentUnit = useMemo(() => units[currentIndex], [units, currentIndex]);
  const progress =
    units.length > 0
      ? isSessionComplete
        ? 1 // 100% when session is complete
        : currentIndex / units.length
      : 0;

  const submitResult = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setMistakeCount(prev => prev + 1);
    }
  }, []);

  const next = useCallback(() => {
    if (currentIndex < units.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsSessionComplete(true);
      if (onComplete) {
        onComplete({
          correctCount,
          mistakeCount,
          timeSpentMs: Date.now() - startTime,
        });
      }
    }
  }, [
    currentIndex,
    units.length,
    onComplete,
    correctCount,
    mistakeCount,
    startTime,
  ]);

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setMistakeCount(0);
    setCorrectCount(0);
    setIsSessionComplete(false);
  }, []);

  return {
    currentUnit,
    currentIndex,
    totalUnits: units.length,
    progress,
    isSessionComplete,
    mistakeCount,
    correctCount,
    submitResult,
    next,
    previous,
    restart,
  };
};
