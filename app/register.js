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

import { BrandHeader } from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { colors, radii, shadows, spacing } from "../lib/theme";

export default function RegisterScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Enter email and password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Try entering them again.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      const data = await api.post("/auth/register", {
        email: cleanEmail,
        password,
      });

      if (data?.token) {
        await login(data.token);
        router.replace("/(tabs)/habits");
      } else {
        Alert.alert(
          "Account created",
          "Your account was created. Please log in."
        );
        router.replace("/login");
      }
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error.message || "Unable to create account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <BrandHeader />

      <Text style={styles.subtitle}>
        Create your Habio account and start building better days.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 6 characters"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Re-enter password"
          placeholderTextColor={colors.textMuted}
        />

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Creating account..." : "Create Account"}
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.replace("/login")}>
        <Text style={styles.loginText}>Already have an account? Log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
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
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radii.lg,
    alignItems: "center",
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
  loginText: {
    textAlign: "center",
    color: colors.accent,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
});