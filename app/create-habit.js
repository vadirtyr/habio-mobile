import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandHeader } from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { colors, radii, shadows, spacing } from "../lib/theme";

export default function CreateHabitScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams();

  const isFirstHabit = params.firstHabit === "true";
  const suggestedName = typeof params.name === "string" ? params.name : "";
  const category = typeof params.category === "string" ? params.category : "";

  const [name, setName] = useState(suggestedName);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function createHabit() {
    if (!token) return;

    if (!name.trim()) {
      Alert.alert("Missing name", "Enter a habit name.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      await api.post(
        "/habits",
        {
          name: name.trim(),
          description: description.trim(),
          frequency: "daily",
          difficulty: "medium",
          icon: "flame",
          category: category || null,
        },
        token
      );

      if (isFirstHabit) {
        await SecureStore.setItemAsync("hasCreatedFirstHabit", "true");
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/(tabs)/habits");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (isFirstHabit) {
      router.replace("/choose-habit");
    } else {
      router.replace("/(tabs)/habits");
    }
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <BrandHeader
        eyebrow={isFirstHabit ? "Start Here" : "New Habit"}
        title={isFirstHabit ? "Create Your First Habit" : "Create Habit"}
      />

      <Text style={styles.subtitle}>
        {isFirstHabit
          ? "Start simple. You can use this suggestion or customize it before creating your first habit."
          : "Build a repeatable action and earn coins every time you complete it."}
      </Text>

      {category ? (
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Habit name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Drink water"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Optional notes"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.previewBox}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🔥</Text>
          </View>

          <View style={styles.previewText}>
            <Text style={styles.previewTitle}>
              {name.trim() || "Your habit"}
            </Text>
            <Text style={styles.previewSubtitle}>
              Daily • Medium • 10 coins
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={createHabit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Creating..." : "Create Habit"}
        </Text>
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>
          {isFirstHabit ? "Choose a different habit" : "Cancel"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
    fontWeight: "600",
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    marginBottom: spacing.lg,
  },
  categoryText: {
    color: colors.accent,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  label: {
    color: colors.text,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    color: colors.text,
    fontWeight: "700",
  },
  textarea: {
    height: 96,
    textAlignVertical: "top",
  },
  previewBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  iconText: {
    fontSize: 22,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },
  previewSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontWeight: "700",
  },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radii.lg,
    alignItems: "center",
    marginTop: spacing.sm,
    ...shadows.glow,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: colors.textDark,
    fontWeight: "900",
    fontSize: 16,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: "center",
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: "800",
  },
});