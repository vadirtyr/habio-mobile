import { Feather } from "@expo/vector-icons";
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
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";

import {
  radii,
  shadows,
  spacing,
  typography,
} from "../lib/theme";

const COIN_OPTIONS = [
  {
    label: "Low",
    value: 5,
    description: "Small daily effort",
  },
  {
    label: "Medium",
    value: 10,
    description: "Balanced routine",
  },
  {
    label: "High",
    value: 20,
    description: "Focused challenge",
  },
  {
    label: "Life Changing",
    value: 50,
    description: "Major commitment",
  },
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

export default function EditHabitScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const params = useLocalSearchParams();

  const [name, setName] = useState(params.name || "");
  const [description, setDescription] =
    useState(params.description || "");

  const [selectedCoins, setSelectedCoins] =
    useState(getInitialCoins(params));

  const [submitting, setSubmitting] =
    useState(false);

  async function updateHabit() {
    if (!token) return;

    if (!name.trim()) {
      Alert.alert(
        "Missing name",
        "Enter a habit name."
      );

      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      await api.put(
        `/habits/${params.id}`,
        {
          name: name.trim(),
          description: description.trim(),
          frequency:
            params.frequency || "daily",

          difficulty:
            getDifficultyForCoins(
              selectedCoins
            ),

          custom_coins: selectedCoins,
          icon: params.icon || "flame",
        },
        token
      );

      router.replace("/(tabs)/habits");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={[
        styles.screen,
        {
          backgroundColor: c.background,
        },
      ]}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Update Habit"
        subtitle="Adjust the habit without losing momentum."
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
            Habit name
          </Text>

          <AppInput
            placeholder="Habit name"
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
            {COIN_OPTIONS.map((option, index) => {
              const active =
                selectedCoins === option.value;

              const accentColors = [
                c.success,
                c.cyan || c.primary,
                c.blue || c.primary,
                c.coral || c.primary,
              ];

              const accent =
                accentColors[index] ||
                c.primary;

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
                        ? accent
                        : c.border,

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
                      {
                        backgroundColor:
                          accent,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.coinLabel,
                      {
                        color: active
                          ? accent
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

        <View
          style={[
            styles.previewBox,
            {
              borderColor: c.border,
              backgroundColor:
                c.surfaceAlt,
            },
          ]}
        >
          <View
            style={[
              styles.previewGlow,
              {
                backgroundColor: `${
                  c.cyan || c.primary
                }14`,
              },
            ]}
          />

          <View style={styles.previewTop}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor:
                    c.surface,

                  borderColor: c.border,
                },
              ]}
            >
              <Text style={styles.iconText}>
                🔥
              </Text>
            </View>

            <View style={styles.previewText}>
              <Text
                style={[
                  styles.previewTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                {name.trim() ||
                  "Your habit"}
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
                {params.frequency ||
                  "daily"}{" "}
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
              name="repeat"
              size={16}
              color={
                c.cyan || c.primary
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
              Momentum compounds daily.
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
        onPress={updateHabit}
        disabled={submitting}
        style={styles.button}
      />

      <Pressable
        style={styles.cancelButton}
        onPress={() =>
          router.replace("/(tabs)/habits")
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