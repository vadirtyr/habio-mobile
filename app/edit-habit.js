import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import { normalizeReminderTime } from "../lib/reminders";

import {
  radii,
  shadows,
  spacing,
  typography,
} from "../lib/theme";

const COIN_OPTIONS = [
  { label: "Low", value: 5, description: "Small daily effort" },
  { label: "Medium", value: 10, description: "Balanced routine" },
  { label: "High", value: 20, description: "Focused challenge" },
  { label: "Life Changing", value: 50, description: "Major commitment" },
];

function getDifficultyForCoins(coins) {
  if (coins === 5) return "easy";
  if (coins === 10) return "medium";
  return "hard";
}

function getInitialCoins(params, isMaintenance) {
  if (isMaintenance) return 1;

  const custom = Number(params.custom_coins);

  if ([5, 10, 20, 50].includes(custom)) return custom;
  if (params.difficulty === "easy") return 5;
  if (params.difficulty === "hard") return 20;

  return 10;
}

export default function EditHabitScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const params = useLocalSearchParams();
  const isMaintenance = params.category === "maintenance";

  const [name, setName] = useState(params.name || "");
  const [description, setDescription] = useState(params.description || "");
  const [selectedCoins, setSelectedCoins] = useState(
    getInitialCoins(params, isMaintenance)
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    params.reminder_enabled === "true" || params.reminder_enabled === true
  );
  const [reminderTime, setReminderTime] = useState(
    params.reminder_time || "20:00"
  );
  const [weeklyTarget, setWeeklyTarget] = useState(String(params.weekly_target || "1"));
  const [schedule, setSchedule] = useState(
    recurrenceFromParams(params, "daily")
  );
  const [submitting, setSubmitting] = useState(false);

  async function updateHabit() {
    if (!token) return;

    if (!name.trim()) {
      Alert.alert("Missing name", "Enter a habit name.");
      return;
    }

    const cleanReminderTime = normalizeReminderTime(reminderTime);

    if (reminderEnabled && !cleanReminderTime) {
      Alert.alert("Invalid reminder time", "Enter a 24-hour time like 08:00 or 20:00.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      const coins = isMaintenance ? 1 : selectedCoins;

      await api.put(`/habits/${params.id}`, {
        name: name.trim(),
        description: description.trim(),
        frequency: schedule.recurrence_type,
        ...recurrencePayload(schedule),
        weekly_target:
          schedule.recurrence_type === "weekly"
            ? Math.max(1, Number.parseInt(weeklyTarget, 10) || 1)
            : 1,
        difficulty: isMaintenance ? "easy" : getDifficultyForCoins(coins),
        custom_coins: coins,
        icon: params.icon || (isMaintenance ? "pill" : "fire"),
        category: isMaintenance ? "maintenance" : params.category || "custom",
        reminder_enabled: reminderEnabled,
        reminder_time:
          reminderEnabled ? cleanReminderTime : null,
      });

      router.replace("/(tabs)/habits");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const previewCoins = isMaintenance ? 1 : selectedCoins;
  const previewDifficulty = isMaintenance
    ? "maintenance"
    : getDifficultyForCoins(selectedCoins);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: c.background }]}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Update Habit"
        subtitle="Adjust the habit without losing momentum."
      />

      <AppCard>
        {isMaintenance ? (
          <View
            style={[
              styles.maintenanceBanner,
              {
                borderColor: c.border,
                backgroundColor: `${c.cyan || c.primary}10`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={c.cyan || c.primary}
            />

            <View style={styles.maintenanceCopy}>
              <Text style={[styles.maintenanceTitle, { color: c.text }]}>
                Maintenance Habit
              </Text>

              <Text
                style={[
                  styles.maintenanceDescription,
                  { color: c.textSecondary },
                ]}
              >
                Reminder-style habits always award 1 coin to protect the reward
                economy.
              </Text>
            </View>
          </View>
        ) : null}

        <View
            style={[
              styles.reminderCard,
              {
                borderColor: c.border,
                backgroundColor: c.surfaceAlt,
              },
            ]}
          >
            <Text style={[styles.label, { color: c.text }]}>
              Daily Reminder
            </Text>

            <Pressable
              onPress={() =>
                setReminderEnabled((current) => !current)
              }
              style={[
                styles.reminderToggle,
                {
                  borderColor: reminderEnabled
                    ? c.cyan || c.primary
                    : c.border,
                  backgroundColor: reminderEnabled
                    ? `${c.cyan || c.primary}12`
                    : c.surface,
                },
              ]}
            >
              <Text style={[styles.reminderToggleText, { color: c.text }]}>
                {reminderEnabled ? "Enabled" : "Disabled"}
              </Text>
            </Pressable>

            {reminderEnabled ? (
              <AppInput
                placeholder="20:00"
                value={reminderTime}
                onChangeText={setReminderTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            ) : null}

            <Text style={[styles.reminderHelp, { color: c.textSecondary }]}>
              Use 24-hour time for now, like 08:00 or 20:00.
            </Text>
        </View>

        <RecurrenceFields value={schedule} onChange={setSchedule} />

        {schedule.recurrence_type === "weekly" ? (
          <View style={styles.section}>
            <Text style={[styles.label, { color: c.text }]}>
              Target times per week
            </Text>
            <AppInput
              placeholder="1"
              value={weeklyTarget}
              onChangeText={setWeeklyTarget}
              keyboardType="number-pad"
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.label, { color: c.text }]}>
            Habit name
          </Text>

          <AppInput
            placeholder="Habit name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: c.text }]}>
            Description
          </Text>

          <AppInput
            placeholder="Optional notes"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {!isMaintenance ? (
          <View style={styles.section}>
            <Text style={[styles.label, { color: c.text }]}>
              Coin value
            </Text>

            <View style={styles.coinGrid}>
              {COIN_OPTIONS.map((option, index) => {
                const active = selectedCoins === option.value;

                const accentColors = [
                  c.success,
                  c.cyan || c.primary,
                  c.blue || c.primary,
                  c.coral || c.primary,
                ];

                const accent = accentColors[index] || c.primary;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setSelectedCoins(option.value)}
                    style={[
                      styles.coinOption,
                      {
                        borderColor: active ? accent : c.border,
                        backgroundColor: active
                          ? `${accent}12`
                          : c.surfaceAlt,
                      },
                      active && styles.coinActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.coinDot,
                        { backgroundColor: accent },
                      ]}
                    />

                    <Text
                      style={[
                        styles.coinLabel,
                        { color: active ? accent : c.text },
                      ]}
                    >
                      {option.label}
                    </Text>

                    <Text style={[styles.coinValue, { color: c.text }]}>
                      {option.value} coins
                    </Text>

                    <Text
                      style={[
                        styles.coinDescription,
                        { color: c.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.previewBox,
            {
              borderColor: c.border,
              backgroundColor: c.surfaceAlt,
            },
          ]}
        >
          <View
            style={[
              styles.previewGlow,
              { backgroundColor: `${c.cyan || c.primary}14` },
            ]}
          />

          <View style={styles.previewTop}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                },
              ]}
            >
              {isMaintenance ? (
                <MaterialCommunityIcons
                  name={params.icon || "pill"}
                  size={28}
                  color={c.cyan || c.primary}
                />
              ) : (
                <Text style={styles.iconText}>🔥</Text>
              )}
            </View>

            <View style={styles.previewText}>
              <Text style={[styles.previewTitle, { color: c.text }]}>
                {name.trim() || "Your habit"}
              </Text>

              <Text
                style={[
                  styles.previewSubtitle,
                  { color: c.textSecondary },
                ]}
              >
                {schedule.recurrence_type} • {previewDifficulty} •{" "}
                {previewCoins} coin{previewCoins === 1 ? "" : "s"}
              </Text>
            </View>
          </View>

          <View style={styles.previewFooter}>
            <Feather name="repeat" size={16} color={c.cyan || c.primary} />

            <Text
              style={[
                styles.previewHint,
                { color: c.textSecondary },
              ]}
            >
              {isMaintenance
                ? "Small reminders still count toward consistency."
                : "Momentum compounds daily."}
            </Text>
          </View>
        </View>
      </AppCard>

      <AppButton
        title={submitting ? "Saving..." : "Save Changes"}
        onPress={updateHabit}
        disabled={submitting}
        style={styles.button}
      />

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace("/(tabs)/habits")}
      >
        <Text
          style={[
            styles.cancelText,
            { color: c.textMuted || c.muted },
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

  maintenanceBanner: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  maintenanceCopy: {
    flex: 1,
  },

  maintenanceTitle: {
    ...typography.bodyBold,
  },

  maintenanceDescription: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  reminderCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  reminderToggle: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  reminderToggleText: {
    ...typography.bodyBold,
  },

  reminderHelp: {
    ...typography.caption,
    marginTop: spacing.sm,
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
