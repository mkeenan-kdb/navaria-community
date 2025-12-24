import React from 'react';
import {View, Text, TouchableOpacity, ViewStyle} from 'react-native';
import {LucideIcon} from 'lucide-react-native';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {useTheme} from '@/components/shared/ThemeProvider';
import {spacing, typography, sizes, opacity} from '@/theme';
import {ThemeColors} from '@/theme/colors';

interface AchievementBadgeProps {
  icon: LucideIcon;
  color: string;
  title: string;
  isUnlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  showTitle?: boolean;
  style?: ViewStyle;
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  iconContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconContainerLocked: {
    opacity: opacity.disabled,
  },
  title: {
    fontSize: typography.sizes.xs,
    textAlign: 'center' as const,
    color: colors.text.primary,
  },
  titleLocked: {
    color: colors.text.tertiary,
  },
});

export const AchievementBadge: React.FC<AchievementBadgeProps> = React.memo(
  ({
    icon: Icon,
    color,
    title,
    isUnlocked,
    size = 'md',
    onPress,
    showTitle = true,
    style,
  }) => {
    const styles = useThemedStyles(createStyles);
    const {colors} = useTheme();

    const iconSize =
      size === 'sm'
        ? sizes.icon.md
        : size === 'md'
          ? sizes.icon.lg
          : sizes.icon.xl;
    const containerSize = size === 'sm' ? 40 : size === 'md' ? 56 : 72;
    const containerRadius = size === 'sm' ? 20 : size === 'md' ? 28 : 36;

    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title} achievement, ${isUnlocked ? 'unlocked' : 'locked'} `}
        accessibilityState={{disabled: !isUnlocked}}>
        <View
          style={[
            styles.iconContainer,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerRadius,
              backgroundColor: color,
            },
            !isUnlocked && styles.iconContainerLocked,
          ]}>
          <Icon size={iconSize} color={colors.white} />
        </View>
        {showTitle && (
          <Text style={[styles.title, !isUnlocked && styles.titleLocked]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  },
);

AchievementBadge.displayName = 'AchievementBadge';
