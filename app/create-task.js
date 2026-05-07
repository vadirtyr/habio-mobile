import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandHeader } from "../components/BrandMark";
import { api } from "../lib/api";
import { colors, radii, shadows, spacing } from "../lib/theme";

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export default function CreateTaskScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function createTask() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Enter a task name.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      await api.post("/tasks", {
        name: name.trim(),
        description: description.trim(),
        difficulty: "medium",
        recurrence: "none",
        due_date: dueDate ? formatDate(dueDate) : null,
      });

      router.replace("/(tabs)/tasks");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDateChange(event, selectedDate) {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (selectedDate) setDueDate(selectedDate);
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <BrandHeader eyebrow="New Task" title="Create Task" />

      <Text style={styles.subtitle}>
        Capture a task, assign a due date, and turn completion into coins.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Task name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Clean kitchen"
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

        <Text style={styles.label}>Due date</Text>

        <Pressable
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
          <View>
            <Text style={styles.dateLabel}>
              {dueDate ? "Selected date" : "No due date"}
            </Text>
            <Text style={styles.dateText}>
              {dueDate ? formatDate(dueDate) : "Tap to pick a date"}
            </Text>
          </View>

          <Text style={styles.dateIcon}>📅</Text>
        </Pressable>

        {dueDate && (
          <Pressable
            style={styles.clearDateButton}
            onPress={() => setDueDate(null)}
          >
            <Text style={styles.clearDateText}>Clear due date</Text>
          </Pressable>
        )}

        {showPicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Preview */}
        <View style={styles.previewBox}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📌</Text>
          </View>

          <View style={styles.previewText}>
            <Text style={styles.previewTitle}>
              {name.trim() || "Your task"}
            </Text>
            <Text style={styles.previewSubtitle}>
              {dueDate ? formatDate(dueDate) : "No due date"} • Medium • Coins
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={createTask}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Creating..." : "Create Task"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace("/(tabs)/tasks")}
      >
        <Text style={styles.cancelText}>Cancel</Text>
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
    marginBottom: spacing.lg,
    lineHeight: 20,
    fontWeight: "600",
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

  dateButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dateLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  dateText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },

  dateIcon: {
    fontSize: 22,
  },

  clearDateButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(239, 68, 68, 0.18)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },

  clearDateText: {
    color: colors.danger || "#EF4444",
    fontWeight: "900",
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
    backgroundColor: "rgba(37, 99, 235, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryBright,
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