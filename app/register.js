import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { BrandHeader } from "../components/BrandMark";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

import { api } from "../lib/api";
import { signInWithGoogle } from "../lib/googleAuth";

import {
    radii,
    spacing,
    typography,
} from "../lib/theme";

export default function RegisterScreen() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [googleSubmitting, setGoogleSubmitting] =
    useState(false);

  async function handleGoogleRegister() {
    if (submitting || googleSubmitting) return;

    setGoogleSubmitting(true);

    try {
      const result = await signInWithGoogle();

      if (result.cancelled) {
        return;
      }

      const data = result.data;

      if (!data?.token) {
        throw new Error("Invalid Google response.");
      }

      await login(data.token);

      const cleanEmail =
        data?.user?.email?.trim()?.toLowerCase();

      if (cleanEmail) {
        await SecureStore.setItemAsync(
          "currentUserEmail",
          cleanEmail
        );

        const onboardingKey = `onboarding_${cleanEmail.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}`;

        const hasCompletedOnboarding =
          await SecureStore.getItemAsync(onboardingKey);

        if (!hasCompletedOnboarding) {
          router.replace("/onboarding");
          return;
        }
      }

      router.replace("/(tabs)/dashboard");
    } catch (error) {
      Alert.alert(
        "Google sign-in failed",
        error?.message || "Unable to sign in with Google."
      );
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function handleRegister() {
    const cleanEmail =
      email.trim().toLowerCase();

    if (
      !cleanEmail ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert(
        "Missing fields",
        "Please enter your email and password."
      );

      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Password too short",
        "Use at least 8 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      Alert.alert(
        "Passwords do not match",
        "Please try again."
      );

      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      await api.post(
        "/auth/register",
        {
          email: cleanEmail,
          password,
        }
      );

      Alert.alert(
        "Account created",
        "Your account was created. Please log in to start onboarding."
      );

      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error?.message ||
          "Unable to create account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        {
          backgroundColor:
            c.background,
        },
      ]}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View
        style={[
          styles.glowOne,
          {
            backgroundColor:
              `${
                c.cyan ||
                c.primary
              }16`,
          },
        ]}
      />

      <View
        style={[
          styles.glowTwo,
          {
            backgroundColor:
              `${
                c.coral ||
                c.primary
              }12`,
          },
        ]}
      />

      <View style={styles.content}>
        <BrandHeader
          centered
          title="Join OurOrbit"
          subtitle="Start building better days with small actions that compound."
        />

        <AppCard
          style={styles.card}
        >
          <View
            style={
              styles.cardHeader
            }
          >
            <View
              style={
                styles.cardHeaderText
              }
            >
              <Text
                style={[
                  styles.cardEyebrow,
                  {
                    color:
                      c.cyan ||
                      c.primary,
                  },
                ]}
              >
                Create your account
              </Text>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color:
                      c.text,
                  },
                ]}
              >
                Begin your orbit
              </Text>
            </View>

            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor:
                    `${
                      c.cyan ||
                      c.primary
                    }14`,

                  borderColor:
                    c.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="rocket-launch-outline"
                size={26}
                color={
                  c.cyan ||
                  c.primary
                }
              />
            </View>
          </View>

          <View
            style={
              styles.section
            }
          >
            <Text
              style={[
                styles.label,
                {
                  color:
                    c.text,
                },
              ]}
            >
              Email
            </Text>

            <AppInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
            />
          </View>

          <View
            style={
              styles.section
            }
          >
            <Text
              style={[
                styles.label,
                {
                  color:
                    c.text,
                },
              ]}
            >
              Password
            </Text>

            <AppInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 8 characters"
            />
          </View>

          <View
            style={
              styles.section
            }
          >
            <Text
              style={[
                styles.label,
                {
                  color:
                    c.text,
                },
              ]}
            >
              Confirm password
            </Text>

            <AppInput
              value={
                confirmPassword
              }
              onChangeText={
                setConfirmPassword
              }
              secureTextEntry
              placeholder="Re-enter password"
            />
          </View>

          <AppButton
            title={
              submitting
                ? "Creating account..."
                : "Create Account"
            }
            onPress={
              handleRegister
            }
            disabled={
              submitting || googleSubmitting
            }
            testID="register-submit-button"
          />

          <AppButton
            title={
              googleSubmitting
                ? "Connecting to Google..."
                : "Continue with Google"
            }
            onPress={handleGoogleRegister}
            disabled={submitting || googleSubmitting}
            style={styles.googleButton}
            testID="register-google-button"
          />
        </AppCard>

        <Pressable
          style={
            styles.loginButton
          }
          onPress={() =>
            router.replace(
              "/login"
            )
          }
        >
          <Text
            style={[
              styles.loginText,
              {
                color:
                  c.cyan ||
                  c.primary,
              },
            ]}
          >
            Already have an account? Log in
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push(
              "/privacy"
            )
          }
        >
          <Text
            style={[
              styles.privacyText,
              {
                color:
                  c.textSecondary,
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
    padding: spacing.xl,
  },

  card: {
    marginTop: spacing.lg,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",

    gap: spacing.md,

    marginBottom:
      spacing.lg,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardEyebrow: {
    ...typography.caption,

    textTransform:
      "uppercase",

    letterSpacing: 1,
  },

  cardTitle: {
    ...typography.h2,
    marginTop: spacing.xs,
  },

  iconBadge: {
    width: 52,
    height: 52,

    borderRadius:
      radii.pill,

    alignItems: "center",
    justifyContent:
      "center",

    borderWidth: 1,
  },

  section: {
    marginBottom:
      spacing.lg,
  },

  label: {
    ...typography.bodyBold,
    marginBottom:
      spacing.sm,
  },

  loginButton: {
    alignItems: "center",
    paddingTop:
      spacing.lg,
  },

  googleButton: {
    marginTop: spacing.md,
  },

  loginText: {
    ...typography.bodyBold,
  },

  privacyText: {
    textAlign: "center",
    fontWeight: "700",
    marginTop: spacing.md,
    fontSize: 13,
  },
});