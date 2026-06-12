import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
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
import {
  RecurrenceFields,
  recurrenceFromParams,
  recurrencePayload,
} from "../components/RecurrenceFields";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

import { api } from "../lib/api";

import {
  radii,
  shadows,
  spacing,
  typography,
} from "../lib/theme";

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
  const c = theme.colors;

  const params = useLocalSearchParams();

  const COIN_OPTIONS = [
    {
      label: "Low",
      value: 5,
      description: "Quick win",
      accent: c.success,
    },
    {
      label: "Medium",
      value: 10,
      description: "Normal effort",
      accent: c.cyan || c.primary,
    },
    {
      label: "High",
      value: 20,
      description: "Focused work",
      accent: c.blue || c.primary,
    },
    {
      label: "Life Changing",
      value: 50,
      description: "Major impact",
      accent: c.coral || c.primary,
    },
  ];

  const [name, setName] = useState(params.name || "");

  const [description, setDescription] =
    useState(params.description || "");

  const [selectedCoins, setSelectedCoins] =
    useState(getInitialCoins(params));

  const [dueDate, setDueDate] = useState(
    params.due_date
      ? new Date(params.due_date)
      : null
  );

  const [showPicker, setShowPicker] =
    useState(false);
  const [schedule, setSchedule] = useState(
    recurrenceFromParams(params, "none")
  );

  const [submitting, setSubmitting] =
    useState(false);

  async function updateTask() {
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
      await api.put(
        `/tasks/${params.id}`,
        {
          name: name.trim(),
          description: description.trim(),

          difficulty:
            getDifficultyForCoins(
              selectedCoins
            ),

          custom_coins: selectedCoins,

          due_date: dueDate
            ? formatDate(dueDate)
            : null,

          recurrence: schedule.recurrence_type,
          ...recurrencePayload(schedule),
          show_days_before:
            schedule.recurrence_type === "none"
              ? null
              : recurrencePayload(schedule).show_days_before,
        },
        token
      );

      router.replace("/(tabs)/tasks");
    } catch (error) {
      Alert.alert(
        "Error",
        error.message
      );
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
      style={[
        styles.screen,
        {
          backgroundColor:
            c.background,
        },
      ]}
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={
        false
      }
    >
      <ScreenHeader
        title="Update Task"
        subtitle="Adjust details, timing, or reward value."
      />

      <AppCard>
        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: c.text,
              },
            ]}
          >
            Task name
          </Text>

          <AppInput
            placeholder="Task name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: c.text,
              },
            ]}
          >
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
          <Text
            style={[
              styles.label,
              {
                color: c.text,
              },
            ]}
          >
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
                    setSelectedCoins(
                      option.value
                    )
                  }
                  style={[
                    styles.coinOption,
                    {
                      borderColor: active
                        ? option.accent
                        : c.border,

                      backgroundColor: active
                        ? `${option.accent}12`
                        : c.surfaceAlt,
                    },

                    active &&
                      styles.coinActive,
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
                      {
                        color: active
                          ? option.accent
                          : c.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>

                  <Text
                    style={[
                      styles.coinValue,
                      {
                        color: c.text,
                      },
                    ]}
                  >
                    {option.value} coins
                  </Text>

                  <Text
                    style={[
                      styles.coinDescription,
                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {option.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: c.text,
              },
            ]}
          >
            Due date
          </Text>

          <Pressable
            style={[
              styles.dateButton,
              {
                borderColor:
                  c.border,

                backgroundColor:
                  c.surfaceAlt,
              },
            ]}
            onPress={() =>
              setShowPicker(true)
            }
          >
            <View>
              <Text
                style={[
                  styles.dateLabel,
                  {
                    color:
                      c.textMuted ||
                      c.muted,
                  },
                ]}
              >
                {dueDate
                  ? "Selected date"
                  : "No due date"}
              </Text>

              <Text
                style={[
                  styles.dateText,
                  {
                    color: c.text,
                  },
                ]}
              >
                {dueDate
                  ? formatDate(
                      dueDate
                    )
                  : "Tap to pick a date"}
              </Text>
            </View>

            <View
              style={[
                styles.dateIconCircle,
                {
                  backgroundColor:
                    c.surface,

                  borderColor:
                    c.border,
                },
              ]}
            >
              <Text
                style={
                  styles.dateIcon
                }
              >
                📅
              </Text>
            </View>
          </Pressable>

          {dueDate && (
            <Pressable
              style={[
                styles.clearDateButton,
                {
                  backgroundColor:
                    `${c.danger}12`,

                  borderColor:
                    `${c.danger}30`,
                },
              ]}
              onPress={() =>
                setDueDate(null)
              }
            >
              <Text
                style={[
                  styles.clearDateText,
                  {
                    color:
                      c.danger,
                  },
                ]}
              >
                Clear due date
              </Text>
            </Pressable>
          )}

          {showPicker && (
            <DateTimePicker
              value={
                dueDate ||
                new Date()
              }
              mode="date"
              display="default"
              onChange={
                handleDateChange
              }
            />
          )}
        </View>

        <RecurrenceFields
          value={schedule}
          onChange={setSchedule}
          allowNone
        />

        <View
          style={[
            styles.previewBox,
            {
              borderColor:
                c.border,

              backgroundColor:
                c.surfaceAlt,
            },
          ]}
        >
          <View
            style={[
              styles.previewGlow,
              {
                backgroundColor:
                  `${
                    c.blue ||
                    c.primary
                  }14`,
              },
            ]}
          />

          <View
            style={
              styles.previewTop
            }
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor:
                    c.surface,

                  borderColor:
                    c.border,
                },
              ]}
            >
              <Text
                style={
                  styles.iconText
                }
              >
                📌
              </Text>
            </View>

            <View
              style={
                styles.previewText
              }
            >
              <Text
                style={[
                  styles.previewTitle,
                  {
                    color:
                      c.text,
                  },
                ]}
              >
                {name.trim() ||
                  "Your task"}
              </Text>

              <Text
                style={[
                  styles.previewSubtitle,
                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                {dueDate
                  ? formatDate(
                      dueDate
                    )
                  : "No due date"}{" "}
                •{" "}
                {getDifficultyForCoins(
                  selectedCoins
                )}{" "}
                •{" "}
                {selectedCoins} coins
              </Text>
            </View>
          </View>

          <View
            style={
              styles.previewFooter
            }
          >
            <Feather
              name="check-square"
              size={16}
              color={
                c.blue ||
                c.primary
              }
            />

            <Text
              style={[
                styles.previewHint,
                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Progress comes from execution.
            </Text>
          </View>
        </View>
      </AppCard>

      <AppButton
        title={
          submitting
            ? "Saving..."
            : "Save Changes"
        }
        onPress={updateTask}
        disabled={submitting}
        style={styles.button}
      />

      <Pressable
        style={styles.cancelButton}
        onPress={() =>
          router.replace(
            "/(tabs)/tasks"
          )
        }
      >
        <Text
          style={[
            styles.cancelText,
            {
              color:
                c.textMuted ||
                c.muted,
            },
          ]}
        >
          Cancel
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  },

  coinValue: {
    ...typography.h3,
    marginTop: spacing.xs,
  },

  coinDescription: {
    ...typography.caption,
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  dateButton: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  dateText: {
    ...typography.bodyBold,
    marginTop: spacing.xs,
  },

  dateIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
    borderWidth: 1,
  },

  clearDateText: {
    ...typography.caption,
    fontWeight: "900",
  },

  previewBox: {
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },

  previewGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: radii.pill,
    top: -100,
    right: -80,
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
    borderWidth: 1,
  },

  iconText: {
    fontSize: 28,
  },

  previewText: {
    flex: 1,
  },

  previewTitle: {
    ...typography.h3,
  },

  previewSubtitle: {
    ...typography.bodyBold,
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
  },
});
