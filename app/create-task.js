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
} from "react-native";

import { AnimatedPressable } from "../components/AnimatedPressable";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { RecurrenceFields, recurrencePayload } from "../components/RecurrenceFields";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const DIFFICULTIES = [
  { key: "easy", label: "Easy", coins: 5 },
  { key: "medium", label: "Medium", coins: 10 },
  { key: "hard", label: "Hard", coins: 20 },
];

export default function CreateTaskScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [schedule, setSchedule] = useState({
    recurrence_type: "none",
    interval: "1",
    days_of_week: [],
    day_of_month: "",
    annual_month: "",
    annual_day: "",
    show_days_before: 0,
  });
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const cleanDueDate = dueDate.trim();

    if (!cleanName) {
      Alert.alert("Missing name", "Give this task a name.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      await api.post(
        "/tasks",
        {
          name: cleanName,
          description: cleanDescription,
          difficulty,
          recurrence: schedule.recurrence_type,
          ...recurrencePayload(schedule),
          show_days_before:
            schedule.recurrence_type === "none"
              ? null
              : recurrencePayload(schedule).show_days_before,
          due_date: cleanDueDate || null,
        },
        token
      );

      router.replace("/(tabs)/tasks");
    } catch (error) {
      Alert.alert(
        "Could not create task",
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
          title="Create Task"
          subtitle="Add a one-time or recurring task to your orbit."
        />

        <AppCard style={styles.card}>
          <Text style={[styles.label, { color: c.textSecondary }]}>
            Task name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Example: Clean kitchen"
            placeholderTextColor={c.textMuted || c.muted}
            style={[
              styles.input,
              {
                borderColor: c.border,
                backgroundColor: c.surfaceAlt,
                color: c.text,
              },
            ]}
            maxLength={100}
          />

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

          <Text style={[styles.label, { color: c.textSecondary }]}>
            Difficulty
          </Text>

          <OptionRow
            options={DIFFICULTIES}
            value={difficulty}
            onChange={setDifficulty}
            showCoins
          />

          <RecurrenceFields
            value={schedule}
            onChange={setSchedule}
            allowNone
          />

          <Text style={[styles.label, { color: c.textSecondary }]}>
            Due date
          </Text>

          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="Optional: YYYY-MM-DD"
            placeholderTextColor={c.textMuted || c.muted}
            style={[
              styles.input,
              {
                borderColor: c.border,
                backgroundColor: c.surfaceAlt,
                color: c.text,
              },
            ]}
            maxLength={40}
          />
        </AppCard>

        <AppButton
          title={submitting ? "Creating..." : "Create Task"}
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

function OptionRow({ options, value, onChange, showCoins = false }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const accentColor = c.cyan || c.primary;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.optionsRow}
    >
      {options.map((item) => {
        const selected = value === item.key;

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
            onPress={() => onChange(item.key)}
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

            {showCoins ? (
              <Text
                style={[
                  styles.optionSub,
                  { color: c.textSecondary },
                ]}
              >
                +{item.coins} coins
              </Text>
            ) : null}

            {selected ? (
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={accentColor}
                style={styles.optionCheck}
              />
            ) : null}
          </AnimatedPressable>
        );
      })}
    </ScrollView>
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

  optionsRow: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },

  option: {
    minWidth: 112,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    position: "relative",
  },

  optionText: {
    ...typography.bodyBold,
  },

  optionSub: {
    ...typography.caption,
    marginTop: spacing.xs,
  },

  optionCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  primaryButton: {
    marginTop: spacing.xl,
  },

  cancelButton: {
    marginTop: spacing.md,
  },
});
