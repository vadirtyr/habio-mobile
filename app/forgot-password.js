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

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert("Missing email", "Enter the email for your account.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      setSent(true);
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error?.message || "Unable to start password reset."
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
            Forgot password?
          </Text>

          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Enter your email and we’ll send reset instructions if an account
            exists.
          </Text>
        </View>

        <AppCard>
          {sent ? (
            <View>
              <Text style={[styles.successTitle, { color: c.text }]}>
                Check your email
              </Text>

              <Text style={[styles.successText, { color: c.textSecondary }]}>
                If an account exists for that email, a reset link has been sent.
              </Text>

              <AppButton
                title="Back to log in"
                onPress={() => router.replace("/login")}
                style={styles.primaryButton}
              />

              <AppButton
                title="Enter reset token"
                variant="secondary"
                onPress={() => router.push("/reset-password")}
                style={styles.secondaryButton}
              />
            </View>
          ) : (
            <View>
              <Text style={[styles.label, { color: c.text }]}>Email</Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={c.textMuted || c.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: c.surfaceAlt,
                    borderColor: c.border,
                    color: c.text,
                  },
                ]}
                selectionColor={c.primary}
              />

              <AppButton
                title={submitting ? "Sending..." : "Send reset instructions"}
                onPress={handleSubmit}
                disabled={submitting}
                style={styles.primaryButton}
              />
            </View>
          )}
        </AppCard>
      </View>
    </KeyboardAvoidingView>
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

  primaryButton: {
    marginTop: spacing.lg,
  },

  secondaryButton: {
    marginTop: spacing.md,
  },

  successTitle: {
    ...typography.h3,
  },

  successText: {
    ...typography.body,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});