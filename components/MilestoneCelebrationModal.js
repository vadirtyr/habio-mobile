import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../hooks/useTheme";
import { radii, spacing, typography } from "../lib/theme";
import { AppButton } from "./AppButton";

export function MilestoneCelebrationModal({
  celebration,
  remaining = 1,
  onDismiss,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);
  const accent = getAccent(celebration?.type, c);
  const celebrationId = celebration?.id;

  useEffect(() => {
    if (!celebrationId) return;

    opacity.value = withTiming(1, { duration: 160 });
    scale.value = withSequence(
      withSpring(1.05, { damping: 12, stiffness: 220 }),
      withSpring(1, { damping: 16, stiffness: 190 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
  }, [celebrationId, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!celebration) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={() => onDismiss(celebration)}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme.isDark
              ? "rgba(0,0,0,0.82)"
              : "rgba(15,23,42,0.72)",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.card,
            animatedStyle,
            { backgroundColor: c.surface, borderColor: `${accent}70` },
          ]}
        >
          <View style={[styles.glow, { backgroundColor: `${accent}16` }]} />

          <View style={[styles.iconWrap, { backgroundColor: accent }]}>
            <MaterialCommunityIcons
              name={celebration.icon || "star-four-points"}
              size={42}
              color={c.white || "#FFFFFF"}
            />
          </View>

          <Text style={[styles.eyebrow, { color: accent }]}>Milestone reached</Text>
          <Text style={[styles.title, { color: c.text }]}>{celebration.title}</Text>
          <Text style={[styles.message, { color: c.textSecondary }]}>
            {celebration.message}
          </Text>

          {!!celebration.reward_summary && (
            <View
              style={[
                styles.reward,
                { backgroundColor: c.surfaceAlt, borderColor: c.border },
              ]}
            >
              <MaterialCommunityIcons
                name="star-four-points-outline"
                size={18}
                color={accent}
              />
              <Text style={[styles.rewardText, { color: c.text }]}>
                {celebration.reward_summary}
              </Text>
            </View>
          )}

          {remaining > 1 && (
            <Text style={[styles.remaining, { color: c.textMuted || c.textSecondary }]}>
              {remaining - 1} more celebration{remaining === 2 ? "" : "s"} waiting
            </Text>
          )}

          <AppButton
            title={remaining > 1 ? "Next celebration" : "Keep going"}
            onPress={() => onDismiss(celebration)}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function getAccent(type, colors) {
  if (type === "streak_milestone") return colors.coral || colors.primary;
  if (type === "perfect_week") return colors.success || colors.primary;
  if (type === "achievement_unlock") return colors.gold || colors.primary;
  if (type === "level_up") return colors.cyan || colors.primary;
  return colors.primary;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    top: -170,
    right: -90,
    borderRadius: radii.pill,
  },
  iconWrap: {
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "900",
  },
  title: {
    ...typography.h1,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.md,
  },
  reward: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  rewardText: {
    ...typography.bodyBold,
    textAlign: "center",
  },
  remaining: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
});
