import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

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

export default function CreateHabitScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const params = useLocalSearchParams();

  const isFirstHabit = params.firstHabit === "true";
  const suggestedName = typeof params.name === "string" ? params.name : "";
  const category = typeof params.category === "string" ? params.category : "";

  const [name, setName] = useState(suggestedName);
  const [description, setDescription] = useState("");
  const [selectedCoins, setSelectedCoins] = useState(10);
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
          difficulty: getDifficultyForCoins(selectedCoins),
          custom_coins: selectedCoins,
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
    <ThemedScreen
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <BrandHeader
        eyebrow={isFirstHabit ? "Start Here" : "New Habit"}
        title={isFirstHabit ? "Create Your First Habit" : "Create Habit"}
      />

      <ThemedText muted style={styles.subtitle}>
        {isFirstHabit
          ? "Start simple. You can use this suggestion or customize it before creating your first habit."
          : "Build a repeatable action and earn coins every time you complete it."}
      </ThemedText>

      {category ? (
        <View
          style={[
            styles.categoryPill,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.success,
            },
          ]}
        >
          <ThemedText
            style={[styles.categoryText, { color: theme.colors.success }]}
          >
            {category}
          </ThemedText>
        </View>
      ) : null}

      <ThemedCard>
        <ThemedText style={styles.label}>Habit name</ThemedText>

        <ThemedInput
          placeholder="e.g. Drink water"
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
                borderColor: theme.colors.success,
              },
            ]}
          >
            <ThemedText style={styles.iconText}>🔥</ThemedText>
          </View>

          <View style={styles.previewText}>
            <ThemedText style={styles.previewTitle}>
              {name.trim() || "Your habit"}
            </ThemedText>

            <ThemedText muted style={styles.previewSubtitle}>
              Daily • {getDifficultyForCoins(selectedCoins)} • {selectedCoins}{" "}
              coins
            </ThemedText>
          </View>
        </View>
      </ThemedCard>

      <ThemedButton
        onPress={createHabit}
        disabled={submitting}
        style={[styles.button, submitting && styles.buttonDisabled]}
      >
        {submitting ? "Creating..." : "Create Habit"}
      </ThemedButton>

      <Pressable style={styles.cancelButton} onPress={handleCancel}>
        <ThemedText muted style={styles.cancelText}>
          {isFirstHabit ? "Choose a different habit" : "Cancel"}
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
    marginBottom: 14,
    lineHeight: 20,
  },
  categoryPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 20,
  },
  categoryText: {
    fontWeight: "900",
    textTransform: "capitalize",
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
    marginTop: 8,
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