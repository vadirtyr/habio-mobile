import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { colors, radii, spacing, typography } from "../lib/theme";

const slides = [
  {
    eyebrow: "Welcome",
    title: "Small actions shape your orbit.",
    description:
      "OurOrbit helps you turn simple daily actions into visible momentum.",
    icon: "sunrise",
    gradient: ["#14213D", "#25C3D8"],
  },
  {
    eyebrow: "Momentum",
    title: "Build routines that keep moving.",
    description:
      "Start with realistic habits, complete daily wins, and keep your progress in motion.",
    icon: "repeat",
    gradient: ["#10213F", "#3B82F6"],
  },
  {
    eyebrow: "Rewards",
    title: "Earn your wins.",
    description:
      "Complete habits and tasks, earn coins, keep streaks alive, and unlock rewards.",
    icon: "gift-outline",
    gradient: ["#3A220F", "#FF7A6B"],
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);

  const slide = slides[index];
  const isLastSlide = index === slides.length - 1;

  async function finishOnboarding() {
    await SecureStore.setItemAsync("hasCompletedOnboarding", "true");
    router.replace("/choose-habit");
  }

  function nextSlide() {
    if (isLastSlide) {
      finishOnboarding();
      return;
    }

    setIndex((current) => current + 1);
  }

  function previousSlide() {
    if (index === 0) return;
    setIndex((current) => current - 1);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.brandBlock}>
          <Text style={styles.eyebrow}>Welcome to</Text>
          <Text style={styles.brandTitle}>OurOrbit</Text>
          <Text style={styles.brandSubtitle}>Build better days.</Text>
        </View>

        <AppCard padded={false} style={styles.heroCard}>
          <LinearGradient
            colors={slide.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.orbitGlowLarge} />
            <View style={styles.orbitGlowSmall} />

            <View style={styles.gradientTop}>
              <View style={styles.iconCircle}>
                {slide.icon === "gift-outline" ? (
                  <MaterialCommunityIcons
                    name="gift-outline"
                    size={34}
                    color={colors.white}
                  />
                ) : (
                  <Feather name={slide.icon} size={34} color={colors.white} />
                )}
              </View>

              <Text style={styles.slideEyebrow}>{slide.eyebrow}</Text>
            </View>

            <View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </LinearGradient>

          <View style={styles.cardBody}>
            <View style={styles.progressRow}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === index ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            <View style={styles.featureGrid}>
              <FeaturePill icon="check-circle" label="Track" />
              <FeaturePill icon="zap" label="Streaks" />
              <FeaturePill icon="award" label="Rewards" />
            </View>

            <AppButton
              style={styles.primaryButton}
              onPress={nextSlide}
              title={isLastSlide ? "Choose Starter Habits" : "Continue"}
            />

            <View style={styles.bottomActions}>
              <Pressable
                onPress={previousSlide}
                disabled={index === 0}
                style={styles.secondaryAction}
              >
                <Text
                  style={[
                    styles.secondaryText,
                    index === 0 && styles.disabledText,
                  ]}
                >
                  Back
                </Text>
              </Pressable>

              {!isLastSlide ? (
                <Pressable onPress={finishOnboarding}>
                  <Text style={styles.secondaryText}>Skip setup</Text>
                </Pressable>
              ) : (
                <View style={styles.secondaryAction} />
              )}
            </View>
          </View>
        </AppCard>
      </View>
    </View>
  );
}

function FeaturePill({ icon, label }) {
  return (
    <View style={styles.featurePill}>
      <Feather name={icon} size={16} color={colors.cyan} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
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

  brandTitle: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.xs,
  },

  brandSubtitle: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  heroCard: {
    overflow: "hidden",
  },

  gradient: {
    minHeight: 350,
    padding: spacing.xl,
    justifyContent: "space-between",
    overflow: "hidden",
  },

  orbitGlowLarge: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -130,
    right: -100,
  },

  orbitGlowSmall: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -90,
    left: -70,
  },

  gradientTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  slideEyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  title: {
    color: colors.white,
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 44,
  },

  description: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: spacing.lg,
  },

  cardBody: {
    padding: spacing.xl,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },

  dot: {
    height: 10,
    borderRadius: radii.pill,
  },

  inactiveDot: {
    width: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  activeDot: {
    width: 28,
    backgroundColor: colors.cyan,
  },

  featureGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },

  featurePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  featureText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "900",
  },

  primaryButton: {
    marginTop: spacing.xl,
  },

  bottomActions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  secondaryAction: {
    minWidth: 90,
  },

  secondaryText: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },

  disabledText: {
    opacity: 0.35,
  },
});