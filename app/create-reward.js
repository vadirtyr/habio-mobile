import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { api } from "../lib/api";
import { colors, radii, spacing, typography } from "../lib/theme";

export default function CreateRewardScreen() {
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function createReward() {
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
      await api.post(
        "/rewards",
        {
          name: name.trim(),
          description: description.trim(),
          cost: parsedCost,
          icon: "gift",
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Create Reward"
        subtitle="Add something worth earning."
      />

      <AppCard>
        <View style={styles.section}>
          <Text style={styles.label}>Reward name</Text>
          <AppInput
            placeholder="e.g. Movie night"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <AppInput
            placeholder="Optional notes"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Coin cost</Text>
          <AppInput
            placeholder="e.g. 50"
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.previewBox}>
          <View style={styles.previewGlow} />

          <View style={styles.previewTop}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🎁</Text>
            </View>

            <View style={styles.previewText}>
              <Text style={styles.previewTitle}>
                {name.trim() || "Your reward"}
              </Text>

              <Text style={styles.previewSubtitle}>
                {cost ? `${cost} coins` : "Set a coin cost"}
              </Text>
            </View>
          </View>

          <View style={styles.previewFooter}>
            <Feather name="gift" size={16} color={colors.gold} />
            <Text style={styles.previewHint}>Make progress feel real.</Text>
          </View>
        </View>
      </AppCard>

      <AppButton
        title={submitting ? "Creating..." : "Create Reward"}
        onPress={createReward}
        disabled={submitting}
        style={styles.button}
      />

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace("/(tabs)/rewards")}
      >
        <Text style={styles.cancelText}>Cancel</Text>
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
    backgroundColor: `${colors.gold}16`,
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