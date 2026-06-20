import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { useTheme } from "../hooks/useTheme";
import { changePassword } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
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
      setSaving(true);
      await changePassword(currentPassword, newPassword);

      Alert.alert("Success", "Your password has been changed.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Could not change password", err.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: c.primary }]}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Change password</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Enter your current password, then choose a new one.
          </Text>
        </View>

        <AppCard>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
          />

          <PasswordField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
          />

          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
          />

          <AppButton
            title={saving ? "Saving..." : "Change password"}
            onPress={handleChangePassword}
            disabled={saving}
            style={styles.primaryButton}
          />
        </AppCard>
      </View>
    </View>
  );
}

function PasswordField({ label, value, onChangeText, placeholder }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.surfaceAlt,
            borderColor: c.border,
            color: c.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted || c.muted}
        selectionColor={c.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  container: {
    flex: 1,
    padding: spacing.lg,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },

  backText: {
    fontWeight: "800",
    fontSize: 16,
  },

  header: {
    marginBottom: spacing.lg,
  },

  title: {
    ...typography.h1,
  },

  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },

  field: {
    marginBottom: spacing.md,
  },

  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },

  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: "600",
  },

  primaryButton: {
    marginTop: spacing.sm,
  },
});
