import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { spacing, typography } from "../lib/theme";

const ORBIT_TEMPLATES = [
  {
    id: "family",
    name: "Family",
    description: "Shared goals, chores, rewards, and family accountability.",
    nameSuggestion: "Williams Family",
    highlights: ["Starter challenges", "Shared rewards", "Family events"],
  },
  {
    id: "blank",
    name: "Blank Orbit",
    description: "Start with an empty Orbit and customize everything yourself.",
    nameSuggestion: "",
    highlights: ["Private invite-only Orbit", "Add your own habits, tasks, and goals"],
  },
];

export default function CreateOrbitScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [selectedTemplate, setSelectedTemplate] = useState(ORBIT_TEMPLATES[0]);
  const [name, setName] = useState(ORBIT_TEMPLATES[0].nameSuggestion);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  function chooseTemplate(template) {
    setSelectedTemplate(template);
    if (!name.trim() || ORBIT_TEMPLATES.some((item) => item.nameSuggestion === name)) {
      setName(template.nameSuggestion);
    }
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const orbit = await api.createOrbit({
        name: name.trim(),
        description: selectedTemplate.id === "blank" ? description.trim() : "",
        template: selectedTemplate.id,
      });
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
      <Text style={[styles.sectionTitle, { color: c.text }]}>Choose Template</Text>
      {ORBIT_TEMPLATES.map((template) => (
        <Pressable key={template.id} onPress={() => chooseTemplate(template)}>
          <AppCard style={[styles.templateCard, selectedTemplate.id === template.id && { borderColor: c.primary }]}>
            <View style={styles.templateHeader}>
              <Text style={[styles.templateTitle, { color: c.text }]}>{template.name}</Text>
              {selectedTemplate.id === template.id && <Text style={[styles.selectedBadge, { color: c.primary }]}>Selected</Text>}
            </View>
            <Text style={[styles.copy, { color: c.textSecondary }]}>{template.description}</Text>
            <View style={styles.highlightRow}>
              {template.highlights.map((item) => (
                <Text key={item} style={[styles.highlight, { color: c.textSecondary, borderColor: c.border }]}>
                  {item}
                </Text>
              ))}
            </View>
          </AppCard>
        </Pressable>
      ))}

      <AppCard>
        <Text style={[styles.label, { color: c.text }]}>Name</Text>
        <AppInput value={name} onChangeText={setName} placeholder={selectedTemplate.id === "family" ? "Williams Family" : "Morning Momentum"} maxLength={80} />
        {selectedTemplate.id === "blank" && <>
          <Text style={[styles.label, { color: c.text }]}>Description</Text>
          <AppInput value={description} onChangeText={setDescription} placeholder="What will this group work toward?" multiline maxLength={500} />
        </>}
        <AppButton title={saving ? "Creating..." : selectedTemplate.id === "family" ? "Create Family Orbit" : "Create Blank Orbit"} onPress={save} disabled={saving || !name.trim()} style={styles.button} />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, container: { padding: spacing.xl, paddingBottom: 80 },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  templateCard: { marginBottom: spacing.sm, borderWidth: 2, borderColor: "transparent" },
  templateHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  templateTitle: { ...typography.h3 }, copy: { ...typography.body, marginTop: spacing.xs }, previewLabel: { ...typography.caption, marginTop: spacing.md },
  selectedBadge: { ...typography.caption, textTransform: "uppercase" },
  highlightRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  highlight: { ...typography.caption, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  label: { ...typography.bodyBold, marginBottom: spacing.sm, marginTop: spacing.lg },
  button: { marginTop: spacing.xl },
});
