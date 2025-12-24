import React from 'react';
import {Animated, Text, Easing, View} from 'react-native';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface FloatingXPItemProps {
  floatingXP: {
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
    delay: number;
    xp: number;
    targetLayout: {x: number; y: number; width: number; height: number};
  };
}

export const FloatingXPItem: React.FC<FloatingXPItemProps> = ({floatingXP}) => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const [shouldAnimate, setShouldAnimate] = React.useState(false);

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      floatingXP: {
        // Position handled by parent Animated.View
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#2e74ffff',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.8,
        shadowRadius: 9,
        // Ensure decent minimum size
        minWidth: 80,
      },
      floatingXPText: {
        color: themeColors.white,
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
      },
    };
  });

  React.useEffect(() => {
    // Start animation after delay using state instead of setTimeout for better performance
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, floatingXP.delay);

    return () => clearTimeout(timer);
  }, [
    floatingXP.delay,
    floatingXP.targetLayout,
    floatingXP.x,
    floatingXP.y,
    floatingXP.id,
    floatingXP.text,
    floatingXP.xp,
  ]);

  React.useEffect(() => {
    if (!shouldAnimate) {
      return;
    }

    Animated.timing(floatAnim, {
      toValue: 1,
      duration: 1200, // Optimized duration for smoother animation
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [shouldAnimate, floatAnim]);

  // Map colors to background colors with transparency
  const getBackgroundColor = (color: string) => {
    // Add transparency to the color
    return color ? color + 'B3' : '#000000B3'; // 70% opacity default
  };

  const WRAPPER_SIZE = 200; // Large enough to hold the text without wrapping

  return (
    <Animated.View
      style={{
        position: 'absolute',
        // Position using screen coordinates directly (floatingXP.x/y are from Dimensions.get('window'))
        left: floatingXP.x - WRAPPER_SIZE / 2,
        top: floatingXP.y - WRAPPER_SIZE / 2,
        width: WRAPPER_SIZE,
        height: WRAPPER_SIZE,
        zIndex: 9999, // Ensure it's on top of everything
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        transform: [
          {
            translateX: floatAnim.interpolate({
              inputRange: [0, 1],
              // Target current X + Delta = Target X
              // We want the CENTER to move from StartX to TargetX.
              // Since the wrapper is centered on StartX, we just use the delta.
              outputRange: [
                0,
                floatingXP.targetLayout.x +
                  floatingXP.targetLayout.width / 2 -
                  floatingXP.x,
              ],
            }),
          },
          {
            translateY: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [
                0,
                floatingXP.targetLayout.y +
                  floatingXP.targetLayout.height / 2 -
                  floatingXP.y,
              ],
            }),
          },
          {
            scale: floatAnim.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0.5, 1.2, 0.8, 0],
            }),
          },
        ],
        opacity: floatAnim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        }),
      }}>
      {/* The Bubble Component */}
      <View
        style={[
          styles.floatingXP,
          {backgroundColor: getBackgroundColor(floatingXP.color)},
        ]}>
        <Text style={styles.floatingXPText} numberOfLines={1}>
          {floatingXP.text} +{floatingXP.xp}
        </Text>
      </View>
    </Animated.View>
  );
};
