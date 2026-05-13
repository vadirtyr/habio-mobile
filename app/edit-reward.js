import { router, useLocalSearchParams } from "expo-router";
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

export default function EditRewardScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const params = useLocalSearchParams();

  const [name, setName] = useState(params.name || "");
  const [description, setDescription] = useState(params.description || "");
  const [cost, setCost] = useState(params.cost ? String(params.cost) : "");
  const [submitting, setSubmitting] = useState(false);

  async function updateReward() {
    if (!token) return;

    const parsedCost = Number(cost);

    if (!name.trim()) {
      Alert.alert("Missing name", "Enter a reward name.");
      return;
    }

    if (!parsedCost || parsedCost <= 0) {
      Alert.alert("Invalid cost", "Enter a coin cost greater than 0.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      await api.put(
        `/rewards/${params.id}`,
        {
          name: name.trim(),
          description: description.trim(),
          cost: parsedCost,
          icon: params.icon || "gift",
        },
        token
      );

      router.replace("/(tabs)/rewards");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedScreen
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <BrandHeader eyebrow="Edit Reward" title="Update Reward" />

      <ThemedText muted style={styles.subtitle}>
        Adjust the reward name, notes, or coin cost.
      </ThemedText>

      <ThemedCard>
        <ThemedText style={styles.label}>Reward name</ThemedText>
        <ThemedInput
          placeholder="Reward name"
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

        <ThemedText style={styles.label}>Coin cost</ThemedText>
        <ThemedInput
          placeholder="Coin cost"
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
          style={styles.input}
        />

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
            <ThemedText style={styles.iconText}>🎁</ThemedText>
          </View>

          <View style={styles.previewText}>
            <ThemedText style={styles.previewTitle}>
              {name.trim() || "Your reward"}
            </ThemedText>
            <ThemedText muted style={styles.previewSubtitle}>
              {cost ? `${cost} coins` : "Set a coin cost"}
            </ThemedText>
          </View>
        </View>
      </ThemedCard>

      <ThemedButton
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={updateReward}
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save Changes"}
      </ThemedButton>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace("/(tabs)/rewards")}
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