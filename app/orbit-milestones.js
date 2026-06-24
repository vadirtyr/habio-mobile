import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { OrbitProgressBar } from "../components/OrbitProgressBar";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

function milestonePercent(item) {
  if (typeof item?.progress_percent === "number") return item.progress_percent;
  if (!item?.target) return item?.unlocked ? 100 : 0;
  return Math.min(100, Math.round(((item.progress || 0) / item.target) * 100));
}

function formatUnlockedDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch (_err) {
    return null;
  }
}

export default function OrbitMilestonesScreen() {
  const { orbitId, orbitName, canSync } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!orbitId) return;
    setError(null);
    try {
      const data = await api.getOrbitMilestones(orbitId);
      setPayload(data);
    } catch (err) {
      setError(err.message || "Unable to load Orbit milestones.");
    } finally {
      setLoading(false);
    }
  }, [orbitId]);

  useEffect(() => {
    load();
  }, [load]);

  const items = payload?.items || [];
  const unlocked = payload?.unlocked || items.filter((item) => item.unlocked);
  const upcoming = payload?.upcoming || items.filter((item) => !item.unlocked);
  const nextMilestone = payload?.next_milestone || upcoming[0];
  const canRunSync = canSync === "true";

  async function syncMilestones() {
    setSyncing(true);
    try {
      const data = await api.syncOrbitMilestones(orbitId);
      setPayload(data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert("Could not sync milestones", err.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader
        title="Orbit Milestones"
        subtitle={orbitName ? `${orbitName} shared accomplishments` : "Shared accomplishments"}
        right={canRunSync ? <AppButton title="Sync" fullWidth={false} variant="secondary" onPress={syncMilestones} disabled={syncing} /> : null}
      />

      {error ? <ErrorState title="Milestones unavailable" description={error} onRetry={load} /> : null}

      {loading ? (
        <Text style={[styles.copy, { color: c.textSecondary }]}>Loading milestones...</Text>
      ) : items.length === 0 ? (
        <AppCard>
          <EmptyState
            title="No milestones yet"
            description="Milestone progress will appear as this Orbit completes shared habits, tasks, challenges, and grows together."
            icon={<MaterialCommunityIcons name="star-four-points-outline" size={44} color={c.primary} />}
          />
        </AppCard>
      ) : (
        <>
          {!!nextMilestone && (
            <AppCard style={[styles.nextCard, { borderColor: c.primary }]}>
              <View style={styles.row}>
                <View style={styles.copyWrap}>
                  <Text style={[styles.label, { color: c.textSecondary }]}>Next milestone</Text>
                  <Text style={[styles.title, { color: c.text }]}>{nextMilestone.title}</Text>
                  <Text style={[styles.copy, { color: c.textSecondary }]}>{nextMilestone.description}</Text>
                </View>
                <MilestoneIcon item={nextMilestone} colors={c} locked />
              </View>
              <OrbitProgressBar percent={milestonePercent(nextMilestone)} style={styles.progress} />
              <Text style={[styles.meta, { color: c.textMuted }]}>
                {nextMilestone.progress || 0} / {nextMilestone.target || 0}
                {nextMilestone.remaining ? ` · ${nextMilestone.remaining} to go` : ""}
              </Text>
            </AppCard>
          )}

          <Text style={[styles.sectionTitle, { color: c.text }]}>Unlocked</Text>
          {unlocked.length ? unlocked.map((item) => (
            <MilestoneCard key={item.id || item.milestone_id} item={item} colors={c} />
          )) : (
            <AppCard style={styles.card}>
              <Text style={[styles.copy, { color: c.textSecondary }]}>No unlocked Orbit milestones yet. The first one is close once shared progress begins.</Text>
            </AppCard>
          )}

          <Text style={[styles.sectionTitle, { color: c.text }]}>Upcoming</Text>
          {upcoming.map((item) => (
            <MilestoneCard key={item.id || item.milestone_id} item={item} colors={c} locked />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function MilestoneCard({ item, colors, locked = false }) {
  const percent = milestonePercent(item);
  const unlockedDate = formatUnlockedDate(item.unlocked_at);
  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <MilestoneIcon item={item} colors={colors} locked={locked || !item.unlocked} />
        <View style={styles.copyWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.status, { color: item.unlocked ? colors.success : colors.textMuted }]}>
              {item.unlocked ? "Unlocked" : "Upcoming"}
            </Text>
          </View>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>{item.description}</Text>
          <OrbitProgressBar percent={percent} style={styles.progress} color={item.color || colors.primary} />
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {item.progress || 0} / {item.target || 0}
            {unlockedDate ? ` · Unlocked ${unlockedDate}` : ""}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

function MilestoneIcon({ item, colors, locked = false }) {
  const color = locked ? colors.textMuted : item.color || colors.primary;
  return (
    <View style={[styles.icon, { backgroundColor: `${item.color || colors.primary}20` }]}>
      <MaterialCommunityIcons name={locked ? "lock-outline" : item.icon || "star-four-points"} size={24} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  card: { marginBottom: spacing.md },
  nextCard: { borderWidth: 1, marginBottom: spacing.lg },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  copyWrap: { flex: 1 },
  label: { ...typography.caption, textTransform: "uppercase" },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md },
  title: { ...typography.h3, flex: 1 },
  copy: { ...typography.body, marginTop: spacing.xs },
  status: { ...typography.caption, textTransform: "uppercase" },
  meta: { ...typography.caption, marginTop: spacing.sm },
  progress: { marginTop: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
});
