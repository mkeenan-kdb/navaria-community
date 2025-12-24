import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, Image, Platform} from 'react-native';
import {useTheme} from './ThemeProvider';
import {spacing, typography} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface AppLoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export const AppLoadingSpinner: React.FC<AppLoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'large',
}) => {
  const {colors, isDark} = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: themeColors.surface,
      },
      logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: spacing.lg,
      },
      rotatingBorder: {
        position: 'absolute',
        borderWidth: 4,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
      },
      logoWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      logo: {
        opacity: 0.9,
      },
      message: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        textAlign: 'center',
        marginTop: spacing.md,
        color: themeColors.text.secondary,
      },
    };
  });

  useEffect(() => {
    const startRotation = () => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ).start();
    };

    startRotation();
  }, [rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const logoSize = size === 'large' ? 90 : 70;
  const containerSize = size === 'large' ? 120 : 90;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoContainer,
          {width: containerSize, height: containerSize},
        ]}>
        {/* Rotating border */}
        <Animated.View
          style={[
            styles.rotatingBorder,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              borderColor: colors.primary,
              transform: [{rotate: rotation}],
            },
          ]}
        />

        {/* Logo */}
        <View
          style={[
            styles.logoWrapper,
            {width: logoSize, height: logoSize, borderRadius: logoSize / 2},
          ]}>
          <Image
            source={
              isDark
                ? require('../../../assets/images/app_logo_circular_original_darkmode_180.png')
                : require('../../../assets/images/app_logo_circular_original_lightmode_180.png')
            }
            style={[
              styles.logo,
              {width: logoSize, height: logoSize, borderRadius: logoSize / 2},
            ]}
            resizeMode="cover"
            fadeDuration={0}
          />
        </View>
      </View>

      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};
