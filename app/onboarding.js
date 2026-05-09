import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BrandMark } from "../components/BrandMark";
import { colors, radii, shadows, spacing } from "../lib/theme";

const slides = [
  {
    eyebrow: "Welcome to Habio",
    title: "Build habits that actually stick.",
    body: "Track habits, finish tasks, and turn your progress into rewards.",
    icon: "zap",
  },
  {
    eyebrow: "Earn Coins",
    title: "Every win counts.",
    body: "Complete habits and tasks to earn coins as proof of your momentum.",
    icon: "gold",
  },
  {
    eyebrow: "Redeem Rewards",
    title: "Make discipline feel rewarding.",
    body: "Spend your coins on rewards you choose, from movie nights to guilt-free breaks.",
    icon: "gift",
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  async function finishOnboarding() {
    await SecureStore.setItemAsync("hasSeenOnboarding", "true");
    router.replace("/login");
  }

  function next() {
    if (isLast) {
      finishOnboarding();
      return;
    }

    setIndex((current) => current + 1);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.glow} />

      <View style={styles.topRow}>
        <BrandMark size={48} />

        <Pressable onPress={finishOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          {slide.icon === "gold" ? (
            <MaterialCommunityIcons name="gold" size={44} color={colors.textDark} />
          ) : (
            <Feather name={slide.icon} size={44} color={colors.textDark} />
          )}
        </View>

        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                dotIndex === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>
            {isLast ? "Get Started" : "Next"}
          </Text>
          <Feather
            name={isLast ? "check-circle" : "arrow-right"}
            size={18}
            color={colors.textDark}
          />
        </Pressable>
      </View>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width,
    backgroundColor: colors.accent,
    opacity: 0.16,
    top: -90,
    right: -90,
  },
  topRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipText: {
    color: colors.textMuted,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  iconCircle: {
    width: 94,
    height: 94,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadows.glow,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 43,
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.md,
    fontWeight: "700",
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.accent,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...shadows.glow,
  },
  buttonText: {
    color: colors.textDark,
    fontWeight: "900",
    fontSize: 16,
  },
});