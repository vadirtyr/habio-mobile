import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
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

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Enter email and password.");
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
        throw new Error("Invalid login response");
      }

      await login(data.token);

      const hasCreatedFirstHabit = await SecureStore.getItemAsync(
        "hasCreatedFirstHabit"
      );

      if (hasCreatedFirstHabit === "true") {
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/create-habit?firstHabit=true");
      }
    } catch (error) {
      Alert.alert("Login failed", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <BrandHeader eyebrow="Welcome back" title="Log in to Habio" />

      <Text style={styles.subtitle}>
        Continue building your streaks and earning rewards.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

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
});