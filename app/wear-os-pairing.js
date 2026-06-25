import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AnimatedScreen } from "../components/AnimatedScreen";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import {
  radii,
  spacing,
  typography,
} from "../lib/theme";

export default function WearOsPairingScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [pairing, setPairing] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateCode = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.createWatchPairingCode();
      setPairing(data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Could not generate code",
        error?.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generateCode();
  }, [generateCode]);

  const expiresAt = pairing?.expires_at
    ? new Date(pairing.expires_at)
    : null;

  const expirationText =
    expiresAt && !Number.isNaN(expiresAt.getTime())
      ? expiresAt.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      : "soon";

  return (
    <AnimatedScreen style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Wear OS Pairing"
          subtitle="Connect your watch to OurOrbit with a one-time code."
        />

        <AppCard style={styles.codeCard} glow>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: `${c.cyan || c.primary}14`,
                borderColor: c.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="watch-variant"
              size={30}
              color={c.cyan || c.primary}
            />
          </View>

          <Text style={[styles.label, { color: c.textSecondary }]}>
            Pairing Code
          </Text>

          <Text selectable style={[styles.code, { color: c.text }]}>
            {pairing?.code || "------"}
          </Text>

          <Text style={[styles.expiration, { color: c.textSecondary }]}>
            Expires at {expirationText}
          </Text>
        </AppCard>

        <AppCard style={styles.instructionsCard}>
          <Text style={[styles.instructionsTitle, { color: c.text }]}>
            Open OurOrbit on your watch and enter this code.
          </Text>

          <Text style={[styles.instructionsBody, { color: c.textSecondary }]}>
            Codes are short-lived and can only be used once. Generate a new code
            if the old one expires before you finish pairing.
          </Text>
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            title={loading ? "Generating..." : "Generate Pairing Code"}
            onPress={generateCode}
            disabled={loading}
          />

          <AppButton
            title="Back to Settings"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  codeCard: {
    alignItems: "center",
  },

  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.caption,
    textAlign: "center",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  code: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 4,
  },

  expiration: {
    ...typography.bodyBold,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  instructionsCard: {
    marginTop: spacing.lg,
  },

  instructionsTitle: {
    ...typography.h3,
  },

  instructionsBody: {
    ...typography.body,
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
