import React, {useCallback} from 'react';
import {View, TouchableOpacity, ViewStyle} from 'react-native';
import {Volume2, Turtle} from 'lucide-react-native';
import {playUrl} from '@/services/audio';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {spacing, borderRadius, sizes, opacity} from '@/theme';
import {ThemeColors} from '@/theme/colors';
import {createCommonStyles} from '@/theme/commonStyles';
import {useTheme} from './ThemeProvider';

interface AudioControlGroupProps {
  audioUrl?: string; // If provided, component handles playback
  onPlay?: (speed: number) => void; // Optional override/custom handler
  showSlowButton?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  button: {
    width: sizes.icon.lg,
    height: sizes.icon.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
  } as ViewStyle,
  buttonSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  } as ViewStyle,
  buttonDisabled: {
    opacity: opacity.disabled,
  } as ViewStyle,
});

export const AudioControlGroup: React.FC<AudioControlGroupProps> = React.memo(
  ({audioUrl, onPlay, showSlowButton = true, disabled = false, style}) => {
    const {colors} = useTheme();
    const styles = useThemedStyles(createStyles);
    const common = createCommonStyles(colors);

    const handlePlay = useCallback(
      (speed: number) => {
        if (disabled) {
          return;
        }

        if (onPlay) {
          onPlay(speed);
        } else if (audioUrl) {
          playUrl(audioUrl, 1.0, speed);
        }
      },
      [audioUrl, disabled, onPlay],
    );

    // If no functionality provided, don't render
    if (!audioUrl && !onPlay) {
      return null;
    }

    return (
      <View style={[styles.container, style]}>
        {/* Normal Speed Button */}
        <TouchableOpacity
          style={[
            common.centered,
            styles.button,
            disabled && styles.buttonDisabled,
          ]}
          onPress={() => handlePlay(1.0)}
          disabled={disabled}
          activeOpacity={opacity.hover}
          accessibilityRole="button"
          accessibilityLabel="Play audio at normal speed">
          <Volume2 size={sizes.icon.sm} color={colors.white} />
        </TouchableOpacity>

        {/* Slow Speed Button */}
        {showSlowButton && (
          <TouchableOpacity
            style={[
              common.centered,
              styles.button,
              styles.buttonSecondary,
              disabled && styles.buttonDisabled,
            ]}
            onPress={() => handlePlay(0.75)}
            disabled={disabled}
            activeOpacity={opacity.hover}
            accessibilityRole="button"
            accessibilityLabel="Play audio at slow speed">
            <Turtle size={sizes.icon.sm} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

AudioControlGroup.displayName = 'AudioControlGroup';
