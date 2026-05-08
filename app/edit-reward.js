import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandHeader } from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { colors, radii, shadows, spacing } from "../lib/theme";

export default function EditRewardScreen() {
  const { token } = useAuth();
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
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <BrandHeader eyebrow="Edit Reward" title="Update Reward" />

      <Text style={styles.subtitle}>
        Adjust the reward name, notes, or coin cost.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Reward name</Text>
        <TextInput
          style={styles.input}
          placeholder="Reward name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Optional notes"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Coin cost</Text>
        <TextInput
          style={styles.input}
          placeholder="Coin cost"
          placeholderTextColor={colors.textMuted}
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
        />

        <View style={styles.previewBox}>
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
      </View>

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={updateReward}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Saving..." : "Save Changes"}
        </Text>
      </Pressable>

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
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  label: {
    color: colors.text,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    color: colors.text,
    fontWeight: "700",
  },
  textarea: {
    height: 96,
    textAlignVertical: "top",
  },
  previewBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accent,
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
    color: colors.text,
  },
  previewSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontWeight: "700",
  },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radii.lg,
    alignItems: "center",
    marginTop: spacing.sm,
    ...shadows.glow,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: colors.textDark,
    fontWeight: "900",
    fontSize: 16,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: "center",
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: "800",
  },
});