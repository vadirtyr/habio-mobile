import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ErrorState } from "../components/ErrorState";
import { OrbitProgressBar } from "../components/OrbitProgressBar";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function ProjectDetailScreen() {
  const { projectId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [project, setProject] = useState(null);
  const [busySubtask, setBusySubtask] = useState(null);
  const [verificationTarget, setVerificationTarget] = useState(null);
  const [verificationText, setVerificationText] = useState("");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProject(await api.getProject(projectId));
    } catch (err) {
      setError(err.message || "Unable to load project.");
    }
  }, [projectId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function completeSubtask(subtask) {
    if (subtask.completed || busySubtask) return;
    setBusySubtask(subtask.id);
    try {
      const data = await api.completeProjectSubtask(project.id, subtask.id);
      if (data.verification_required) {
        setVerificationTarget(subtask);
        return;
      }
      setProject(data.project);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const subtaskCoins = data.subtask_rewards?.coins_earned || 0;
      const subtaskXp = data.subtask_rewards?.xp_earned || 0;
      const projectCoins = data.project_rewards?.coins_earned || 0;
      const projectXp = data.project_rewards?.xp_earned || 0;
      if (data.project_completed) {
        Alert.alert(
          "Project complete",
          `Nice work. Earned ${subtaskCoins + projectCoins} coins and ${subtaskXp + projectXp} XP.`,
        );
      }
    } catch (err) {
      Alert.alert("Could not complete subtask", err.message);
    } finally {
      setBusySubtask(null);
    }
  }


  async function submitVerification() {
    if (!verificationTarget || busySubtask) return;
    const text = verificationText.trim();
    if (!text) {
      Alert.alert("Verification required", "Add a short note for the reviewer.");
      return;
    }
    setBusySubtask(verificationTarget.id);
    try {
      await api.submitProjectSubtaskVerification(project.id, verificationTarget.id, {
        verification_text: text,
      });
      setProject((current) => ({
        ...current,
        subtasks: (current.subtasks || []).map((item) =>
          item.id === verificationTarget.id ? { ...item, verification_status: "pending", verification_text: text } : item
        ),
      }));
      setVerificationTarget(null);
      setVerificationText("");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Submitted", "Your proof is waiting for owner/admin approval.");
    } catch (err) {
      Alert.alert("Could not submit verification", err.message);
    } finally {
      setBusySubtask(null);
    }
  }

  if (error) {
    return (
      <View style={[styles.screen, styles.container, { backgroundColor: c.background }]}>
        <ScreenHeader title="Project" subtitle="Multi-step goal" />
        <ErrorState title="Project unavailable" description={error} onRetry={load} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.screen, styles.container, { backgroundColor: c.background }]}>
        <ScreenHeader title="Project" subtitle="Loading..." />
        <Text style={[styles.copy, { color: c.textSecondary }]}>Loading project...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader title={project.title} subtitle={project.orbit_id ? "Orbit project" : "Personal project"} />

      <AppCard style={styles.card}>
        {!!project.description && <Text style={[styles.copy, { color: c.textSecondary }]}>{project.description}</Text>}
        <View style={styles.rewardRow}>
          <RewardPill icon="star-four-points" label={`${project.xp_reward || 0} XP`} color={c.primary} />
          <RewardPill icon="circle-multiple" label={`${project.coin_reward || 0} coins`} color={c.gold || c.primary} />
        </View>
        <OrbitProgressBar percent={project.completion_percent || 0} style={styles.progress} glow />
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {project.completed_subtasks || 0} of {project.total_subtasks || 0} subtasks complete
        </Text>
      </AppCard>

      {!!verificationTarget && <AppCard style={styles.card}>
        <Text style={[styles.title, { color: c.text }]}>Submit verification</Text>
        <Text style={[styles.copy, { color: c.textSecondary }]}>{verificationTarget.title}</Text>
        <AppInput value={verificationText} onChangeText={setVerificationText} placeholder="Describe what you completed" multiline maxLength={1000} style={styles.input} />
        <View style={styles.actions}>
          <AppButton title="Cancel" variant="secondary" style={styles.action} onPress={() => { setVerificationTarget(null); setVerificationText(""); }} disabled={!!busySubtask} />
          <AppButton title={busySubtask ? "Submitting..." : "Submit"} style={styles.action} onPress={submitVerification} disabled={!!busySubtask || !verificationText.trim()} />
        </View>
      </AppCard>}

      <Text style={[styles.sectionTitle, { color: c.text }]}>Subtasks</Text>
      {(project.subtasks || []).map((subtask) => (
        <AppCard key={subtask.id} style={styles.card}>
          <View style={styles.subtaskRow}>
            <View style={[styles.check, { backgroundColor: subtask.completed ? `${c.success}18` : c.surfaceAlt }]}>
              <MaterialCommunityIcons
                name={subtask.completed ? "check-circle" : "checkbox-blank-circle-outline"}
                size={24}
                color={subtask.completed ? c.success : c.textMuted}
              />
            </View>
            <View style={styles.copyWrap}>
              <Text style={[styles.title, { color: c.text }]}>{subtask.title}</Text>
              <Text style={[styles.meta, { color: c.textMuted }]}>
                {(subtask.xp_reward || 0)} XP · {(subtask.coin_reward || 0)} coins
                {subtask.assigned_user_id ? ` · assigned` : ""}
              </Text>
              {!!subtask.completed_at && <Text style={[styles.meta, { color: c.textMuted }]}>Completed {new Date(subtask.completed_at).toLocaleDateString()}</Text>}
              {subtask.verification_status === "pending" && <Text style={[styles.meta, { color: c.textMuted }]}>Pending approval</Text>}
              {subtask.verification_status === "rejected" && <Text style={[styles.meta, { color: c.danger }]}>Verification rejected. You can resubmit.</Text>}
            </View>
          </View>
          <AppButton
            title={subtask.completed ? "Completed" : subtask.verification_status === "pending" ? "Pending approval" : (subtask.verification_type && !["none", "self"].includes(subtask.verification_type)) ? "Submit verification" : "Complete subtask"}
            onPress={() => completeSubtask(subtask)}
            disabled={subtask.completed || subtask.verification_status === "pending" || busySubtask === subtask.id}
            variant={subtask.completed ? "secondary" : "primary"}
            style={styles.button}
          />
        </AppCard>
      ))}
    </ScrollView>
  );
}

function RewardPill({ icon, label, color }) {
  return (
    <View style={[styles.rewardPill, { borderColor: `${color}44`, backgroundColor: `${color}12` }]}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={[styles.rewardText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  card: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md },
  title: { ...typography.bodyBold },
  copy: { ...typography.body },
  meta: { ...typography.caption, marginTop: spacing.xs },
  progress: { marginTop: spacing.lg },
  rewardRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  rewardPill: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rewardText: { ...typography.caption },
  subtaskRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  check: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  copyWrap: { flex: 1 },
  button: { marginTop: spacing.md },
  input: { marginTop: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1 },
});
