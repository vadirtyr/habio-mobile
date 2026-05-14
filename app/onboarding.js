import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { BrandHeader } from "../components/BrandMark";
import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";
import ThemedScreen from "../components/ThemedScreen";
import ThemedText from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";

const slides = [
  {
    eyebrow: "Welcome",
    title: "Build better days.",
    description:
      "Habio helps you turn small daily actions into visible progress.",
    icon: "sunrise",
  },
  {
    eyebrow: "Momentum",
    title: "Start with a few habits.",
    description:
      "Pick starter habits from guided categories so you can begin without overthinking it.",
    icon: "repeat",
  },
  {
    eyebrow: "Rewards",
    title: "Earn your wins.",
    description:
      "Complete habits and tasks, earn coins, keep streaks alive, and unlock rewards.",
    icon: "gift-outline",
  },
];

export default function OnboardingScreen() {
  const { theme, themeName, themes } = useTheme();
  const [index, setIndex] = useState(0);

  const activeTheme = themes[themeName];
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
    <ThemedScreen>
      <View style={styles.container}>
        <BrandHeader eyebrow="Welcome to" title="Habio" />

        <ThemedCard style={styles.heroCard}>
          <LinearGradient
            colors={
              activeTheme?.gradient || [
                theme.colors.background,
                theme.colors.primary,
              ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.gradientTop}>
              <View style={styles.iconCircle}>
                {slide.icon === "gift-outline" ? (
                  <MaterialCommunityIcons
                    name="gift-outline"
                    size={34}
                    color="#FFFFFF"
                  />
                ) : (
                  <Feather name={slide.icon} size={34} color="#FFFFFF" />
                )}
              </View>

              <ThemedText style={styles.eyebrow}>{slide.eyebrow}</ThemedText>
            </View>

            <View>
              <ThemedText style={styles.title}>{slide.title}</ThemedText>

              <ThemedText style={styles.description}>
                {slide.description}
              </ThemedText>
            </View>
          </LinearGradient>

          <View style={styles.cardBody}>
            <View style={styles.progressRow}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === index
                          ? theme.colors.primary
                          : theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                    i === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            <View style={styles.featureGrid}>
              <FeaturePill
                icon="check-circle"
                label="Track"
                theme={theme}
              />

              <FeaturePill
                icon="zap"
                label="Streaks"
                theme={theme}
              />

              <FeaturePill
                icon="award"
                label="Rewards"
                theme={theme}
              />
            </View>

            <ThemedButton style={styles.primaryButton} onPress={nextSlide}>
              {isLastSlide ? "Choose Starter Habits" : "Continue"}
            </ThemedButton>

            <View style={styles.bottomActions}>
              <Pressable
                onPress={previousSlide}
                disabled={index === 0}
                style={styles.secondaryAction}
              >
                <ThemedText
                  muted
                  style={[
                    styles.secondaryText,
                    index === 0 && styles.disabledText,
                  ]}
                >
                  Back
                </ThemedText>
              </Pressable>

              {!isLastSlide && (
                <Pressable onPress={finishOnboarding}>
                  <ThemedText muted style={styles.secondaryText}>
                    Skip setup
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>
        </ThemedCard>
      </View>
    </ThemedScreen>
  );
}

function FeaturePill({ icon, label, theme }) {
  return (
    <View
      style={[
        styles.featurePill,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Feather name={icon} size={16} color={theme.colors.primary} />
      <ThemedText style={styles.featureText}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  heroCard: {
    marginTop: 24,
    padding: 0,
    overflow: "hidden",
  },

  gradient: {
    minHeight: 330,
    padding: 24,
    justifyContent: "space-between",
  },

  gradientTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  eyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 44,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowRadius: 8,
  },

  description: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: 14,
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowRadius: 6,
  },

  cardBody: {
    padding: 20,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
  },

  activeDot: {
    width: 26,
  },

  featureGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },

  featurePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  featureText: {
    fontSize: 12,
    fontWeight: "900",
  },

  primaryButton: {
    marginTop: 22,
  },

  bottomActions: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  secondaryAction: {
    minWidth: 70,
  },

  secondaryText: {
    fontWeight: "800",
  },

  disabledText: {
    opacity: 0.35,
  },
});