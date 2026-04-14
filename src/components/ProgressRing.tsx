import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, FONT_SIZE } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0.0 to 1.0
  current: number;  // current effective hydration in ml
  goal: number;     // target in ml
  size?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  current,
  goal,
  size = Math.min(Dimensions.get('window').width * 0.55, 240),
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clampedProgress = Math.min(progress, 1);

  // Animated values
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedPercentage = useRef(new Animated.Value(0)).current;
  const animatedCurrent = useRef(new Animated.Value(0)).current;

  // Display state for text (driven by listeners)
  const [displayPercentage, setDisplayPercentage] = React.useState(0);
  const [displayCurrent, setDisplayCurrent] = React.useState(0);

  useEffect(() => {
    // Animate the ring
    Animated.timing(animatedProgress, {
      toValue: clampedProgress,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Animate the percentage counter
    Animated.timing(animatedPercentage, {
      toValue: Math.round(clampedProgress * 100),
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Animate the ml counter
    Animated.timing(animatedCurrent, {
      toValue: Math.round(current),
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, current]);

  // Listen for animated value changes to update displayed text
  useEffect(() => {
    const percentListener = animatedPercentage.addListener(({ value }) => {
      setDisplayPercentage(Math.round(value));
    });
    const currentListener = animatedCurrent.addListener(({ value }) => {
      setDisplayCurrent(Math.round(value));
    });

    return () => {
      animatedPercentage.removeListener(percentListener);
      animatedCurrent.removeListener(currentListener);
    };
  }, []);

  // Map animated progress to strokeDashoffset
  const animatedStrokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getGradientColors = () => {
    if (progress >= 1) return { start: '#66BB6A', end: '#43A047' };
    if (progress >= 0.7) return { start: '#4FC3F7', end: '#29B6F6' };
    if (progress >= 0.4) return { start: '#81D4FA', end: '#4FC3F7' };
    return { start: '#FF8A65', end: '#FF7043' };
  };

  const colors = getGradientColors();

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.start} />
            <Stop offset="100%" stopColor={colors.end} />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.card}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerContent}>
        <Text style={styles.percentage}>{displayPercentage}%</Text>
        <Text style={styles.amount}>
          {displayCurrent}<Text style={styles.unit}> / {goal}ml</Text>
        </Text>
        {progress >= 1 && (
          <Text style={styles.goalReached}>Goal reached! 🎉</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  amount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  unit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  goalReached: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    marginTop: 4,
    fontWeight: '600',
  },
});

export default ProgressRing;
