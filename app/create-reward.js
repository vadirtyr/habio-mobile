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
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function CreateRewardScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

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
      style={[styles.screen, { backgroundColor: c.background }]}
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
          <Text style={[styles.label, { color: c.text }]}>
            Reward name
          </Text>

          <AppInput
            placeholder="e.g. Movie night"
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

        <View style={styles.section}>
          <Text style={[styles.label, { color: c.text }]}>
            Coin cost
          </Text>

          <AppInput
            placeholder="e.g. 50"
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />
        </View>

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
              {
                backgroundColor: `${c.gold || c.primary}16`,
              },
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
              <Text style={styles.iconText}>🎁</Text>
            </View>

            <View style={styles.previewText}>
              <Text style={[styles.previewTitle, { color: c.text }]}>
                {name.trim() || "Your reward"}
              </Text>

              <Text
                style={[
                  styles.previewSubtitle,
                  { color: c.textSecondary },
                ]}
              >
                {cost ? `${cost} coins` : "Set a coin cost"}
              </Text>
            </View>
          </View>

          <View style={styles.previewFooter}>
            <Feather
              name="gift"
              size={16}
              color={c.gold || c.primary}
            />

            <Text
              style={[
                styles.previewHint,
                { color: c.textSecondary },
              ]}
            >
              Make progress feel real.
            </Text>
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

  section: {
    marginBottom: spacing.xl,
  },

  label: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
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