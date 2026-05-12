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

import { BrandHeader } from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { colors, radii, shadows, spacing } from "../lib/theme";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      const data = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!data?.token) {
        throw new Error("Invalid login response.");
      }

      await login(data.token);
      router.replace("/(tabs)/habits");
    } catch (error) {
      Alert.alert("Login failed", error?.message || "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <BrandHeader />

        <Text style={styles.subtitle}>Build habits. Earn rewards.</Text>

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
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
          />

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? "Logging in..." : "Log In"}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/register")}>
          <Text style={styles.registerText}>
            Don&apos;t have an account? Create one
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },

  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
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
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 4,
  },

  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: spacing.md,
    color: colors.text,
    fontWeight: "600",
  },

  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
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

  registerText: {
    textAlign: "center",
    color: colors.accent,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
});