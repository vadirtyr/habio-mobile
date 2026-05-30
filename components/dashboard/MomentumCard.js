import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    radii,
    shadows,
    spacing
} from "../../lib/theme";

import { useTheme } from "../../hooks/useTheme";

export function MomentumCard({
  name = "Explorer",
  level = 1,
  xp = 0,
  xpToNextLevel = 100,
  streak = 0,
  completedToday = 0,
  totalToday = 0,
}) {
  const { theme } = useTheme();

  const c = theme.colors;

  const progress =
    xpToNextLevel > 0
      ? Math.min(
          xp / xpToNextLevel,
          1
        )
      : 0;

  const completionPercent =
    totalToday > 0
      ? Math.round(
          (completedToday /
            totalToday) *
            100
        )
      : 0;

  const remaining =
    Math.max(
      totalToday - completedToday,
      0
    );

  const textPrimary =
    theme.isDark
      ? "#FFFFFF"
      : "#111827";

  const textSecondary =
    theme.isDark
      ? "rgba(255,255,255,0.82)"
      : "rgba(17,24,39,0.72)";

  const badgeBackground =
    theme.isDark
      ? "rgba(255,255,255,0.14)"
      : "rgba(255,255,255,0.45)";

  const progressTrack =
    theme.isDark
      ? "rgba(255,255,255,0.18)"
      : "rgba(255,255,255,0.38)";

  const progressFill =
    theme.isDark
      ? "rgba(255,255,255,0.95)"
      : "#111827";

  return (
    <LinearGradient
      colors={
        theme.gradient || [
          c.primary,
          c.cyan || c.primary,
        ]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.glow} />

      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text
            style={[
              styles.greeting,
              {
                color: textSecondary,
              },
            ]}
          >
            Welcome back
          </Text>

          <Text
            style={[
              styles.name,
              {
                color: textPrimary,
              },
            ]}
          >
            {name}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: textSecondary,
              },
            ]}
          >
            Level {level} Orbit Explorer
          </Text>
        </View>

        <View
          style={[
            styles.streakBadge,
            {
              backgroundColor:
                badgeBackground,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="fire"
            size={20}
            color={textPrimary}
          />

          <Text
            style={[
              styles.streakText,
              {
                color: textPrimary,
              },
            ]}
          >
            {streak}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text
            style={[
              styles.progressLabel,
              {
                color: textSecondary,
              },
            ]}
          >
            Level Progress
          </Text>

          <Text
            style={[
              styles.progressValue,
              {
                color: textSecondary,
              },
            ]}
          >
            {xp} / {xpToNextLevel} XP
          </Text>
        </View>

        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor:
                progressTrack,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor:
                  progressFill,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              {
                color: textPrimary,
              },
            ]}
          >
            {completionPercent}%
          </Text>

          <Text
            style={[
              styles.statLabel,
              {
                color: textSecondary,
              },
            ]}
          >
            Momentum
          </Text>
        </View>

        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              {
                color: textPrimary,
              },
            ]}
          >
            {completedToday}
          </Text>

          <Text
            style={[
              styles.statLabel,
              {
                color: textSecondary,
              },
            ]}
          >
            Completed
          </Text>
        </View>

        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              {
                color: textPrimary,
              },
            ]}
          >
            {remaining}
          </Text>

          <Text
            style={[
              styles.statLabel,
              {
                color: textSecondary,
              },
            ]}
          >
            Remaining
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="star-four-points"
          size={16}
          color={textPrimary}
        />

        <Text
          style={[
            styles.footerText,
            {
              color: textPrimary,
            },
          ]}
        >
          {remaining > 0
            ? `Complete ${remaining} more to keep momentum going`
            : "Today's orbit is complete"}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    ...shadows.card,
  },

  glow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor:
      "rgba(255,255,255,0.10)",
    top: -120,
    right: -100,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  copy: {
    flex: 1,
    paddingRight: spacing.md,
  },

  greeting: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  name: {
    fontSize: 30,
    fontWeight: "900",
    marginTop: spacing.xs,
  },

  subtitle: {
    marginTop: spacing.xs,
    fontWeight: "700",
  },

  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  streakText: {
    fontWeight: "900",
    fontSize: 16,
  },

  progressSection: {
    marginTop: spacing.xl,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  progressLabel: {
    fontWeight: "800",
  },

  progressValue: {
    fontWeight: "700",
  },

  progressTrack: {
    height: 12,
    borderRadius: radii.pill,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: radii.pill,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },

  stat: {
    alignItems: "center",
    flex: 1,
  },

  statValue: {
    fontSize: 24,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: spacing.xs,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  footer: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  footerText: {
    flex: 1,
    fontWeight: "700",
    lineHeight: 20,
  },
});