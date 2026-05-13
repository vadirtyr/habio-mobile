import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";

import { BrandHeader } from "../components/BrandMark";
import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";
import ThemedInput from "../components/ThemedInput";
import ThemedScreen from "../components/ThemedScreen";
import ThemedText from "../components/ThemedText";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { shadows } from "../lib/theme/shadows";

const COIN_OPTIONS = [
  { label: "Low", value: 5, description: "Small/easy effort" },
  { label: "Medium", value: 10, description: "Normal effort" },
  { label: "High", value: 20, description: "Hard effort" },
  { label: "Life Changing", value: 50, description: "Major effort" },
];

function getDifficultyForCoins(coins) {
  if (coins === 5) return "easy";
  if (coins === 10) return "medium";
  return "hard";
}

function getInitialCoins(params) {
  const custom = Number(params.custom_coins);

  if ([5, 10, 20, 50].includes(custom)) {
    return custom;
  }

  if (params.difficulty === "easy") return 5;
  if (params.difficulty === "hard") return 20;

  return 10;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export default function EditTaskScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const params = useLocalSearchParams();

  const [name, setName] = useState(params.name || "");
  const [description, setDescription] = useState(params.description || "");
  const [selectedCoins, setSelectedCoins] = useState(getInitialCoins(params));
  const [dueDate, setDueDate] = useState(
    params.due_date ? new Date(params.due_date) : null
  );
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function updateTask() {
    if (!token) return;

    if (!name.trim()) {
      Alert.alert("Missing name", "Enter a task name.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      await api.put(
        `/tasks/${params.id}`,
        {
          name: name.trim(),
          description: description.trim(),
          difficulty: getDifficultyForCoins(selectedCoins),
          custom_coins: selectedCoins,
          due_date: dueDate ? formatDate(dueDate) : null,
          recurrence: params.recurrence || "none",
        },
        token
      );

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
    <ThemedScreen
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <BrandHeader eyebrow="Edit Task" title="Update Task" />

      <ThemedText muted style={styles.subtitle}>
        Adjust the task details, notes, due date, or coin value.
      </ThemedText>

      <ThemedCard>
        <ThemedText style={styles.label}>Task name</ThemedText>

        <ThemedInput
          placeholder="Task name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <ThemedText style={styles.label}>Description</ThemedText>

        <ThemedInput
          placeholder="Optional notes"
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.input}
        />

        <ThemedText style={styles.label}>Coin value</ThemedText>

        <View style={styles.coinGrid}>
          {COIN_OPTIONS.map((option) => {
            const active = selectedCoins === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setSelectedCoins(option.value)}
                style={[
                  styles.coinOption,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.surfaceAlt,
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                  active && {
                    shadowColor: theme.colors.primary,
                    ...shadows.medium,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.coinLabel,
                    {
                      color: active
                        ? theme.colors.primaryText
                        : theme.colors.text,
                    },
                  ]}
                >
                  {option.label}
                </ThemedText>

                <ThemedText
                  style={[
                    styles.coinValue,
                    {
                      color: active
                        ? theme.colors.primaryText
                        : theme.colors.muted,
                    },
                  ]}
                >
                  {option.value} coins
                </ThemedText>

                <ThemedText
                  style={[
                    styles.coinDescription,
                    {
                      color: active
                        ? theme.colors.primaryText
                        : theme.colors.muted,
                    },
                  ]}
                >
                  {option.description}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Due date</ThemedText>

        <Pressable
          style={[
            styles.dateButton,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => setShowPicker(true)}
        >
          <View>
            <ThemedText muted style={styles.dateLabel}>
              {dueDate ? "Selected date" : "No due date"}
            </ThemedText>

            <ThemedText style={styles.dateText}>
              {dueDate ? formatDate(dueDate) : "Tap to pick a date"}
            </ThemedText>
          </View>

          <ThemedText style={styles.dateIcon}>📅</ThemedText>
        </Pressable>

        {dueDate && (
          <Pressable
            style={[
              styles.clearDateButton,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.danger,
              },
            ]}
            onPress={() => setDueDate(null)}
          >
            <ThemedText
              style={[styles.clearDateText, { color: theme.colors.danger }]}
            >
              Clear due date
            </ThemedText>
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

        <View
          style={[
            styles.previewBox,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <ThemedText style={styles.iconText}>📌</ThemedText>
          </View>

          <View style={styles.previewText}>
            <ThemedText style={styles.previewTitle}>
              {name.trim() || "Your task"}
            </ThemedText>

            <ThemedText muted style={styles.previewSubtitle}>
              {dueDate ? formatDate(dueDate) : "No due date"} •{" "}
              {getDifficultyForCoins(selectedCoins)} • {selectedCoins} coins
            </ThemedText>
          </View>
        </View>
      </ThemedCard>

      <ThemedButton
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={updateTask}
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save Changes"}
      </ThemedButton>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace("/(tabs)/tasks")}
      >
        <ThemedText muted style={styles.cancelText}>
          Cancel
        </ThemedText>
      </Pressable>
    </ThemedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    marginBottom: 14,
  },
  coinGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  coinOption: {
    width: "47%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  coinLabel: {
    fontSize: 15,
    fontWeight: "900",
  },
  coinValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  coinDescription: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 16,
  },
  dateButton: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  dateIcon: {
    fontSize: 22,
  },
  clearDateButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 1,
  },
  clearDateText: {
    fontWeight: "900",
  },
  previewBox: {
    marginTop: 8,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
  },
  previewSubtitle: {
    marginTop: 3,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  button: {
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  cancelButton: {
    padding: 14,
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "800",
  },
});