import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
    Dimensions,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BrandHeader } from "../components/BrandMark";
import { colors, radii, shadows, spacing } from "../lib/theme";

const { width } = Dimensions.get("window");

const slides = [
  {
    title: "Build Better Days",
    description:
      "Habio helps you turn small daily actions into real progress.",
  },
  {
    title: "Start With A Few Habits",
    description:
      "Next, you’ll pick a category and choose one or more suggested habits to get started quickly.",
  },
  {
    title: "Earn Rewards",
    description:
      "Complete habits and tasks to earn coins, keep streaks alive, and unlock rewards.",
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);

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

    setIndex((prev) => prev + 1);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <BrandHeader />

        <View style={styles.card}>
          <Text style={styles.title}>{slides[index].title}</Text>

          <Text style={styles.description}>
            {slides[index].description}
          </Text>

          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === index && styles.activeDot,
                ]}
              />
            ))}
          </View>

          <Pressable style={styles.primaryButton} onPress={nextSlide}>
            <Text style={styles.primaryButtonText}>
              {isLastSlide ? "Choose Starter Habits" : "Continue"}
            </Text>
          </Pressable>

          {!isLastSlide && (
            <Pressable onPress={finishOnboarding}>
              <Text style={styles.skipText}>Skip to habit setup</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
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
  card: {
    width: width - spacing.lg * 2,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xl,
    ...shadows.card,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xl,
    fontWeight: "500",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.accent,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: radii.lg,
    alignItems: "center",
    ...shadows.glow,
  },
  primaryButtonText: {
    color: colors.textDark,
    fontWeight: "900",
    fontSize: 16,
  },
  skipText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    fontWeight: "700",
  },
});