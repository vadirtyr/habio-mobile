import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  const [mode, setMode] = useState("manual");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getOrbitTemplates()
      .then((data) => setTemplates(data.items || []))
      .catch((err) => Alert.alert("Templates unavailable", err.message));
  }, []);

  function chooseTemplate(template) {
    setMode("template");
    setSelectedTemplate(template);
    setName(template.name_suggestion);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const orbit = mode === "template"
        ? await api.createOrbitFromTemplate({ template_id: selectedTemplate.id, name: name.trim() })
        : await api.createOrbit({ name: name.trim(), description: description.trim() });
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
      <View style={styles.modeRow}>
        <AppButton title="Create manually" variant={mode === "manual" ? "primary" : "secondary"} style={styles.modeButton} onPress={() => { setMode("manual"); setSelectedTemplate(null); }} />
        <AppButton title="Start from template" variant={mode === "template" ? "primary" : "secondary"} style={styles.modeButton} onPress={() => setMode("template")} />
      </View>

      {mode === "template" && <>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Choose a template</Text>
        {templates.map((template) => <Pressable key={template.id} onPress={() => chooseTemplate(template)}>
          <AppCard style={[styles.templateCard, selectedTemplate?.id === template.id && { borderColor: c.primary }]}>
            <Text style={[styles.templateTitle, { color: c.text }]}>{template.name}</Text>
            <Text style={[styles.copy, { color: c.textSecondary }]}>{template.description}</Text>
          </AppCard>
        </Pressable>)}
      </>}

      {!!selectedTemplate && <AppCard style={styles.previewCard}>
        <Text style={[styles.templateTitle, { color: c.text }]}>Template preview</Text>
        <Text style={[styles.previewLabel, { color: c.textSecondary }]}>Shared habits</Text>
        {selectedTemplate.habits.map((item) => <Text key={item} style={[styles.copy, { color: c.text }]}>- {item}</Text>)}
        <Text style={[styles.previewLabel, { color: c.textSecondary }]}>Shared tasks</Text>
        {selectedTemplate.tasks.map((item) => <Text key={item} style={[styles.copy, { color: c.text }]}>- {item}</Text>)}
        {!!selectedTemplate.challenge && <Text style={[styles.copy, { color: c.text }]}>Starter challenge: {selectedTemplate.challenge.title}</Text>}
        {!!selectedTemplate.recommended_rewards?.length && <Text style={[styles.copy, { color: c.textSecondary }]}>Reward ideas: {selectedTemplate.recommended_rewards.join(", ")}</Text>}
      </AppCard>}

      <AppCard>
        <Text style={[styles.label, { color: c.text }]}>Name</Text>
        <AppInput value={name} onChangeText={setName} placeholder="Morning Momentum" maxLength={80} />
        {mode === "manual" && <>
          <Text style={[styles.label, { color: c.text }]}>Description</Text>
          <AppInput value={description} onChangeText={setDescription} placeholder="What will this group work toward?" multiline maxLength={500} />
        </>}
        <AppButton title={saving ? "Creating..." : mode === "template" ? "Create from template" : "Create Orbit"} onPress={save} disabled={saving || !name.trim() || (mode === "template" && !selectedTemplate)} style={styles.button} />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, container: { padding: spacing.xl, paddingBottom: 80 },
  modeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }, modeButton: { flex: 1 },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md }, templateCard: { marginBottom: spacing.sm, borderWidth: 2, borderColor: "transparent" }, previewCard: { marginBottom: spacing.lg },
  templateTitle: { ...typography.h3 }, copy: { ...typography.body, marginTop: spacing.xs }, previewLabel: { ...typography.caption, marginTop: spacing.md },
  label: { ...typography.bodyBold, marginBottom: spacing.sm, marginTop: spacing.lg },
  button: { marginTop: spacing.xl },
});
