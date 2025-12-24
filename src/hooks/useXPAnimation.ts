import { useRef, useState, useCallback, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { useTheme } from '@/components/shared';

interface FloatingXP {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  delay: number;
  xp: number;
  targetLayout: { x: number; y: number; width: number; height: number };
}

interface XPMessage {
  text: string;
  color: string;
  delay?: number;
  xp: number;
}

export const useXPAnimation = (
  sessionXP: number,
  currentWordHasMistakes: boolean,
  currentWordHelpUsed: boolean,
  animationsEnabled: boolean = true,
  xpRef?: React.RefObject<any>,
  exerciseType: 'standard' | 'matching_pairs' | 'cloze' = 'standard',
) => {
  const { colors } = useTheme();

  // Animation values
  const xpOpacity = useRef(new Animated.Value(1)).current;
  const xpScale = useRef(new Animated.Value(1)).current;
  const prevXP = useRef(0);
  const prevWordHasMistakes = useRef(false);
  const prevWordHelpUsed = useRef(false);

  // Floating XP state
  const [floatingXPs, setFloatingXPs] = useState<FloatingXP[]>([]);
  const [displayedXP, setDisplayedXP] = useState(sessionXP);

  const [xpLayout, setXpLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Function to measure XP counter layout (end position)
  const measureXpLayout = useCallback(() => {
    return new Promise<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(resolve => {
      if (!xpRef?.current) {
        resolve(null);
        return;
      }

      xpRef.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            resolve({ x, y, width, height });
          } else {
            resolve(null);
          }
        },
      );
    });
  }, [xpRef]);

  const triggerXPFloat = useCallback(
    async (messages: XPMessage[]) => {
      if (!animationsEnabled) {
        // If animations disabled, just update displayed XP immediately
        const totalNewXP = messages.reduce((acc, msg) => acc + msg.xp, 0);
        setDisplayedXP(prev => prev + totalNewXP);
        return;
      }

      // Measure XP counter layout for end position
      const currentXpLayout = await measureXpLayout();
      const effectiveXpLayout = currentXpLayout || xpLayout;

      if (!effectiveXpLayout || effectiveXpLayout.width === 0) {
        // Fallback if layout not ready or invalid
        const totalNewXP = messages.reduce((acc, msg) => acc + msg.xp, 0);
        setDisplayedXP(prev => prev + totalNewXP);
        return;
      }

      // Use lastClickPosition from exerciseStore - each exercise sets this when XP is earned
      const { useExerciseStore } = require('@/stores/exerciseStore');
      const lastClick = useExerciseStore.getState().lastClickPosition;

      const window = Dimensions.get('window');
      const startX = lastClick?.x ?? window.width / 2;
      const startY = lastClick?.y ?? window.height / 2;

      const newFloatingXPs = messages.map((msg, index) => ({
        id: Date.now() + index, // Ensure unique ID even in tight loop
        x: startX,
        y: startY,
        text: msg.text,
        color: msg.color,
        delay: msg.delay || index * 200,
        xp: msg.xp,
        targetLayout: effectiveXpLayout, // Store the target layout with each XP
      }));

      setFloatingXPs(prev => [...prev, ...newFloatingXPs]);

      // Schedule XP updates when animations "land"
      // Use timing that matches when the XP visually lands (around 80-90% through the animation)
      newFloatingXPs.forEach(xpItem => {
        const timer = setTimeout(() => {
          setDisplayedXP(prev => prev + xpItem.xp);

          // Trigger the XP counter bump animation exactly when the XP lands
          Animated.sequence([
            Animated.parallel([
              Animated.timing(xpScale, {
                toValue: 1.5,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(xpOpacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(xpScale, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }, xpItem.delay + 700); // 700ms - when XP visually lands (before fade out)

        return () => clearTimeout(timer);
      });

      // Remove after animation completes
      const cleanupTimer = setTimeout(
        () => {
          setFloatingXPs(prev =>
            prev.filter(xp => !newFloatingXPs.find(n => n.id === xp.id)),
          );
        },
        3000 + messages.length * 600,
      );

      return () => clearTimeout(cleanupTimer);
    },
    [xpLayout, animationsEnabled, xpScale, xpOpacity, measureXpLayout],
  );

  // Memoize color values to prevent unnecessary re-renders
  const successColor = useRef(colors.success).current;
  const infoColor = useRef(colors.info).current;
  const warningColor = useRef(colors.warning).current;
  const secondaryTextColor = useRef(colors.text.secondary).current;

  useEffect(() => {
    if (sessionXP > prevXP.current) {
      const xpEarned = sessionXP - prevXP.current;

      if (xpEarned > 0) {
        const messages: XPMessage[] = [];

        // Dynamic messages based on exercise type
        if (exerciseType === 'matching_pairs') {
          messages.push({
            text: 'Match!',
            color: successColor,
            delay: 0,
            xp: xpEarned,
          });
        } else if (exerciseType === 'cloze') {
          messages.push({
            text: 'Correct!',
            color: successColor,
            delay: 0,
            xp: xpEarned,
          });
        } else {
          // Standard exercise - show detailed breakdown
          const isPerfect = !currentWordHasMistakes; // Use prop directly
          const noHelp = !currentWordHelpUsed; // Use prop directly

          messages.push({
            text: 'Word complete',
            color: successColor,
            delay: 0,
            xp: 5, // Base XP
          });

          if (isPerfect) {
            messages.push({
              text: 'No mistakes',
              color: infoColor,
              delay: 300,
              xp: 2,
            });
          }

          if (noHelp) {
            messages.push({
              text: 'No help',
              color: warningColor,
              delay: 600,
              xp: 2,
            });
          }
        }

        triggerXPFloat(messages);
      }
    }
    prevXP.current = sessionXP;
    prevWordHasMistakes.current = currentWordHasMistakes;
    prevWordHelpUsed.current = currentWordHelpUsed;
  }, [
    sessionXP,
    currentWordHasMistakes,
    currentWordHelpUsed,
    xpLayout,
    triggerXPFloat,
    animationsEnabled,
    successColor,
    infoColor,
    warningColor,
    secondaryTextColor,
    exerciseType,
  ]);

  return {
    xpOpacity,
    xpScale,
    floatingXPs,
    xpRef,
    setXpLayout,
    xpLayout,
    displayedXP,
  };
};
