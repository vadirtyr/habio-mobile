import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleResetPassword() {
    const cleanToken = token.trim();

    if (!cleanToken || !newPassword || !confirmPassword) {
      Alert.alert("Missing info", "Please fill out all fields.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Password too short", "Use at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please re-enter your new password.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/auth/reset-password", {
        token: cleanToken,
        new_password: newPassword,
      });

      Alert.alert("Password reset", "You can now log in with your new password.", [
        {
          text: "Log in",
          onPress: () => router.replace("/login"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error?.message || "Unable to reset password."
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
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: c.primary }]}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: c.primary }]}>
            Account recovery
          </Text>

          <Text style={[styles.title, { color: c.text }]}>
            Reset password
          </Text>

          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Enter the reset token from your email, then choose a new password.
          </Text>
        </View>

        <AppCard>
          <Field
            label="Reset token"
            value={token}
            onChangeText={setToken}
            placeholder="Paste reset token"
            autoCapitalize="none"
            multiline
          />

          <Field
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
            secureTextEntry
          />

          <Field
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />

          <AppButton
            title={submitting ? "Resetting..." : "Reset password"}
            onPress={handleResetPassword}
            disabled={submitting}
            style={styles.primaryButton}
          />

          <AppButton
            title="Back to log in"
            variant="secondary"
            onPress={() => router.replace("/login")}
            style={styles.secondaryButton}
          />
        </AppCard>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = "none",
  multiline = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted || c.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            backgroundColor: c.surfaceAlt,
            borderColor: c.border,
            color: c.text,
          },
        ]}
        selectionColor={c.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: 56,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
  },

  backText: {
    fontSize: 16,
    fontWeight: "900",
  },

  header: {
    marginBottom: spacing.xl,
  },

  eyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: "900",
    marginBottom: spacing.xs,
  },

  title: {
    ...typography.h1,
  },

  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    lineHeight: 22,
  },

  field: {
    marginBottom: spacing.md,
  },

  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: "900",
  },

  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: "700",
  },

  multilineInput: {
    minHeight: 86,
    textAlignVertical: "top",
  },

  primaryButton: {
    marginTop: spacing.sm,
  },

  secondaryButton: {
    marginTop: spacing.md,
  },
});