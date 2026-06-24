import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { getTemplateById, templateCreateOptions } from "../lib/orbitTemplates";
import { spacing, typography } from "../lib/theme";

const ORBIT_TEMPLATES = templateCreateOptions();
const BLANK_TEMPLATE_ID = "blank";
const STARTER_TEMPLATE_COUNT = ORBIT_TEMPLATES.filter((template) => template.id !== BLANK_TEMPLATE_ID).length;

export default function CreateOrbitScreen() {
  const { template } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const initialTemplateId = Array.isArray(template) ? template[0] : template;
  const initialTemplate = initialTemplateId
    ? ORBIT_TEMPLATES.find((item) => item.id === getTemplateById(initialTemplateId).id) || ORBIT_TEMPLATES[0]
    : ORBIT_TEMPLATES[0];
  const [step, setStep] = useState(initialTemplateId ? 1 : 0);
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [name, setName] = useState(initialTemplate.nameSuggestion);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const isFamily = selectedTemplate.id === "family";
  const isScoutTroop = selectedTemplate.id === "scout_troop";
  const isAccountabilityCircle = selectedTemplate.id === "accountability_circle";
  const isFitnessGroup = selectedTemplate.id === "fitness_group";
  const isStudyGroup = selectedTemplate.id === "study_group";
  const isCouples = selectedTemplate.id === "couples";
  const createTitle = saving
    ? "Creating..."
    : isFamily
      ? "Create Family Orbit"
      : isScoutTroop
        ? "Create Scout Troop"
        : isAccountabilityCircle
          ? "Create Accountability Circle"
          : isFitnessGroup
            ? "Create Fitness Group"
            : isStudyGroup
              ? "Create Study Group"
              : isCouples
                ? "Create Couples Orbit"
                : "Create Blank Orbit";
  const namePlaceholder = isFamily
    ? "Williams Family"
    : isScoutTroop
      ? "Troop 123"
      : isAccountabilityCircle
        ? "Weekly Accountability Circle"
        : isFitnessGroup
          ? "Morning Fitness Group"
          : isStudyGroup
            ? "Exam Prep Study Group"
            : isCouples
              ? "Our Shared Orbit"
              : "My Orbit";
  const progressText = `Step ${step + 1} of 3`;
  const nextTitle = selectedTemplate.id === BLANK_TEMPLATE_ID
    ? "Continue with Blank Orbit"
    : `Continue with ${selectedTemplate.name}`;

  function chooseTemplate(template) {
    setSelectedTemplate(template);
    if (!name.trim() || ORBIT_TEMPLATES.some((item) => item.nameSuggestion === name)) {
      setName(template.nameSuggestion);
    }
  }

  function goToNameStep() {
    if (!name.trim()) {
      setName(selectedTemplate.nameSuggestion);
    }
    setStep(1);
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
      <ScreenHeader title="Create an Orbit" subtitle="Build better habits together with templates for families, troops, fitness groups, study groups, and accountability circles." />
      <Text style={[styles.progressText, { color: c.textSecondary }]}>{progressText}</Text>

      {step === 0 && <>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Choose Template</Text>
        <Text style={[styles.helperText, { color: c.textSecondary }]}>Choose a template to start with recommended challenges, rewards, events, and readiness checklists.</Text>
        <Text style={[styles.templateCount, { color: c.textMuted }]}>{STARTER_TEMPLATE_COUNT} recommended templates, plus a blank custom Orbit.</Text>
        {ORBIT_TEMPLATES.map((template) => {
          const isBlank = template.id === BLANK_TEMPLATE_ID;
          const isSelected = selectedTemplate.id === template.id;
          return (
          <Pressable key={template.id} onPress={() => chooseTemplate(template)}>
            <AppCard style={[
              styles.templateCard,
              isBlank && styles.blankTemplateCard,
              isSelected && { borderColor: c.primary, backgroundColor: c.surfaceAlt },
            ]}>
              <View style={styles.templateHeader}>
                <View style={styles.templateTitleRow}>
                  <View style={[styles.templateIconWrap, { backgroundColor: `${c.primary}14` }]}>
                    <MaterialCommunityIcons name={template.icon} size={24} color={c.primary} />
                  </View>
                  <View style={styles.templateTitleCopy}>
                    <Text style={[styles.templateTitle, { color: c.text }]}>{template.name}</Text>
                    {isBlank && <Text style={[styles.optionLabel, { color: c.textMuted }]}>Custom option</Text>}
                  </View>
                </View>
                {isSelected && <Text style={[styles.selectedBadge, { color: c.primary }]}>Selected</Text>}
              </View>
              <Text style={[styles.copy, { color: c.textSecondary }]}>{template.description}</Text>
              {!isBlank && <Text style={[styles.note, { color: c.primary }]}>Recommended starter content will be added automatically. You can customize everything later.</Text>}
              {isBlank && <Text style={[styles.note, { color: c.textMuted }]}>Start empty if you already know exactly what your group needs.</Text>}
              <View style={styles.highlightRow}>
                {template.highlights.map((item) => (
                  <Text key={item} style={[styles.highlight, { color: c.textSecondary, borderColor: c.border }]}>
                    {item}
                  </Text>
                ))}
              </View>
            </AppCard>
          </Pressable>
        );})}
        <AppButton title={nextTitle} onPress={goToNameStep} style={styles.button} />
      </>}

      {step === 1 && <AppCard>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Name Your Orbit</Text>
        <View style={styles.selectedSummary}>
          <View style={[styles.templateIconWrap, { backgroundColor: `${c.primary}14` }]}>
            <MaterialCommunityIcons name={selectedTemplate.icon} size={24} color={c.primary} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.templateTitle, { color: c.text }]}>{selectedTemplate.name}</Text>
            <Text style={[styles.copy, { color: c.textSecondary }]}>{selectedTemplate.description}</Text>
          </View>
        </View>
        {selectedTemplate.id !== "blank" && <Text style={[styles.note, { color: c.primary }]}>Starter content will be added automatically without overwhelming your group. You can edit or delete it later.</Text>}
        <Text style={[styles.label, { color: c.text }]}>Name</Text>
        <AppInput value={name} onChangeText={setName} placeholder={namePlaceholder} maxLength={80} />
        {selectedTemplate.id === "blank" && <>
          <Text style={[styles.label, { color: c.text }]}>Description</Text>
          <AppInput value={description} onChangeText={setDescription} placeholder="What will this group work toward?" multiline maxLength={500} />
        </>}
        <View style={styles.actions}>
          <AppButton title="Back" variant="secondary" onPress={() => setStep(0)} style={styles.actionButton} />
          <AppButton title="Next" onPress={() => setStep(2)} disabled={!name.trim()} style={styles.actionButton} />
        </View>
      </AppCard>}

      {step === 2 && <AppCard>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Create Orbit</Text>
        <View style={styles.selectedSummary}>
          <View style={[styles.templateIconWrap, { backgroundColor: `${c.primary}14` }]}>
            <MaterialCommunityIcons name={selectedTemplate.icon} size={24} color={c.primary} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.templateTitle, { color: c.text }]}>{name.trim()}</Text>
            <Text style={[styles.copy, { color: c.textSecondary }]}>{selectedTemplate.name}</Text>
            {selectedTemplate.id !== "blank" && <Text style={[styles.note, { color: c.primary }]}>Starter content will be added automatically. Customize from there as your group finds its rhythm.</Text>}
            {selectedTemplate.id === "blank" && !!description.trim() && (
              <Text style={[styles.copy, { color: c.textSecondary }]}>{description.trim()}</Text>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <AppButton title="Back" variant="secondary" onPress={() => setStep(1)} style={styles.actionButton} disabled={saving} />
          <AppButton title={createTitle} onPress={save} disabled={saving || !name.trim()} style={styles.actionButton} />
        </View>
      </AppCard>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, container: { padding: spacing.xl, paddingBottom: 80 },
  progressText: { ...typography.caption, marginBottom: spacing.sm, textTransform: "uppercase" },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  helperText: { ...typography.body, marginBottom: spacing.lg },
  templateCount: { ...typography.caption, marginTop: -spacing.sm, marginBottom: spacing.md },
  templateCard: { marginBottom: spacing.sm, borderWidth: 2, borderColor: "transparent" },
  blankTemplateCard: { opacity: 0.92 },
  templateHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  templateTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  templateTitleCopy: { flex: 1 },
  templateIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  templateTitle: { ...typography.h3 }, copy: { ...typography.body, marginTop: spacing.xs }, previewLabel: { ...typography.caption, marginTop: spacing.md },
  optionLabel: { ...typography.caption, marginTop: 2 },
  selectedBadge: { ...typography.caption, textTransform: "uppercase" },
  note: { ...typography.caption, marginTop: spacing.sm },
  highlightRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  highlight: { ...typography.caption, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  selectedSummary: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start", marginBottom: spacing.md },
  summaryCopy: { flex: 1 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  actionButton: { flex: 1 },
  label: { ...typography.bodyBold, marginBottom: spacing.sm, marginTop: spacing.lg },
  button: { marginTop: spacing.xl },
});
