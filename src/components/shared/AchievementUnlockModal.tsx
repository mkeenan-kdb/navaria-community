import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {useTheme} from './ThemeProvider';
import {spacing, typography, borderRadius} from '@/theme';
import {ConfettiSystem} from './ConfettiSystem';
import type {Achievement} from '@/types/user';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {getIconComponent} from '@/utils/iconMap';

interface AchievementUnlockModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

const {width} = Dimensions.get('window');

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  visible,
  achievement,
  onClose,
}) => {
  const {colors} = useTheme();
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999, // Ensure it sits on top of everything
        elevation: 9999, // Android elevation
      },
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // High contrast dark overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
      },
      card: {
        width: width * 0.85,
        borderRadius: borderRadius.xl, // Slightly rounder for modern look
        padding: spacing.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8}, // Deeper shadow
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        backgroundColor: themeColors.surfaceElevated,
        borderWidth: 1,
        borderColor: themeColors.border,
      },
      header: {
        marginBottom: spacing.lg,
      },
      headerText: {
        fontSize: typography.sizes.sm, // Slightly smaller, cleaner
        fontWeight: typography.weights.bold,
        textTransform: 'uppercase',
        letterSpacing: 2, // Wider spacing for "premium" feel
        color: themeColors.tiontuGold,
      },
      iconContainer: {
        marginBottom: spacing.xl, // More breathing room
        padding: spacing.xl,
        borderRadius: borderRadius.full,
        backgroundColor: themeColors.background, // Use background instead of custom opacity for cleaner look
        borderWidth: 2,
        borderColor: themeColors.tiontuGold, // Gold border for achievement
        shadowColor: themeColors.tiontuGold,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.2, // Subtle glow
        shadowRadius: 10,
        elevation: 4,
      },
      title: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        marginBottom: spacing.sm,
        textAlign: 'center',
        fontFamily: typography.fonts.celtic,
        color: themeColors.text.primary,
      },
      description: {
        fontSize: typography.sizes.base,
        textAlign: 'center',
        marginBottom: spacing['2xl'], // More space before button
        lineHeight: 24,
        color: themeColors.text.secondary,
      },
      button: {
        width: '100%',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full, // Pill shape is more modern
        alignItems: 'center',
        backgroundColor: themeColors.primary,
        shadowColor: themeColors.primary,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
      buttonText: {
        color: themeColors.white,
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.bold,
        letterSpacing: 0.5,
      },
    };
  });

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      rotate.value = 0;
      opacity.value = 0;

      // Smooth fade in
      opacity.value = withTiming(1, {duration: 300});

      // Gentler scale animation with higher damping (less bouncy)
      scale.value = withSequence(
        withSpring(1.05, {damping: 20, stiffness: 150}),
        withSpring(1, {damping: 25, stiffness: 200}),
      );

      // Subtle single shake instead of aggressive back-and-forth
      rotate.value = withDelay(
        200,
        withSequence(
          withTiming(8, {duration: 100}),
          withTiming(-8, {duration: 100}),
          withTiming(0, {duration: 150}),
        ),
      );
    }
  }, [visible, scale, rotate, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}, {rotate: `${rotate.value}deg`}],
      opacity: opacity.value,
    };
  });

  if (!visible || !achievement) {
    return null;
  }

  const IconComponent = getIconComponent(achievement.icon);

  return (
    <View style={[styles.container, {pointerEvents: 'auto'}]}>
      <View style={styles.overlay}>
        <ConfettiSystem active={visible} duration={3000} />

        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Achievement Unlocked!</Text>
          </View>

          <View style={styles.iconContainer}>
            <IconComponent size={80} color={colors.tiontuGold} />
          </View>

          <Text style={styles.title}>{achievement.title}</Text>

          <Text style={styles.description}>{achievement.description}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};
