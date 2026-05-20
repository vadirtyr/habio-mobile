import { StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

import { useTheme } from "../hooks/useTheme";
import { radii, spacing, typography } from "../lib/theme";

const DEFAULT_DAYS = [
  { label: "M", percent: 75 },
  { label: "T", percent: 100 },
  { label: "W", percent: 40 },
  { label: "T", percent: 90 },
  { label: "F", percent: 65 },
  { label: "S", percent: 30 },
  { label: "S", percent: 0 },
];

export function WeeklyOrbitChart({
  days = DEFAULT_DAYS,
  title = "Weekly Orbit",
  subtitle = "Your consistency over the last 7 days.",
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const average =
    days.length === 0
      ? 0
      : Math.round(
          days.reduce((sum, day) => sum + (day.percent || 0), 0) / days.length
        );

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: c.border,
          backgroundColor: c.surface,
        },
      ]}
    >
      <View
        style={[
          styles.glowOne,
          {
            backgroundColor: c.surfaceGlow || `${c.primary}12`,
          },
        ]}
      />

      <View
        style={[
          styles.glowTwo,
          {
            backgroundColor: `${c.coral || c.primary}10`,
          },
        ]}
      />

      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: c.textSecondary }]}>
            Consistency
          </Text>

          <Text style={[styles.title, { color: c.text }]}>{title}</Text>

          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {subtitle}
          </Text>
        </View>

        <View
          style={[
            styles.scoreBadge,
            {
              borderColor: c.border,
              backgroundColor: `${c.cyan || c.primary}14`,
            },
          ]}
        >
          <Text style={[styles.scoreValue, { color: c.text }]}>{average}%</Text>

          <Text style={[styles.scoreLabel, { color: c.textSecondary }]}>
            avg
          </Text>
        </View>
      </View>

      <View style={styles.chartRow}>
        {days.map((day, index) => (
          <OrbitDay
            key={`${day.label}-${index}`}
            day={day}
            index={index}
            themeColors={c}
          />
        ))}
      </View>
    </View>
  );
}

function OrbitDay({ day, index, themeColors }) {
  const c = themeColors;

  const percent = Math.max(0, Math.min(100, day.percent || 0));
  const height = Math.max(8, Math.round((percent / 100) * 86));

  const animatedHeight = useSharedValue(8);
  const opacity = useSharedValue(0);

  animatedHeight.value = withDelay(
    index * 55,
    withTiming(height, { duration: 320 })
  );

  opacity.value = withDelay(index * 55, withTiming(1, { duration: 220 }));

  const animatedBarStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    opacity: opacity.value,
  }));

  const isComplete = percent >= 100;
  const isStrong = percent >= 70;

  const barColor = isComplete
    ? c.success
    : isStrong
    ? c.cyan || c.primary
    : c.textMuted || c.muted;

  return (
    <View style={styles.dayWrap}>
      <View
        style={[
          styles.barTrack,
          {
            backgroundColor: c.surfaceAlt,
            borderColor: c.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.barFill,
            animatedBarStyle,
            {
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <Text
        style={[
          styles.dayLabel,
          {
            color: isComplete || isStrong ? barColor : c.textSecondary,
          },
        ]}
      >
        {day.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },

  glowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -110,
    right: -70,
  },

  glowTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
    bottom: -90,
    left: -60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  copy: {
    flex: 1,
  },

  eyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  title: {
    ...typography.h2,
    marginTop: spacing.xs,
  },

  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    maxWidth: 230,
  },

  scoreBadge: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  scoreValue: {
    ...typography.h3,
  },

  scoreLabel: {
    ...typography.caption,
    textTransform: "uppercase",
  },

  chartRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  dayWrap: {
    flex: 1,
    alignItems: "center",
  },

  barTrack: {
    height: 96,
    width: "100%",
    maxWidth: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  barFill: {
    width: "100%",
    borderRadius: radii.pill,
  },

  dayLabel: {
    ...typography.caption,
    fontWeight: "900",
    marginTop: spacing.sm,
  },
});