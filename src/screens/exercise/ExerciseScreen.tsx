import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {
  useTheme,
  AppLoadingSpinner,
  ConfettiSystem,
  Button,
} from '@/components/shared';
import {useUserStore} from '@/stores/userStore';
import {useSettingsStore} from '@/stores/settingsStore';
import {CompletionModal} from '@/components/lesson/CompletionModal';
import {loadExercise} from '@/services/content';
import {getLessonProgress} from '@/services/progress';

import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {ArrowRight} from 'lucide-react-native';
import {supabase} from '@/services/supabase';
import type {Exercise, LessonProgress} from '@/types';
import {TranslationUnit, MatchingGroupUnit, ClozeUnit} from '@/types/content';
import {FloatingXPItem} from '@/components/exercise/FloatingXPItem';
import {useXPAnimation} from '@/hooks/useXPAnimation';
import {useExerciseCompletion} from '@/hooks/useExerciseCompletion';
import {SpeakerSelector} from '@/components/exercise/SpeakerSelector';
import {MatchingPairsExercise} from '@/components/exercise/MatchingPairsExercise';
import {ClozeExercise} from '@/components/exercise/ClozeExercise';
import {StandardExercise} from '@/components/exercise/StandardExercise';
import {useExerciseSession} from '@/hooks/useExerciseSession';
import {ExerciseLayout} from '@/components/exercise/ExerciseLayout';

type LessonRouteProp = RouteProp<
  {params: {lessonId: string; exerciseId: string; totalLessonUnits?: number}},
  'params'
>;

const createExerciseStyles = (themeColors: any) => {
  const common = createCommonStyles(themeColors);
  return {
    ...common,
    safeAreaExtra: {
      backgroundColor: themeColors.background,
    },
    containerExtra: {
      backgroundColor: themeColors.background,
    },
    lessonInfoContainerExtra: {
      gap: spacing.sm,
    } as ViewStyle,
    lessonType: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      letterSpacing: 1,
      color: themeColors.text.secondary,
    } as TextStyle,
    xpContainerExtra: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
      backgroundColor: themeColors.surfaceElevated,
      borderColor: themeColors.border,
      borderWidth: 1,
    } as ViewStyle,
    headerBarExtra: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    } as ViewStyle,
    speakerContainerExtra: {
      gap: spacing.sm,
    } as ViewStyle,
    speakerLabelExtra: {
      color: themeColors.text.secondary,
      fontSize: typography.sizes.sm,
      fontWeight: '500',
    } as TextStyle,
    noAudioTextExtra: {
      color: themeColors.text.tertiary,
      fontSize: typography.sizes.sm,
      fontStyle: 'italic',
    } as TextStyle,
    xpText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      color: themeColors.tiontuGold,
    },
    nextButtonOverlayExtra: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 100,
    } as ViewStyle,
    nextButtonModalExtra: {
      width: '80%',
      maxWidth: 400,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
    } as ViewStyle,
  };
};

export const ExerciseScreen: React.FC = () => {
  const {colors} = useTheme();
  const common = createCommonStyles(colors);
  const navigation = useNavigation();
  const route = useRoute<LessonRouteProp>();
  const {user, profile} = useUserStore();
  const {animationsEnabled, autoProgress} = useSettingsStore();

  const lessonId = route.params?.lessonId;
  const exerciseId = route.params?.exerciseId;
  const totalLessonUnits = route.params?.totalLessonUnits;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage] = useState('Loading...');
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(
    null,
  );
  const [_, setCompletedIds] = useState<Set<string>>(new Set());

  // Track start time for stats
  const [startTime] = useState(Date.now());
  const [finalTimeSpent, setFinalTimeSpent] = useState<number | null>(null);

  const [isUnitComplete, setIsUnitComplete] = useState(false);
  const xpCounterRef = useRef<View>(null);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(
    null,
  );
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [lastWordStats, setLastWordStats] = useState({
    hasMistakes: false,
    helpUsed: false,
  });

  // Session State
  const [sessionXPEarned, setSessionXPEarned] = useState(0);

  // Completion Hook
  const {
    showCompletionModal,
    completionData,
    showConfetti,
    handleLessonComplete,
  } = useExerciseCompletion({
    user,
    profile,
    exercise,
    exerciseId,
    lessonId,
    lessonProgress,
    totalLessonUnits,
    getSessionStats: () => ({
      mistakes: mistakeCount,
      sessionXP: sessionXPEarned,
    }),
  });

  // Session Hook (initialized with empty units initially)
  const {
    currentUnit,
    currentIndex,
    totalUnits,
    progress,
    isSessionComplete,
    submitResult,
    next,
    mistakeCount,
    correctCount,
  } = useExerciseSession({
    units: exercise?.units || [],
    onComplete: () => {
      setFinalTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      handleLessonComplete();
    },
  });

  // Load Logic
  useEffect(() => {
    const load = async () => {
      if (!user || !exerciseId) {
        return;
      }
      setLoading(true);
      try {
        const ex = await loadExercise(exerciseId);
        if (!ex) {
          navigation.goBack();
          return;
        }

        setExercise(ex);

        // Extract unique speaker IDs from audio data and fetch speaker details
        const allSpeakerIds = new Set<string>();
        ex.units?.forEach((unit: any) => {
          if (unit.metadata?.audio && Array.isArray(unit.metadata.audio)) {
            unit.metadata.audio.forEach((a: any) => {
              if (a.speakerId) {
                allSpeakerIds.add(a.speakerId);
              }
            });
          }
        });

        if (allSpeakerIds.size > 0) {
          // Fetch speaker details from database
          const {data: speakerData} = await supabase
            .from('speakers')
            .select('*')
            .in('id', Array.from(allSpeakerIds));
          if (speakerData) {
            // Map database fields to component interface
            const mappedSpeakers = speakerData.map((s: any) => ({
              id: s.id,
              name: s.display_name || s.name, // Use display_name, fallback to name
              profilePictureUrl: s.profile_image_url, // Map to expected prop name
            }));
            setSpeakers(mappedSpeakers);
            // Auto-select first speaker if none selected
            if (!selectedSpeakerId && mappedSpeakers.length > 0) {
              setSelectedSpeakerId(mappedSpeakers[0].id);
            }
          }
        }

        // Load Progress
        if (lessonId && ex.lesson?.courseId) {
          const prog = await getLessonProgress(
            user.id,
            lessonId,
            ex.lesson.courseId,
          );
          setLessonProgress(prog);
          if (prog?.completedUnitIds) {
            setCompletedIds(new Set(prog.completedUnitIds));
            // Note: useExerciseSession doesn't support "starting from index" yet easily,
            // but we could implement it. For now, we start from 0 or filter?
            // The new architecture assumes we iterate all, but maybe skip completed?
            // Ideally we skip them.
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [exerciseId, lessonId, user, navigation, selectedSpeakerId]);

  // Compute speakers that have recordings for the current unit
  const currentUnitSpeakers = React.useMemo(() => {
    if (
      !currentUnit?.metadata?.audio ||
      !Array.isArray(currentUnit.metadata.audio)
    ) {
      return [];
    }
    const speakerIdsWithAudio = new Set(
      currentUnit.metadata.audio
        .filter((a: any) => a.speakerId && a.url)
        .map((a: any) => a.speakerId),
    );
    return speakers.filter(s => speakerIdsWithAudio.has(s.id));
  }, [currentUnit, speakers]);

  // Check if current unit has speaker-based audio recordings
  const hasAudio = currentUnitSpeakers.length > 0;

  // XP Animations
  const {xpOpacity, xpScale, floatingXPs, setXpLayout, displayedXP} =
    useXPAnimation(
      sessionXPEarned,
      lastWordStats.hasMistakes,
      lastWordStats.helpUsed,
      animationsEnabled,
      xpCounterRef,
      (exercise?.type as any) || 'standard',
    );

  const styles = useThemedStyles(createExerciseStyles);

  // Handle Unit Completion
  const handleUnitComplete = useCallback(async () => {
    if (!currentUnit || !user || !exercise || !lessonId) {
      return;
    }

    // Report to Session
    submitResult(true);

    // Track completed unit locally during session
    // (Permanent progress is written via SUBMIT_EXERCISE when the entire exercise completes)
    const unitId = currentUnit.id;
    setCompletedIds(prev => new Set(prev).add(unitId));

    setIsUnitComplete(true);

    if (autoProgress) {
      setTimeout(() => {
        if (!isSessionComplete) {
          next();
          setIsUnitComplete(false);
        }
      }, 300);
    }
  }, [
    currentUnit,
    user,
    exercise,
    lessonId,
    submitResult,
    next,
    isSessionComplete,
    autoProgress,
  ]);

  const handleManualNext = () => {
    next();
    setIsUnitComplete(false);
  };

  // Measure XP Layout
  const handleXPLayout = useCallback(() => {
    xpCounterRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && x >= 0 && y >= 0) {
        setXpLayout({x, y, width, height});
      }
    });
  }, [setXpLayout]);

  // Initial measure fallback
  useEffect(() => {
    if (!loading && exercise) {
      setTimeout(handleXPLayout, 500);
    }
  }, [loading, exercise, handleXPLayout]);

  const addXP = (
    amount: number,
    wordIndex?: number,
    stats?: {hasMistakes: boolean; helpUsed: boolean},
  ) => {
    if (stats) {
      setLastWordStats(stats);
    }
    setSessionXPEarned(prev => prev + amount);
  };

  // Determine unit label based on exercise type
  const getUnitLabel = () => {
    if (!currentUnit) {
      return 'Sentence';
    }
    switch (currentUnit.unitType) {
      case 'matching_group':
        return 'Group';
      case 'sentence':
      case 'cloze':
      default:
        return 'Sentence';
    }
  };

  if (loading) {
    return <AppLoadingSpinner message={loadingMessage} />;
  }
  if (!exercise) {
    return null;
  }

  return (
    <SafeAreaView
      style={[common.flex1, styles.safeAreaExtra]}
      edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={common.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ExerciseLayout
          title={exercise.title}
          totalUnits={totalUnits}
          completedCount={
            isSessionComplete ? totalUnits : Math.floor(progress * totalUnits)
          }
          currentIndex={currentIndex}
          // Fix standard prop duplication
          onClose={() => navigation.goBack()}
          showExerciseSettings={true}
          unitLabel={getUnitLabel()}>
          <View style={[common.flex1, styles.containerExtra]}>
            {/* Speaker & XP Info Bar */}
            <View style={[common.rowBetween, styles.headerBarExtra]}>
              {/* Left side: Speaker Selector or No Audio message */}
              <View style={[common.row, styles.speakerContainerExtra]}>
                {hasAudio ? (
                  <>
                    <Text style={styles.speakerLabelExtra}>Speaker:</Text>
                    <SpeakerSelector
                      speakers={currentUnitSpeakers}
                      selectedSpeakerId={selectedSpeakerId}
                      onSelectSpeaker={setSelectedSpeakerId}
                    />
                  </>
                ) : (
                  <Text style={styles.noAudioTextExtra}>No sentence audio</Text>
                )}
              </View>

              {/* Right side: XP Counter */}
              <Animated.View
                ref={xpCounterRef}
                style={[
                  common.row,
                  styles.xpContainerExtra,
                  {transform: [{scale: xpScale}], opacity: xpOpacity},
                ]}
                onLayout={handleXPLayout}>
                <Text style={styles.xpText}>+{displayedXP} XP</Text>
              </Animated.View>
            </View>

            {currentUnit?.unitType === 'matching_group' ? (
              <MatchingPairsExercise
                unit={currentUnit as MatchingGroupUnit}
                onComplete={handleUnitComplete}
                onXP={addXP}
              />
            ) : currentUnit?.unitType === 'cloze' ? (
              <ClozeExercise
                unit={currentUnit as ClozeUnit}
                onComplete={handleUnitComplete}
                onXP={addXP}
                selectedSpeakerId={selectedSpeakerId}
              />
            ) : currentUnit?.unitType === 'sentence' ? (
              <StandardExercise
                unit={currentUnit as TranslationUnit}
                onSentenceComplete={handleUnitComplete}
                onXP={addXP}
                onMistake={() => submitResult(false)}
                isActive={!isUnitComplete}
                selectedSpeakerId={selectedSpeakerId}
              />
            ) : (
              <View>
                <Text>Unknown Unit Type</Text>
              </View>
            )}
          </View>

          {/* Manual Next Button Overlay */}
          {!autoProgress && isUnitComplete && !isSessionComplete && (
            <View style={[common.centered, styles.nextButtonOverlayExtra]}>
              <View style={styles.nextButtonModalExtra}>
                <Button
                  title="Next"
                  onPress={handleManualNext}
                  variant="primary"
                  size="lg"
                  rightIcon={ArrowRight}
                  style={common.fullWidth}
                />
              </View>
            </View>
          )}

          {animationsEnabled && (
            <ConfettiSystem active={showConfetti} duration={4000} />
          )}
          <CompletionModal
            visible={showCompletionModal}
            xpEarned={completionData?.xpEarned || 0}
            accuracy={
              correctCount + mistakeCount > 0
                ? (correctCount / (correctCount + mistakeCount)) * 100
                : 100
            }
            mistakes={mistakeCount}
            timeSpentSeconds={
              finalTimeSpent || Math.floor((Date.now() - startTime) / 1000)
            }
            perfectBonus={mistakeCount === 0}
            onContinue={() => navigation.goBack()}
            onReturnToCourse={() => navigation.goBack()}
          />
        </ExerciseLayout>

        {/* XP Animations - positioned at root level for correct window coordinates */}
        {floatingXPs.map(xp => (
          <FloatingXPItem key={xp.id} floatingXP={xp} />
        ))}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
