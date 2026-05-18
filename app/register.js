import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { api } from "../lib/api";
import { colors, spacing, typography } from "../lib/theme";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please try again.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      await api.post("/auth/register", {
        email: cleanEmail,
        password,
      });

      Alert.alert(
        "Account created",
        "Your account was created. Please log in to start onboarding."
      );

      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error?.message || "Unable to create account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <Text style={styles.eyebrow}>Create your account</Text>
          <Text style={styles.title}>Join OurOrbit</Text>
          <Text style={styles.subtitle}>
            Start building better days with small actions that compound.
          </Text>
        </View>

        <AppCard>
          <View style={styles.section}>
            <Text style={styles.label}>Email</Text>

            <AppInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Password</Text>

            <AppInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 6 characters"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Confirm password</Text>

            <AppInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter password"
            />
          </View>

          <AppButton
            title={submitting ? "Creating account..." : "Create Account"}
            onPress={handleRegister}
            disabled={submitting}
          />
        </AppCard>

        <Pressable
          style={styles.loginButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.loginText}>Already have an account? Log in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },

  brandBlock: {
    marginBottom: spacing.xl,
  },

  eyebrow: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  title: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.xs,
  },

  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  section: {
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  loginButton: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },

  loginText: {
    ...typography.bodyBold,
    color: colors.cyan,
  },
});