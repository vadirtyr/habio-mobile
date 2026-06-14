import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { BrandHeader } from "../components/BrandMark";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

import { api } from "../lib/api";
import { signInWithGoogle } from "../lib/googleAuth";

import { radii, shadows, spacing, typography } from "../lib/theme";

export default function LoginScreen() {
  const { returnTo } = useLocalSearchParams();
  const { login } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function finishLogin(data, fallbackEmail) {
    if (!data?.token) {
      throw new Error("Invalid login response.");
    }

    const userFromAuth = await login(data.token);
    const user = userFromAuth || data?.user || null;

    const cleanEmail =
      user?.email?.trim()?.toLowerCase() ||
      data?.user?.email?.trim()?.toLowerCase() ||
      fallbackEmail?.trim()?.toLowerCase();

    if (cleanEmail) {
      await SecureStore.setItemAsync("currentUserEmail", cleanEmail);
    }

    if (typeof returnTo === "string" && returnTo.startsWith("/")) {
      router.replace(returnTo);
    } else if (user?.onboarding_completed) {
      router.replace("/(tabs)/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }

  async function handleGoogleLogin() {
    if (submitting || googleSubmitting) return;

    setGoogleSubmitting(true);

    try {
      const result = await signInWithGoogle();

      if (result.cancelled) {
        return;
      }

      await finishLogin(result.data);
    } catch (error) {
      Alert.alert(
        "Google sign-in failed",
        error?.message || "Unable to sign in with Google."
      );
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function handleLogin() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      const data = await api.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      await finishLogin(data, cleanEmail);
    } catch (error) {
      Alert.alert("Login failed", error?.message || "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.glowOne,
          {
            backgroundColor: `${c.cyan || c.primary}16`,
          },
        ]}
      />

      <View
        style={[
          styles.glowTwo,
          {
            backgroundColor: `${c.coral || c.primary}12`,
          },
        ]}
      />

      <View style={styles.content}>
        <BrandHeader
          centered
          title="OurOrbit"
          subtitle="Build better days through habits, streaks, and momentum."
        />

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text
                style={[
                  styles.cardEyebrow,
                  {
                    color: c.cyan || c.primary,
                  },
                ]}
              >
                Welcome back
              </Text>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Log in to continue
              </Text>
            </View>

            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: `${c.cyan || c.primary}14`,
                  borderColor: c.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="orbit"
                size={26}
                color={c.cyan || c.primary}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.text }]}>Email</Text>

            <AppInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.text }]}>Password</Text>

              <AppInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Password"
                autoCapitalize="none"
                autoCorrect={false}
                rightElement={
                 <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={12}
                    style={{ padding: 4 }}
                  >
              <MaterialCommunityIcons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={c.textMuted || c.muted}
              />
           </Pressable>
          }
         />
      </View> 

          <Pressable
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotButton}
          >
            <Text style={[styles.forgotText, { color: c.primary }]}>
              Forgot password?
            </Text>
          </Pressable>

          <AppButton
            title={submitting ? "Logging in..." : "Log in"}
            onPress={handleLogin}
            disabled={submitting || googleSubmitting}
            style={styles.button}
            testID="login-submit-button"
          />

          <AppButton
            title={
              googleSubmitting
                ? "Connecting to Google..."
                : "Continue with Google"
            }
            onPress={handleGoogleLogin}
            disabled={submitting || googleSubmitting}
            style={styles.googleButton}
            testID="login-google-button"
          />
        </AppCard>

        <Pressable onPress={() => router.push(returnTo ? { pathname: "/register", params: { returnTo } } : "/register")}>
          <Text
            style={[
              styles.registerText,
              {
                color: c.cyan || c.primary,
              },
            ]}
          >
            Don&apos;t have an account? Create one
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/privacy")}>
          <Text
            style={[
              styles.privacyText,
              {
                color: c.textMuted || c.muted,
              },
            ]}
          >
            Privacy Policy
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  glowOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    top: -110,
    right: -90,
  },

  glowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    bottom: -100,
    left: -80,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },

  card: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  cardEyebrow: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },

  cardTitle: {
    ...typography.h2,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  field: {
    marginBottom: spacing.md,
  },

  label: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },

  button: {
    marginTop: spacing.sm,
  },

  googleButton: {
    marginTop: spacing.md,
  },

  registerText: {
    textAlign: "center",
    fontWeight: "800",
    marginTop: spacing.sm,
  },

  privacyText: {
    textAlign: "center",
    fontWeight: "700",
    marginTop: spacing.md,
    fontSize: 13,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  forgotText: {
    ...typography.caption,
    fontWeight: "900",
  },
});
