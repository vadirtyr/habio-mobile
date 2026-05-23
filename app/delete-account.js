import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function DeleteAccountScreen() {
  const { token, logout } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    if (confirmation.trim().toLowerCase() !== "delete") {
      Alert.alert(
        "Confirmation required",
        'Type "delete" to permanently remove your account.'
      );
      return;
    }

    Alert.alert("Delete account?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: confirmDelete,
      },
    ]);
  }

  async function confirmDelete() {
    if (submitting) return;

    setSubmitting(true);

    try {
      await api.delete("/auth/me", token);
      await logout();
      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Delete failed",
        error?.message || "Unable to delete account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title="Delete account"
          subtitle="This permanently removes your account, habits, rewards, streaks, and progress."
        />

        <AppCard
          style={[
            styles.warningCard,
            {
              borderColor: c.danger,
              backgroundColor: `${c.danger}08`,
            },
          ]}
        >
          <Text style={[styles.warningTitle, { color: c.danger }]}>
            This action is permanent
          </Text>

          <Text style={[styles.warningText, { color: c.textSecondary }]}>
            Type <Text style={[styles.bold, { color: c.text }]}>delete</Text>{" "}
            below to confirm.
          </Text>

          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="Type delete"
            placeholderTextColor={c.textMuted || c.muted}
            style={[
              styles.input,
              {
                borderColor: c.border,
                backgroundColor: c.surfaceAlt,
                color: c.text,
              },
            ]}
            autoCapitalize="none"
          />
        </AppCard>

        <AppButton
          title={submitting ? "Deleting..." : "Delete account"}
          onPress={handleDelete}
          disabled={submitting}
          variant="coral"
          style={[
            styles.deleteButton,
            {
              backgroundColor: c.danger,
              borderColor: c.danger,
            },
          ]}
        />

        <AppButton
          title="Cancel"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.cancelButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingTop: 56,
    paddingBottom: 120,
  },

  warningCard: {
    marginTop: spacing.lg,
  },

  warningTitle: {
    ...typography.h3,
  },

  warningText: {
    ...typography.body,
    marginTop: spacing.sm,
    lineHeight: 22,
  },

  bold: {
    fontWeight: "900",
  },

  input: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...typography.bodyBold,
  },

  deleteButton: {
    marginTop: spacing.xl,
  },

  cancelButton: {
    marginTop: spacing.md,
  },
});