import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const TYPES = [
  ["habit_completions", "Habit completions"], ["task_completions", "Task completions"],
  ["streak_days", "Streak days"], ["xp", "XP"], ["check_in", "Simple check-in"],
];

export default function CreateOrbitGoalScreen() {
  const { orbitId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("habit_completions");
  const [amount, setAmount] = useState("10");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.createOrbitGoal(orbitId, {
        title: title.trim(), description: description.trim(), target_type: type,
        target_amount: Number(amount), start_date: startDate, end_date: endDate || null,
      });
      router.back();
    } catch (err) {
      Alert.alert("Could not create goal", err.message);
    } finally { setSaving(false); }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="New group goal" subtitle="Every member can contribute progress." />
      <AppCard>
        <Text style={[styles.label, { color: c.text }]}>Title</Text>
        <AppInput value={title} onChangeText={setTitle} placeholder="Complete 50 habits together" />
        <Text style={[styles.label, { color: c.text }]}>Description</Text>
        <AppInput value={description} onChangeText={setDescription} placeholder="Optional details" multiline />
        <Text style={[styles.label, { color: c.text }]}>Goal type</Text>
        <View style={styles.chips}>{TYPES.map(([value, label]) => (
          <Pressable key={value} onPress={() => setType(value)} style={[styles.chip, { borderColor: type === value ? c.primary : c.border, backgroundColor: type === value ? `${c.primary}16` : c.surfaceAlt }]}>
            <Text style={[styles.chipText, { color: c.text }]}>{label}</Text>
          </Pressable>
        ))}</View>
        <Text style={[styles.label, { color: c.text }]}>Target amount</Text>
        <AppInput value={amount} onChangeText={setAmount} keyboardType="number-pad" editable={type !== "check_in"} />
        <Text style={[styles.label, { color: c.text }]}>Start date</Text>
        <AppInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <Text style={[styles.label, { color: c.text }]}>End date (optional)</Text>
        <AppInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        <AppButton title={saving ? "Saving..." : "Create goal"} onPress={save} disabled={saving || !title.trim() || Number(amount) < 1} style={styles.button} />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, container: { padding: spacing.xl, paddingBottom: 80 },
  label: { ...typography.bodyBold, marginTop: spacing.lg, marginBottom: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  chipText: { ...typography.caption }, button: { marginTop: spacing.xl },
});
