import React, {useEffect, useState, useMemo, useRef} from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const CONFETTI_COUNT = 50; // Increased for better effect
const COLORS = [
  '#FFC107',
  '#F44336',
  '#2196F3',
  '#4CAF50',
  '#9C27B0',
  '#FF9800',
  '#E91E63',
];

// Static styles outside component for performance
const confettiStyles = StyleSheet.create({
  piece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

interface ConfettiPieceProps {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  duration: number;
  index: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = React.memo(
  ({startX, endX, startY, endY, rotation, scale, color, delay, duration}) => {
    const translateY = useSharedValue(startY);
    const translateX = useSharedValue(startX);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
      // Start animations immediately
      translateY.value = withDelay(
        delay,
        withTiming(endY, {
          duration: duration,
          easing: Easing.out(Easing.cubic),
        }),
      );

      translateX.value = withDelay(
        delay,
        withTiming(endX, {
          duration: duration,
          easing: Easing.inOut(Easing.ease),
        }),
      );

      rotate.value = withDelay(
        delay,
        withTiming(rotation + 720, {
          duration: duration,
          easing: Easing.linear,
        }),
      );

      opacity.value = withDelay(
        delay + duration * 0.7,
        withTiming(0, {
          duration: duration * 0.3,
          easing: Easing.out(Easing.ease),
        }),
      );

      return () => {
        cancelAnimation(translateY);
        cancelAnimation(translateX);
        cancelAnimation(rotate);
        cancelAnimation(opacity);
      };
      // Only run once on mount
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const animatedStyle = useAnimatedStyle(() => {
      'worklet';
      return {
        transform: [
          {translateX: translateX.value},
          {translateY: translateY.value},
          {rotate: `${rotate.value}deg`},
          {scale: scale},
        ],
        opacity: opacity.value,
        backgroundColor: color,
      };
    });

    return <Animated.View style={[confettiStyles.piece, animatedStyle]} />;
  },
);

interface ConfettiSystemProps {
  active: boolean;
  duration?: number;
}

// Static container style
const containerStyle = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});

// Pre-generate confetti configurations for consistent performance
const generateConfettiConfig = (index: number) => {
  const startX = Math.random() * SCREEN_WIDTH;
  return {
    startX,
    endX: startX + (Math.random() - 0.5) * 300, // More horizontal spread
    startY: -50,
    endY: SCREEN_HEIGHT + 50,
    rotation: Math.random() * 360,
    scale: 0.6 + Math.random() * 0.8,
    color: COLORS[index % COLORS.length],
    delay: Math.random() * 500, // Stagger starts
    duration: 2500 + Math.random() * 1000,
  };
};

export const ConfettiSystem: React.FC<ConfettiSystemProps> = React.memo(
  ({active, duration = 4000}) => {
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Memoize confetti configs to prevent regeneration
    const confettiConfigs = useMemo(() => {
      return Array.from({length: CONFETTI_COUNT}).map((_, i) => ({
        ...generateConfettiConfig(i),
        id: i,
      }));
    }, []); // Only generate once

    useEffect(() => {
      if (active && !isActive) {
        setIsActive(true);

        // Clear previous timer if exists
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          setIsActive(false);
        }, duration);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [active, duration, isActive]);

    if (!isActive) {
      return null;
    }

    return (
      <View style={[containerStyle.container, {pointerEvents: 'none'}]}>
        {confettiConfigs.map(config => (
          <ConfettiPiece key={config.id} index={config.id} {...config} />
        ))}
      </View>
    );
  },
);
