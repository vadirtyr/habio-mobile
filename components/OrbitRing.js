import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "../hooks/useTheme";
import { spacing, typography } from "../lib/theme";

export function OrbitRing({
  percent = 0,
  size = 132,
  strokeWidth = 12,
  label = "Today",
  value,
  color,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const ringColor = color || c.cyan || c.primary;
  const trackColor = c.surfaceAlt;

  const safePercent = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (safePercent / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          stroke={trackColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        <Circle
          stroke={ringColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={[styles.value, { color: c.text }]}>
          {value ?? `${safePercent}%`}
        </Text>

        <Text style={[styles.label, { color: c.textSecondary }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },

  value: {
    ...typography.h2,
  },

  label: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
});