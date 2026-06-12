import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
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

const TYPE_LABELS = {
  habit_completions: "habit completions", task_completions: "task completions",
  streak_days: "streak days", xp: "XP", check_in: "check-ins",
};

export default function OrbitDetailScreen() {
  const { orbitId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setDashboard(await api.getOrbitDashboard(orbitId)); setError(null); }
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
    const orbit = dashboard.orbit;
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
  if (!dashboard) return null;

  const { orbit, stats, members = [], recent_activity: recentActivity = [] } = dashboard;
  const level = orbit.level || 1;
  const xp = orbit.xp || 0;
  const levelStartXp = ((level - 1) ** 2) * 100;
  const nextLevelXp = (level ** 2) * 100;
  const xpPercent = Math.round(
    ((xp - levelStartXp) / Math.max(1, nextLevelXp - levelStartXp)) * 100
  );

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader title={orbit.name} subtitle={orbit.description || "A private Shared Orbit."} />
      <AppCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={[styles.smallLabel, { color: c.textSecondary }]}>Shared Orbit</Text>
            <Text style={[styles.heroTitle, { color: c.text }]}>Level {level}</Text>
            <Text style={[styles.copy, { color: c.textSecondary }]}>
              {stats.member_count} member{stats.member_count === 1 ? "" : "s"} · {xp} XP
            </Text>
          </View>
          <MaterialCommunityIcons name="orbit" size={44} color={c.primary} />
        </View>
        <OrbitProgressBar percent={xpPercent} style={styles.progressBar} glow />
        <Text style={[styles.time, { color: c.textMuted }]}>{Math.max(0, xp - levelStartXp)} / {nextLevelXp - levelStartXp} XP to next level</Text>
      </AppCard>

      <View style={styles.actions}>
        <AppButton title="Members" variant="secondary" style={styles.action} onPress={() => router.push({ pathname: "/orbit-members", params: { orbitId } })} />
        <AppButton title="New goal" style={styles.action} onPress={() => router.push({ pathname: "/create-orbit-goal", params: { orbitId } })} />
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>This week</Text>
      <AppCard style={styles.card}>
        <View style={styles.statGrid}>
          <Stat label="Completion" value={`${stats.weekly_completion_rate}%`} color={c.primary} labelColor={c.textSecondary} />
          <Stat label="Actions" value={stats.weekly_actions} color={c.text} labelColor={c.textSecondary} />
          <Stat label="Habits" value={stats.habits_completed_this_week} color={c.success} labelColor={c.textSecondary} />
          <Stat label="Tasks" value={stats.tasks_completed_this_week} color={c.text} labelColor={c.textSecondary} />
          <Stat label="Best streak" value={`${stats.current_streak}d`} color={c.primary} labelColor={c.textSecondary} />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: c.text }]}>Weekly progress</Text>
          <Text style={[styles.status, { color: c.primary }]}>{stats.weekly_completion_rate}%</Text>
        </View>
        <OrbitProgressBar percent={stats.weekly_completion_rate} style={styles.progressBar} glow />
        <Text style={[styles.copy, { color: c.textSecondary }]}>Progress across Shared Orbit goals active this week.</Text>
      </AppCard>

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

      <Text style={[styles.sectionTitle, { color: c.text }]}>Recent activity</Text>
      {recentActivity.length ? recentActivity.map((item) => <AppCard key={item.id} style={styles.activityCard}>
        <View style={styles.activityRow}>
          <MaterialCommunityIcons name="timeline-outline" size={22} color={c.primary} />
          <View style={styles.activityCopy}>
            <Text style={[styles.activityMessage, { color: c.text }]}>{item.message}</Text>
            <Text style={[styles.time, { color: c.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        </View>
      </AppCard>) : <Text style={[styles.copy, { color: c.textSecondary }]}>Activity will appear as members build momentum.</Text>}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Members</Text>
        <Text style={[styles.time, { color: c.textMuted }]}>{members.length} total</Text>
      </View>
      {members.slice(0, 6).map((member) => (
        <AppCard key={member.user_id} style={styles.memberCard}>
          <View style={styles.memberRow}>
            <MaterialCommunityIcons name={member.user?.avatar || "account-circle"} size={34} color={c.primary} />
            <View style={styles.memberCopy}>
              <Text style={[styles.memberName, { color: c.text }]}>{member.user?.display_name || member.user?.name || member.user?.username || "Member"}</Text>
              <Text style={[styles.time, { color: c.textSecondary }]}>{member.role} · Level {member.user?.level || 1}</Text>
            </View>
          </View>
        </AppCard>
      ))}

      <AppButton title={orbit.viewer_role === "owner" ? "Delete Orbit" : "Leave Orbit"} variant="secondary" onPress={leaveOrDelete} style={styles.dangerButton} />
    </ScrollView>
  );
}

function Stat({ label, value, color, labelColor }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, container: { padding: spacing.xl, paddingBottom: 100 },
  actions: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }, action: { flex: 1 },
  heroCard: { marginBottom: spacing.lg }, heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md }, heroCopy: { flex: 1 }, heroTitle: { ...typography.h2, marginTop: spacing.xs }, progressBar: { marginTop: spacing.lg },
  inviteCard: { marginBottom: spacing.xl }, smallLabel: { ...typography.caption }, code: { ...typography.h2, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md }, card: { marginBottom: spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg }, sectionTitleInline: { marginTop: 0 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md }, title: { ...typography.h3, flex: 1 }, status: { ...typography.caption, textTransform: "uppercase" },
  copy: { ...typography.body, marginTop: spacing.xs }, track: { height: 9, borderRadius: radii.pill, overflow: "hidden", marginTop: spacing.lg }, fill: { height: "100%" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg }, stat: { width: "50%" }, statValue: { ...typography.h2 }, statLabel: { ...typography.caption, marginTop: 2 },
  contribute: { marginTop: spacing.lg }, activityCard: { marginBottom: spacing.sm }, activityRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md }, activityCopy: { flex: 1 }, activityMessage: { ...typography.bodyBold }, time: { ...typography.caption, marginTop: spacing.xs },
  memberCard: { marginBottom: spacing.sm }, memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.md }, memberCopy: { flex: 1 }, memberName: { ...typography.bodyBold }, dangerButton: { marginTop: spacing.xxl },
});
