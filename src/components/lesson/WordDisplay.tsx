import React, {useEffect, useRef, useCallback, memo} from 'react';
import {View, Text, TouchableOpacity, Animated, StyleSheet} from 'react-native';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {spacing, borderRadius, typography} from '@/theme';
import {ANIMATION} from '@/constants';
import {LetterSlotStatus} from '@/types';
import {LetterSlot} from './LetterSlot';

interface WordDisplayProps {
  word: string;
  typedLetters: (string | null)[];
  slotStates: LetterSlotStatus[];
  isCurrentWordLetter: boolean[];
  fontFamily: string;
  onLayout?: (layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  animationsEnabled: boolean;
  onPress?: () => void;
  onRef?: (ref: View | null) => void;
}

export const WordDisplay: React.FC<WordDisplayProps> = memo(
  ({
    word,
    typedLetters,
    slotStates,
    isCurrentWordLetter,
    fontFamily,
    onLayout,
    animationsEnabled,
    onPress,
    onRef,
  }) => {
    const styles = useThemedStyles(themeColors => ({
      currentWordBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        backgroundColor: themeColors.border,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'transparent', // Base border is transparent
        borderRadius: borderRadius.md,
        marginHorizontal: spacing.xs,
        minHeight: 50,
        position: 'relative', // For absolute positioning of overlay
      },
      borderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 3,
        borderStyle: 'dashed',
        borderColor: themeColors.primary,
        borderRadius: borderRadius.md,
        pointerEvents: 'none', // Don't block touches
      },
      inlinePunctuation: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.normal,
        marginHorizontal: 2,
        color: themeColors.text.primary,
      },
    }));

    const opacityAnim = useRef(new Animated.Value(0)).current;
    const viewRef = useRef<View>(null);

    const handleLayout = useCallback(() => {
      viewRef.current?.measureInWindow((x, y, width, height) => {
        onLayout?.({x, y, width, height});
      });
    }, [onLayout]);

    useEffect(() => {
      // Register ref
      onRef?.(viewRef.current);
    }, [onRef]);

    // Measure immediately on mount and when word changes
    useEffect(() => {
      // Reduced delay for better responsiveness
      const timer = setTimeout(handleLayout, 16); // ~1 frame at 60fps
      return () => clearTimeout(timer);
    }, [word, handleLayout]);

    useEffect(() => {
      if (!animationsEnabled) {
        opacityAnim.setValue(0);
        return;
      }

      // Flash border animation using opacity
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: ANIMATION.DURATION.VERY_SLOW,
            useNativeDriver: true, // Now we can use native driver!
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: ANIMATION.DURATION.VERY_SLOW,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, [opacityAnim, animationsEnabled]);

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View
          ref={viewRef}
          onLayout={handleLayout}
          style={styles.currentWordBox}>
          {/* Animated Border Overlay */}
          <Animated.View
            style={[styles.borderOverlay, {opacity: opacityAnim}]}
          />

          {word.split('').map((char, charIndex) => {
            const isLetter = isCurrentWordLetter[charIndex];
            const status = slotStates[charIndex];
            const typedChar = typedLetters[charIndex];

            if (!isLetter) {
              // Punctuation within word
              return (
                <Text
                  key={charIndex}
                  style={[styles.inlinePunctuation, {fontFamily}]}>
                  {char}
                </Text>
              );
            }

            return (
              <LetterSlot
                key={charIndex}
                char={typedChar}
                status={status}
                fontFamily={fontFamily}
                animationsEnabled={animationsEnabled}
              />
            );
          })}
        </View>
      </TouchableOpacity>
    );
  },
);

WordDisplay.displayName = 'WordDisplay';
