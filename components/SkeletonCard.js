import { StyleSheet } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

import { useTheme } from "../hooks/useTheme";
import { radii, spacing } from "../lib/theme";
import { AppCard } from "./AppCard";

export function SkeletonCard({ lines = 3, compact = false }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const opacity = useSharedValue(0.45);

  opacity.value = withRepeat(
    withSequence(
      withTiming(0.9, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      withTiming(0.45, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      })
    ),
    -1,
    true
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const skeletonColor = c.skeleton || c.surfaceAlt;

  return (
    <AppCard style={[styles.card, compact && styles.compactCard]}>
      <Animated.View
        style={[
          styles.lineLarge,
          {
            backgroundColor: skeletonColor,
          },
          animatedStyle,
        ]}
      />

      {Array.from({ length: lines }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.line,
            {
              backgroundColor: skeletonColor,
            },
            animatedStyle,
            index === lines - 1 && styles.shortLine,
          ]}
        />
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },

  compactCard: {
    paddingVertical: spacing.lg,
  },

  lineLarge: {
    height: 20,
    width: "60%",
    borderRadius: radii.pill,
    marginBottom: spacing.lg,
  },

  line: {
    height: 12,
    width: "100%",
    borderRadius: radii.pill,
    marginBottom: spacing.sm,
  },

  shortLine: {
    width: "70%",
    marginBottom: 0,
  },
});