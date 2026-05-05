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
import { api } from "../lib/api";

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

    if (selectedDate) {
      setDueDate(selectedDate);
    }
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>New task</Text>
        <Text style={styles.title}>Create Task</Text>
        <Text style={styles.subtitle}>
          Capture a task, assign a due date, and turn completion into coins.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Task name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Clean kitchen"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Optional notes"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Due date</Text>
        <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <View>
            <Text style={styles.dateButtonLabel}>
              {dueDate ? "Selected date" : "No due date"}
            </Text>
            <Text style={styles.dateButtonText}>
              {dueDate ? formatDate(dueDate) : "Tap to pick a date"}
            </Text>
          </View>
          <Text style={styles.dateIcon}>📅</Text>
        </Pressable>

        {dueDate && (
          <Pressable style={styles.clearDateButton} onPress={() => setDueDate(null)}>
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
    backgroundColor: "#F6F7FB",
  },
  container: {
    padding: 20,
    paddingTop: 34,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#111827",
    marginTop: 2,
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 21,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  label: {
    color: "#374151",
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    color: "#111827",
    fontWeight: "600",
  },
  textarea: {
    height: 96,
    textAlignVertical: "top",
  },
  dateButton: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  dateIcon: {
    fontSize: 24,
  },
  clearDateButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 8,
  },
  clearDateText: {
    color: "#B91C1C",
    fontWeight: "900",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
  },
  cancelText: {
    color: "#6B7280",
    fontWeight: "800",
  },
});