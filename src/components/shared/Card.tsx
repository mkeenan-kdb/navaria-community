import React, {ReactNode} from 'react';
import {ViewStyle, StyleProp} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from './ThemeProvider';
import {spacing, borderRadius, elevation} from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'accent' | 'subtle';
  elevated?: boolean;
  celticBorder?: boolean;
  gradientColors?: string[];
}

export const Card: React.FC<CardProps> = React.memo(
  ({
    children,
    style,
    elevated = true,
    celticBorder = false,
    gradientColors: customGradientColors,
  }) => {
    const {colors} = useTheme();

    // Determine gradient colors based on variant
    // Fallback if gradients are undefined (though they should be defined)
    const gradientColors = customGradientColors ||
      colors.gradients?.card || [colors.surface, colors.surface];

    const getContainerStyle = (): ViewStyle => {
      // Base styles
      const baseStyle: ViewStyle = {
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        // Elevation/Shadow
        ...(elevated ? elevation.md : elevation.none),
      };

      // Variant specific adjustments (if any)
      if (celticBorder) {
        return {
          ...baseStyle,
          borderWidth: 2,
          borderColor: colors.accentBorder,
        };
      }

      return baseStyle;
    };

    return (
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[getContainerStyle(), style]}>
        {children}
      </LinearGradient>
    );
  },
);

Card.displayName = 'Card';
