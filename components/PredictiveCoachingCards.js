import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const ICONS = {
  streak_risk: "fire-alert",
  weekly_goal_risk: "target",
  project_stall: "clipboard-alert-outline",
  orbit_engagement_risk: "account-group-outline",
  verification_bottleneck: "shield-check-outline",
  milestone_opportunity: "trophy-outline",
  next_best_action: "lightning-bolt-outline",
};

export function PredictiveCoachingCards({ cards = [], colors, onDismiss }) {
  const visibleCards = cards
    .map(normalizeCard)
    .filter((card) => card.id && card.title && card.message);
  if (!visibleCards.length) return null;
  const c = colors;

  async function dismiss(card) {
    onDismiss?.(card.id);
    try {
      await api.dismissPredictiveCoachingCard(card.id);
    } catch (_err) {
      // The card can come back on the next refresh if dismissal fails.
    }
  }

  function open(card) {
    const target = card.actionTarget || {};
    const path = target.path;
    const params = target.params || {};
    if (!path) return;
    if (path === "/orbit-detail") {
      router.push({ pathname: "/orbit-detail", params });
      return;
    }
    router.push(path);
  }

  return (
    <View style={styles.wrap}>
      {visibleCards.slice(0, 5).map((card) => {
        const accent = severityColor(card.severity, c);
        return (
          <AppCard key={card.id} style={[styles.card, { borderColor: `${accent}55` }]}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: `${accent}18` }]}>
                <MaterialCommunityIcons name={ICONS[card.type] || "lightbulb-on-outline"} size={22} color={accent} />
              </View>
              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>{card.title}</Text>
                  <Text style={[styles.badge, { color: accent }]}>{label(card.severity)}</Text>
                </View>
                <Text style={[styles.message, { color: c.textSecondary }]}>{card.message}</Text>
              </View>
              <Pressable onPress={() => dismiss(card)} hitSlop={10} accessibilityLabel="Dismiss coaching card">
                <MaterialCommunityIcons name="close" size={20} color={c.textMuted || c.textSecondary} />
              </Pressable>
            </View>
            {!!card.actionLabel && !!card.actionTarget?.path && (
              <AppButton title={card.actionLabel} variant="secondary" style={styles.action} onPress={() => open(card)} />
            )}
          </AppCard>
        );
      })}
    </View>
  );
}

function normalizeCard(card) {
  return {
    ...card,
    id: safeText(card?.id),
    title: safeText(card?.title),
    message: safeText(card?.message),
    severity: safeText(card?.severity) || "info",
    actionLabel: safeText(card?.action_label),
    actionTarget: card?.action_target || null,
  };
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function severityColor(severity, colors) {
  if (severity === "urgent") return colors.danger || "#EF4444";
  if (severity === "warning") return colors.warning || "#F59E0B";
  if (severity === "opportunity") return colors.success || "#22C55E";
  return colors.primary;
}

function label(severity) {
  if (severity === "urgent") return "Urgent";
  if (severity === "warning") return "Risk";
  if (severity === "opportunity") return "Opportunity";
  return "Tip";
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: { borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  icon: { width: 38, height: 38, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { ...typography.body, fontWeight: "900", flex: 1 },
  badge: { ...typography.caption, fontWeight: "900", textTransform: "uppercase" },
  message: { ...typography.caption, lineHeight: 19 },
  action: { marginTop: spacing.md },
});
