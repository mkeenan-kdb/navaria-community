import React, {ReactNode} from 'react';
import {View, Text, ViewStyle} from 'react-native';
import {useTheme} from './ThemeProvider';
import {spacing, borderRadius, typography} from '@/theme';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = React.memo(
  ({children, variant = 'default', size = 'md', style}) => {
    const {colors} = useTheme();

    const getVariantStyle = (): ViewStyle => {
      const variants: Record<string, ViewStyle> = {
        default: {
          backgroundColor: colors.secondary + '20',
        },
        success: {
          backgroundColor: colors.success + '20',
        },
        warning: {
          backgroundColor: colors.warning + '20',
        },
        error: {
          backgroundColor: colors.error + '20',
        },
        info: {
          backgroundColor: colors.info + '20',
        },
      };
      return variants[variant];
    };

    const getTextColor = (): string => {
      const textColors: Record<string, string> = {
        default: colors.secondary,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
      };
      return textColors[variant];
    };

    const sizeStyles = {
      sm: {padding: spacing.xs, fontSize: typography.sizes.xs},
      md: {padding: spacing.sm, fontSize: typography.sizes.sm},
    };

    return (
      <View
        style={[
          {
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            alignSelf: 'flex-start',
          },
          getVariantStyle(),
          style,
        ]}>
        <Text
          style={{
            color: getTextColor(),
            fontSize: sizeStyles[size].fontSize,
            fontWeight: typography.weights.semibold,
          }}>
          {children}
        </Text>
      </View>
    );
  },
);
