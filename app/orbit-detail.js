import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const TYPE_LABELS = {
  habit_completions: "habit completions", task_completions: "task completions",
  streak_days: "streak days", xp: "XP", check_in: "check-ins",
};

export default function OrbitDetailScreen() {
  const { orbitId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [orbit, setOrbit] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setOrbit(await api.getOrbit(orbitId)); setError(null); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [orbitId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function contribute(goal) {
    try {
      await api.contributeOrbitGoal(orbitId, goal.id, { amount: 1 });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (err) { Alert.alert("Could not add progress", err.message); }
  }

  function leaveOrDelete() {
    const owner = orbit.viewer_role === "owner";
    Alert.alert(owner ? "Delete Shared Orbit?" : "Leave Shared Orbit?", owner ? "This removes the Orbit for every member." : "You will lose access to this private Orbit.", [
      { text: "Cancel", style: "cancel" },
      { text: owner ? "Delete" : "Leave", style: "destructive", onPress: async () => {
        try {
          if (owner) await api.deleteOrbit(orbitId);
          else await api.leaveOrbit(orbitId);
          router.replace("/orbits");
        }
        catch (err) { Alert.alert("Could not update Orbit", err.message); }
      } },
    ]);
  }

  if (loading) return <View style={[styles.center, { backgroundColor: c.background }]}><Text style={{ color: c.textSecondary }}>Loading Orbit...</Text></View>;
  if (error) return <View style={[styles.screen, styles.container, { backgroundColor: c.background }]}><ErrorState title="Orbit unavailable" description={error} onRetry={load} /></View>;
  if (!orbit) return null;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader title={orbit.name} subtitle={orbit.description || "A private Shared Orbit."} />
      <View style={styles.actions}>
        <AppButton title="Members" variant="secondary" style={styles.action} onPress={() => router.push({ pathname: "/orbit-members", params: { orbitId } })} />
        <AppButton title="New goal" style={styles.action} onPress={() => router.push({ pathname: "/create-orbit-goal", params: { orbitId } })} />
      </View>

      <AppCard style={styles.inviteCard}>
        <Text style={[styles.smallLabel, { color: c.textSecondary }]}>Invite code</Text>
        <Text selectable style={[styles.code, { color: c.text }]}>{orbit.invite_code}</Text>
      </AppCard>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Group goals</Text>
      {orbit.goals?.length ? orbit.goals.map((goal) => {
        const percent = Math.min(100, Math.round(((goal.progress || 0) / goal.target_amount) * 100));
        return <AppCard key={goal.id} style={styles.card}>
          <View style={styles.row}><Text style={[styles.title, { color: c.text }]}>{goal.title}</Text><Text style={[styles.status, { color: goal.status === "completed" ? c.success : c.primary }]}>{goal.status}</Text></View>
          {!!goal.description && <Text style={[styles.copy, { color: c.textSecondary }]}>{goal.description}</Text>}
          <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: c.primary }]} /></View>
          <Text style={[styles.copy, { color: c.textSecondary }]}>{goal.progress || 0} / {goal.target_amount} {TYPE_LABELS[goal.target_type]}</Text>
          {goal.status !== "completed" && <AppButton title={goal.target_type === "check_in" ? "Check in" : "Add 1"} variant="secondary" onPress={() => contribute(goal)} style={styles.contribute} />}
        </AppCard>;
      }) : <AppCard><EmptyState compact title="No group goals" description="Create the first shared target for this Orbit." icon={<MaterialCommunityIcons name="target" size={40} color={c.primary} />} /></AppCard>}

      <Text style={[styles.sectionTitle, { color: c.text }]}>Group activity</Text>
      {orbit.activity?.length ? orbit.activity.map((item) => <AppCard key={item.id} style={styles.activityCard}>
        <Text style={[styles.copy, { color: c.text }]}>{item.message}</Text>
        <Text style={[styles.time, { color: c.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
      </AppCard>) : <Text style={[styles.copy, { color: c.textSecondary }]}>Activity will appear as members build momentum.</Text>}

      <AppButton title={orbit.viewer_role === "owner" ? "Delete Orbit" : "Leave Orbit"} variant="secondary" onPress={leaveOrDelete} style={styles.dangerButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, container: { padding: spacing.xl, paddingBottom: 100 },
  actions: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }, action: { flex: 1 },
  inviteCard: { marginBottom: spacing.xl }, smallLabel: { ...typography.caption }, code: { ...typography.h2, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md }, card: { marginBottom: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md }, title: { ...typography.h3, flex: 1 }, status: { ...typography.caption, textTransform: "uppercase" },
  copy: { ...typography.body, marginTop: spacing.xs }, track: { height: 9, borderRadius: radii.pill, overflow: "hidden", marginTop: spacing.lg }, fill: { height: "100%" },
  contribute: { marginTop: spacing.lg }, activityCard: { marginBottom: spacing.sm }, time: { ...typography.caption, marginTop: spacing.sm }, dangerButton: { marginTop: spacing.xxl },
});
