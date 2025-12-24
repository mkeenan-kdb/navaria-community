import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {X} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from './ThemeProvider';
import {spacing, typography, borderRadius} from '@/theme';
import type {Achievement} from '@/types/user';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {getIconComponent} from '@/utils/iconMap';

interface AchievementNotificationProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification: React.FC<
  AchievementNotificationProps
> = ({visible, achievement, onClose}) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      container: {
        position: 'absolute',
        left: spacing.md,
        right: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10000,
        backgroundColor: themeColors.surface,
        borderColor: themeColors.tiontuGold,
      },
      iconContainer: {
        marginRight: spacing.md,
      },
      content: {
        flex: 1,
      },
      label: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold,
        textTransform: 'uppercase',
        marginBottom: 2,
        color: themeColors.tiontuGold,
      },
      title: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold,
        color: themeColors.text.primary,
      },
      closeButton: {
        padding: spacing.xs,
      },
    };
  });

  useEffect(() => {
    if (visible) {
      translateY.value = -200;
      opacity.value = 0;

      // Slide down
      translateY.value = withSpring(0, {damping: 15});
      opacity.value = withTiming(1, {duration: 300});

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        translateY.value = withTiming(-200, {duration: 300});
        opacity.value = withTiming(0, {duration: 300}, () => {
          runOnJS(onClose)();
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, translateY, opacity, onClose]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: translateY.value}],
      opacity: opacity.value,
    };
  });

  if (!visible || !achievement) {
    return null;
  }

  const IconComponent = getIconComponent(achievement.icon);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
        },
        animatedStyle,
      ]}>
      <View style={styles.iconContainer}>
        <IconComponent size={32} color={colors.tiontuGold} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Achievement Unlocked!</Text>
        <Text style={styles.title}>{achievement.title}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <X size={20} color={colors.text.secondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};
