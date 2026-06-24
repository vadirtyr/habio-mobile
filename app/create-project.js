import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { spacing, typography } from "../lib/theme";

function parseSubtasks(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*?)\s+@([A-Za-z0-9_-]+)$/);
      return {
        title: (match ? match[1] : line).trim(),
        assigned_user_id: match ? match[2] : null,
        xp_reward: 0,
        coin_reward: 0,
      };
    });
}

export default function CreateProjectScreen() {
  const { orbitId, orbitName } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState("50");
  const [coinReward, setCoinReward] = useState("25");
  const [verificationType, setVerificationType] = useState("none");
  const [subtasks, setSubtasks] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert("Title required", "Give this project a title.");
      return;
    }
    setSaving(true);
    try {
      const project = await api.createProject({
        title: cleanTitle,
        description: description.trim(),
        orbit_id: orbitId || null,
        xp_reward: Number(xpReward) || 0,
        coin_reward: Number(coinReward) || 0,
        verification_type: verificationType.trim() || "none",
        subtasks: parseSubtasks(subtasks),
      });
      router.replace({ pathname: "/project-detail", params: { projectId: project.id } });
    } catch (err) {
      Alert.alert("Could not create project", err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: c.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Create Project"
          subtitle={orbitName ? `For ${orbitName}` : "Plan a larger goal with subtasks."}
        />
        <AppCard>
          <Text style={[styles.label, { color: c.text }]}>Title</Text>
          <AppInput value={title} onChangeText={setTitle} placeholder="Plan summer trip" maxLength={160} />

          <Text style={[styles.label, { color: c.text }]}>Description</Text>
          <AppInput value={description} onChangeText={setDescription} placeholder="Optional details" multiline maxLength={2000} />

          <Text style={[styles.label, { color: c.text }]}>Project rewards</Text>
          <AppInput value={xpReward} onChangeText={setXpReward} placeholder="XP reward" keyboardType="number-pad" />
          <AppInput value={coinReward} onChangeText={setCoinReward} placeholder="Coin reward" keyboardType="number-pad" style={styles.stackedInput} />

          <Text style={[styles.label, { color: c.text }]}>Verification</Text>
          <Text style={[styles.help, { color: c.textSecondary }]}>Use none, self, text, photo, approval, or photo_approval. Approval types wait for Orbit owner/admin review before rewards are awarded.</Text>
          <AppInput value={verificationType} onChangeText={setVerificationType} placeholder="none" autoCapitalize="none" />

          <Text style={[styles.label, { color: c.text }]}>Subtasks</Text>
          <Text style={[styles.help, { color: c.textSecondary }]}>
            Add one subtask per line. For Orbit projects, append @user_id to assign a member.
          </Text>
          <AppInput
            value={subtasks}
            onChangeText={setSubtasks}
            placeholder={"Book lodging\nPack bags\nConfirm schedule @member_id"}
            multiline
            style={styles.subtasks}
          />

          <AppButton title={saving ? "Creating..." : "Create Project"} onPress={save} disabled={saving || !title.trim()} style={styles.button} />
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  label: { ...typography.bodyBold, marginTop: spacing.lg, marginBottom: spacing.sm },
  help: { ...typography.caption, marginBottom: spacing.sm },
  stackedInput: { marginTop: spacing.sm },
  subtasks: { minHeight: 140 },
  button: { marginTop: spacing.xl },
});
