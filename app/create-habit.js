import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AnimatedPressable } from "../components/AnimatedPressable";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const HABIT_TYPES = [
  {
    id: "standard",
    label: "Standard",
    description: "Earn normal rewards",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    description: "Reminder-style habit",
  },
];

const DIFFICULTIES = [
  { key: "easy", label: "Easy", coins: 5 },
  { key: "medium", label: "Medium", coins: 10 },
  { key: "hard", label: "Hard", coins: 20 },
];

const ICONS = [
  "fire",
  "water",
  "walk",
  "book-open-page-variant",
  "meditation",
  "broom",
  "pill",
  "bell-outline",
  "heart-pulse",
];

const MAINTENANCE_PRESETS = [
  {
    name: "Take Medication",
    description: "A low-reward maintenance reminder.",
    icon: "pill",
  },
  {
    name: "Take Vitamins",
    description: "Quick daily wellness reminder.",
    icon: "pill",
  },
  {
    name: "Check Blood Pressure",
    description: "Simple health maintenance check.",
    icon: "heart-pulse",
  },
  {
    name: "Water Plants",
    description: "Small recurring care reminder.",
    icon: "water",
  },
];

export default function CreateHabitScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [icon, setIcon] = useState("fire");
  const [habitType, setHabitType] = useState("standard");
  const [submitting, setSubmitting] = useState(false);

  function chooseHabitType(typeId) {
    setHabitType(typeId);

    if (typeId === "maintenance") {
      setDifficulty("easy");
      setIcon("pill");
    }
  }

  function applyPreset(preset) {
    setName(preset.name);
    setDescription(preset.description);
    setIcon(preset.icon);
    setHabitType("maintenance");
    setDifficulty("easy");
  }

  async function handleCreate() {
    const cleanName = name.trim();
    const cleanDescription = description.trim();

    if (!cleanName) {
      Alert.alert("Missing name", "Give this habit a name.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      await api.post(
        "/habits",
        {
          name: cleanName,
          description: cleanDescription,
          frequency: "daily",
          difficulty: habitType === "maintenance" ? "easy" : difficulty,
          custom_coins: habitType === "maintenance" ? 1 : null,
          icon,
          category:
            habitType === "maintenance"
              ? "maintenance"
              : "custom",
        },
        token
      );

      router.replace("/(tabs)/habits");
    } catch (error) {
      Alert.alert(
        "Could not create habit",
        error?.message || "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title="Create Habit"
          subtitle="Add a small repeatable action to your orbit."
        />

        <AppCard style={styles.card}>
          <Text style={[styles.label, { color: c.textSecondary }]}>
            Habit name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={
              habitType === "maintenance"
                ? "Example: Take medication"
                : "Example: Drink water"
            }
            placeholderTextColor={c.textMuted || c.muted}
            style={[
              styles.input,
              {
                borderColor: c.border,
                backgroundColor: c.surfaceAlt,
                color: c.text,
              },
            ]}
            maxLength={80}
          />

          <Text style={[styles.label, { color: c.textSecondary }]}>
            Habit Type
          </Text>

          <View style={styles.typeRow}>
            {HABIT_TYPES.map((type) => {
              const selected = habitType === type.id;
              const accentColor = c.cyan || c.primary;

              return (
                <AnimatedPressable
                  key={type.id}
                  style={[
                    styles.typeCard,
                    {
                      borderColor: selected ? accentColor : c.border,
                      backgroundColor: selected
                        ? `${accentColor}12`
                        : c.surfaceAlt,
                    },
                  ]}
                  onPress={() => chooseHabitType(type.id)}
                >
                  <Text
                    style={[
                      styles.typeTitle,
                      {
                        color: selected ? accentColor : c.text,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>

                  <Text
                    style={[
                      styles.typeDescription,
                      { color: c.textSecondary },
                    ]}
                  >
                    {type.description}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {habitType === "maintenance" ? (
            <>
              <Text style={[styles.label, { color: c.textSecondary }]}>
                Quick Maintenance Presets
              </Text>

              <View style={styles.presetGrid}>
                {MAINTENANCE_PRESETS.map((preset) => (
                  <AnimatedPressable
                    key={preset.name}
                    style={[
                      styles.presetButton,
                      {
                        borderColor: c.border,
                        backgroundColor: c.surfaceAlt,
                      },
                    ]}
                    onPress={() => applyPreset(preset)}
                  >
                    <MaterialCommunityIcons
                      name={preset.icon}
                      size={20}
                      color={c.cyan || c.primary}
                    />

                    <Text
                      style={[
                        styles.presetText,
                        { color: c.text },
                      ]}
                    >
                      {preset.name}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              <View
                style={[
                  styles.maintenanceNote,
                  {
                    borderColor: c.border,
                    backgroundColor: `${c.cyan || c.primary}10`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={22}
                  color={c.cyan || c.primary}
                />

                <Text
                  style={[
                    styles.maintenanceText,
                    { color: c.textSecondary },
                  ]}
                >
                  Maintenance habits are reminder-style habits and always award
                  1 coin.
                </Text>
              </View>
            </>
          ) : null}

          <Text style={[styles.label, { color: c.textSecondary }]}>
            Description
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional"
            placeholderTextColor={c.textMuted || c.muted}
            style={[
              styles.input,
              styles.textArea,
              {
                borderColor: c.border,
                backgroundColor: c.surfaceAlt,
                color: c.text,
              },
            ]}
            multiline
            maxLength={300}
          />

          {habitType === "standard" ? (
            <>
              <Text style={[styles.label, { color: c.textSecondary }]}>
                Difficulty
              </Text>

              <View style={styles.optionsRow}>
                {DIFFICULTIES.map((item) => {
                  const selected = difficulty === item.key;
                  const accentColor = c.cyan || c.primary;

                  return (
                    <AnimatedPressable
                      key={item.key}
                      style={[
                        styles.option,
                        {
                          borderColor: selected ? accentColor : c.border,
                          backgroundColor: selected
                            ? `${accentColor}12`
                            : c.surfaceAlt,
                        },
                      ]}
                      onPress={() => setDifficulty(item.key)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: selected ? accentColor : c.text,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>

                      <Text
                        style={[
                          styles.optionSub,
                          { color: c.textSecondary },
                        ]}
                      >
                        +{item.coins} coins
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={[styles.label, { color: c.textSecondary }]}>
            Icon
          </Text>

          <View style={styles.iconGrid}>
            {ICONS.map((item) => {
              const selected = icon === item;
              const accentColor = c.cyan || c.primary;

              return (
                <AnimatedPressable
                  key={item}
                  style={[
                    styles.iconButton,
                    {
                      borderColor: selected ? accentColor : c.border,
                      backgroundColor: selected
                        ? `${accentColor}12`
                        : c.surfaceAlt,
                    },
                  ]}
                  onPress={() => setIcon(item)}
                >
                  <MaterialCommunityIcons
                    name={item}
                    size={24}
                    color={
                      selected
                        ? accentColor
                        : c.textMuted || c.muted
                    }
                  />
                </AnimatedPressable>
              );
            })}
          </View>
        </AppCard>

        <AppButton
          title={submitting ? "Creating..." : "Create Habit"}
          onPress={handleCreate}
          disabled={submitting}
          style={styles.primaryButton}
        />

        <AppButton
          title="Cancel"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.cancelButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingTop: 56,
    paddingBottom: 120,
  },

  card: {
    marginTop: spacing.lg,
  },

  label: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...typography.bodyBold,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  typeCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },

  typeTitle: {
    ...typography.bodyBold,
  },

  typeDescription: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 17,
  },

  presetGrid: {
    gap: spacing.sm,
  },

  presetButton: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  presetText: {
    ...typography.bodyBold,
  },

  maintenanceNote: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  maintenanceText: {
    flex: 1,
    ...typography.caption,
    lineHeight: 18,
    fontWeight: "700",
  },

  optionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  option: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },

  optionText: {
    ...typography.bodyBold,
  },

  optionSub: {
    ...typography.caption,
    marginTop: spacing.xs,
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  iconButton: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButton: {
    marginTop: spacing.xl,
  },

  cancelButton: {
    marginTop: spacing.md,
  },
});