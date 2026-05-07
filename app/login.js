import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandMark } from "../components/BrandMark";
import { api } from "../lib/api";
import { colors, radii, shadows, spacing } from "../lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const data = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      await SecureStore.setItemAsync("token", data.token);
      global.token = data.token;

      router.replace("/(tabs)/dashboard");
    } catch (error) {
      Alert.alert("Login failed", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.glow} />

      <View style={styles.header}>
        <BrandMark size={82} />

        <Text style={styles.eyebrow}>Welcome back</Text>
        <Text style={styles.title}>Habio</Text>
        <Text style={styles.subtitle}>Build habits. Earn rewards.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Log in</Text>
        <Text style={styles.cardSubtitle}>
          Keep your streaks moving and claim your wins.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && !loading && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textDark} />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -90,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.accent,
    opacity: 0.18,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 46,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -1.5,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    fontWeight: "600",
  },
  label: {
    color: colors.text,
    fontWeight: "900",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
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
    marginTop: spacing.sm,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
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