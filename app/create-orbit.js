import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { spacing, typography } from "../lib/theme";

export default function CreateOrbitScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const orbit = await api.createOrbit({ name: name.trim(), description: description.trim() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/orbit-detail", params: { orbitId: orbit.id } });
    } catch (err) {
      Alert.alert("Could not create Orbit", err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Create Shared Orbit" subtitle="Private and invite-only for this first version." />
      <AppCard>
        <Text style={[styles.label, { color: c.text }]}>Name</Text>
        <AppInput value={name} onChangeText={setName} placeholder="Morning Momentum" maxLength={80} />
        <Text style={[styles.label, { color: c.text }]}>Description</Text>
        <AppInput value={description} onChangeText={setDescription} placeholder="What will this group work toward?" multiline maxLength={500} />
        <AppButton title={saving ? "Creating..." : "Create Orbit"} onPress={save} disabled={saving || !name.trim()} style={styles.button} />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, container: { padding: spacing.xl },
  label: { ...typography.bodyBold, marginBottom: spacing.sm, marginTop: spacing.lg },
  button: { marginTop: spacing.xl },
});
