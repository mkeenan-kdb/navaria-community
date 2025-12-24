import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {useTheme} from './ThemeProvider';
import {spacing, borderRadius, opacity} from '@/theme';
import type {LucideIcon} from 'lucide-react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = React.memo(
  ({
    onPress,
    title,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
  }) => {
    const {colors} = useTheme();

    const getButtonStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
      };

      // Size styles
      const sizeStyles: Record<string, ViewStyle> = {
        sm: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: 36,
        },
        md: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 44,
        },
        lg: {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          minHeight: 52,
        },
      };

      // Variant styles - subtle Celtic accent
      const variantStyles: Record<string, ViewStyle> = {
        primary: {
          backgroundColor: colors.primary,
          borderBottomWidth: 2,
          borderBottomColor: colors.accentKnot,
        },
        secondary: {
          backgroundColor: colors.secondary,
          borderBottomWidth: 2,
          borderBottomColor: colors.accentKnot,
        },
        outline: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        ghost: {
          backgroundColor: 'transparent',
        },
      };

      return {
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(disabled && {opacity: opacity.disabled}),
      };
    };

    const getTextStyle = (): TextStyle => {
      const sizeStyles: Record<string, TextStyle> = {
        sm: {fontSize: 14},
        md: {fontSize: 16},
        lg: {fontSize: 18},
      };

      const variantStyles: Record<string, TextStyle> = {
        primary: {color: colors.white, fontWeight: '600'},
        secondary: {color: colors.white, fontWeight: '600'},
        outline: {color: colors.primary, fontWeight: '600'},
        ghost: {color: colors.text.primary, fontWeight: '500'},
      };

      return {
        textAlign: 'center',
        ...sizeStyles[size],
        ...variantStyles[variant],
      };
    };

    const getIconColor = () => {
      const computedStyle = getTextStyle();
      return computedStyle.color as string;
    };

    const iconSize = size === 'sm' ? 16 : 20;

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyle(), style]}
        activeOpacity={opacity.pressed}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{disabled: disabled || loading, busy: loading}}>
        {loading ? (
          <ActivityIndicator
            color={
              variant === 'outline' || variant === 'ghost'
                ? colors.primary
                : colors.white
            }
          />
        ) : (
          <>
            {LeftIcon && <LeftIcon size={iconSize} color={getIconColor()} />}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            {RightIcon && <RightIcon size={iconSize} color={getIconColor()} />}
          </>
        )}
      </TouchableOpacity>
    );
  },
);

Button.displayName = 'Button';
