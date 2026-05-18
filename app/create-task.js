import { Feather } from "@expo/vector-icons";
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
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../lib/theme";

const COIN_OPTIONS = [
  {
    label: "Low",
    value: 5,
    description: "Quick win",
    accent: colors.success,
  },
  {
    label: "Medium",
    value: 10,
    description: "Normal effort",
    accent: colors.cyan,
  },
  {
    label: "High",
    value: 20,
    description: "Focused work",
    accent: colors.blue,
  },
  {
    label: "Life Changing",
    value: 50,
    description: "Major impact",
    accent: colors.coral,
  },
];

function getDifficultyForCoins(coins) {
  if (coins === 5) return "easy";
  if (coins === 10) return "medium";
  return "hard";
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export default function CreateTaskScreen() {
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCoins, setSelectedCoins] =
    useState(10);

  const [dueDate, setDueDate] =
    useState(null);

  const [showPicker, setShowPicker] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  async function createTask() {
    if (!token) return;

    if (!name.trim()) {
      Alert.alert(
        "Missing name",
        "Enter a task name."
      );
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      await api.post(
        "/tasks",
        {
          name: name.trim(),
          description: description.trim(),
          difficulty:
            getDifficultyForCoins(selectedCoins),
          custom_coins: selectedCoins,
          recurrence: "none",
          due_date: dueDate
            ? formatDate(dueDate)
            : null,
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

  function handleDateChange(
    event,
    selectedDate
  ) {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedDate) {
      setDueDate(selectedDate);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Create Task"
        subtitle="Capture a task and turn progress into rewards."
      />

      <AppCard>
        <View style={styles.section}>
          <Text style={styles.label}>
            Task name
          </Text>

          <AppInput
            placeholder="e.g. Clean kitchen"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Description
          </Text>

          <AppInput
            placeholder="Optional notes"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Coin value
          </Text>

          <View style={styles.coinGrid}>
            {COIN_OPTIONS.map((option) => {
              const active =
                selectedCoins === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() =>
                    setSelectedCoins(option.value)
                  }
                  style={[
                    styles.coinOption,
                    {
                      borderColor: active
                        ? option.accent
                        : colors.border,
                      backgroundColor: active
                        ? `${option.accent}12`
                        : colors.surfaceAlt,
                    },
                    active && styles.coinActive,
                  ]}
                >
                  <View
                    style={[
                      styles.coinDot,
                      {
                        backgroundColor:
                          option.accent,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.coinLabel,
                      active && {
                        color: option.accent,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>

                  <Text
                    style={styles.coinValue}
                  >
                    {option.value} coins
                  </Text>

                  <Text
                    style={
                      styles.coinDescription
                    }
                  >
                    {option.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Due date
          </Text>

          <Pressable
            style={styles.dateButton}
            onPress={() =>
              setShowPicker(true)
            }
          >
            <View>
              <Text style={styles.dateLabel}>
                {dueDate
                  ? "Selected date"
                  : "No due date"}
              </Text>

              <Text style={styles.dateText}>
                {dueDate
                  ? formatDate(dueDate)
                  : "Tap to pick a date"}
              </Text>
            </View>

            <View style={styles.dateIconCircle}>
              <Text style={styles.dateIcon}>
                📅
              </Text>
            </View>
          </Pressable>

          {dueDate && (
            <Pressable
              style={styles.clearDateButton}
              onPress={() =>
                setDueDate(null)
              }
            >
              <Text
                style={styles.clearDateText}
              >
                Clear due date
              </Text>
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

        <View style={styles.previewBox}>
          <View style={styles.previewGlow} />

          <View style={styles.previewTop}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>
                📌
              </Text>
            </View>

            <View style={styles.previewText}>
              <Text style={styles.previewTitle}>
                {name.trim() ||
                  "Your task"}
              </Text>

              <Text
                style={styles.previewSubtitle}
              >
                {dueDate
                  ? formatDate(dueDate)
                  : "No due date"}{" "}
                •{" "}
                {getDifficultyForCoins(
                  selectedCoins
                )}{" "}
                • {selectedCoins} coins
              </Text>
            </View>
          </View>

          <View style={styles.previewFooter}>
            <Feather
              name="check-square"
              size={16}
              color={colors.blue}
            />

            <Text style={styles.previewHint}>
              Small wins compound into
              momentum.
            </Text>
          </View>
        </View>
      </AppCard>

      <AppButton
        title={
          submitting
            ? "Creating..."
            : "Create Task"
        }
        onPress={createTask}
        disabled={submitting}
        style={styles.button}
      />

      <Pressable
        style={styles.cancelButton}
        onPress={() =>
          router.replace("/(tabs)/tasks")
        }
      >
        <Text style={styles.cancelText}>
          Cancel
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 80,
  },

  section: {
    marginBottom: spacing.xl,
  },

  label: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  coinGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  coinOption: {
    width: "47%",
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
  },

  coinActive: {
    ...shadows.soft,
  },

  coinDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },

  coinLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },

  coinValue: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },

  coinDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  dateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  dateText: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.xs,
  },

  dateIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  dateIcon: {
    fontSize: 22,
  },

  clearDateButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: `${colors.danger}12`,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
  },

  clearDateText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: "900",
  },

  previewBox: {
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
  },

  previewGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: radii.pill,
    top: -100,
    right: -80,
    backgroundColor: `${colors.blue}14`,
  },

  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconText: {
    fontSize: 28,
  },

  previewText: {
    flex: 1,
  },

  previewTitle: {
    ...typography.h3,
    color: colors.text,
  },

  previewSubtitle: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textTransform: "capitalize",
  },

  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  previewHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  button: {
    marginTop: spacing.xl,
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },

  cancelText: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
});