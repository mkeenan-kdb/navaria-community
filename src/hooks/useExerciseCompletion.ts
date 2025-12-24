import {useState, useCallback, useRef} from 'react';
import {playLessonComplete} from '@/services/audio';
import {hapticCompletion} from '@/services/haptics';
import {addToQueue} from '@/services/syncQueue';
import type {Exercise, LessonProgress} from '@/types';

interface UseExerciseCompletionProps {
  user: any;
  profile: any;
  exercise: Exercise | null;
  exerciseId: string;
  lessonId: string;
  lessonProgress: LessonProgress | null;
  totalLessonUnits?: number;
  getSessionStats: () => {mistakes: number; sessionXP: number};
}

export const useExerciseCompletion = ({
  user,
  profile: _profile,
  exercise,
  exerciseId,
  lessonId,
  lessonProgress,
  totalLessonUnits,
  getSessionStats,
}: UseExerciseCompletionProps) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    xpEarned: number;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const lessonCompletedRef = useRef(false);

  const handleLessonComplete = useCallback(async () => {
    if (
      !user ||
      !exercise ||
      !exerciseId ||
      !lessonId ||
      lessonCompletedRef.current
    ) {
      return;
    }

    lessonCompletedRef.current = true;

    try {
      // Get final stats
      const sessionStats = getSessionStats();
      const totalUnits =
        exercise?.units?.length || exercise?.sentenceCount || 0;

      // Calculate score based on mistakes vs total units
      // Base score: 100% - (mistakes / total * 100%)
      const calculatedScore = Math.max(
        0,
        Math.round(((totalUnits - sessionStats.mistakes) / totalUnits) * 100),
      );

      const finalStats = {
        ...sessionStats,
        score: calculatedScore,
      };

      // Play completion feedback
      playLessonComplete();
      hapticCompletion();

      // Trigger Confetti immediately
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);

      // Calculate XP to match backend: sessionXP + completionBonus
      // Backend formula: completionBonus = Math.min(50, completionCount * 5)
      const completionBonus = Math.min(
        50,
        (lessonProgress?.completionCount || 0) * 5,
      );
      const xpEarned = (sessionStats.sessionXP || 0) + completionBonus;

      // Show modal immediately
      setCompletionData({
        xpEarned,
      });
      setShowCompletionModal(true);

      // Queue the sync in background (don't await)
      addToQueue(
        'SUBMIT_EXERCISE',
        {
          userId: user.id,
          lessonId,
          courseId: exercise?.lesson?.courseId || '',
          exerciseId,
          totalUnits: totalLessonUnits || 1,
          stats: finalStats,
        },
        async () => {
          // Refresh user profile after sync completes
          const {useUserStore} = await import('@/stores/userStore');
          useUserStore.getState().loadProfile(user.id);
        },
      );
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  }, [
    user,
    exercise,
    exerciseId,
    lessonId,
    lessonProgress,
    totalLessonUnits,
    getSessionStats,
  ]);

  return {
    showCompletionModal,
    setShowCompletionModal,
    completionData,
    showConfetti,
    handleLessonComplete,
    lessonCompletedRef,
  };
};
