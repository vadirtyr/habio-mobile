import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
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
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { colors, spacing, typography } from "../lib/theme";

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

      const hasCompletedOnboarding = await SecureStore.getItemAsync(
        "hasCompletedOnboarding"
      );

      if (!hasCompletedOnboarding) {
        router.replace("/onboarding");
        return;
      }

      router.replace("/(tabs)/dashboard");
    } catch (error) {
      Alert.alert("Login failed", error?.message || "Unable to log in.");
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
          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.title}>OurOrbit</Text>
          <Text style={styles.subtitle}>
            Small actions shape your orbit.
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
              placeholder="Password"
            />
          </View>

          <AppButton
            title={submitting ? "Logging in..." : "Log In"}
            onPress={handleLogin}
            disabled={submitting}
          />
        </AppCard>

        <Pressable
          style={styles.registerButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.registerText}>
            Don&apos;t have an account? Create one
          </Text>
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

  registerButton: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },

  registerText: {
    ...typography.bodyBold,
    color: colors.cyan,
  },
});