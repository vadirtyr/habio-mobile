import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AnimatedPressable } from "../components/AnimatedPressable";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { api } from "../lib/api";

import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../lib/theme";

const habitCategories = [
  {
    key: "health",
    label: "Health",
    icon: "heart",
    gradient: ["#123524", "#22C55E"],
    description:
      "Energy, hydration, sleep, recovery",
    habits: [
      "Drink water",
      "Take vitamins",
      "Stretch for 5 minutes",
      "Walk for 10 minutes",
      "Sleep by 10:30 PM",
    ],
  },

  {
    key: "fitness",
    label: "Fitness",
    icon: "activity",
    gradient: ["#10213F", "#3B82F6"],
    description:
      "Movement and physical momentum",
    habits: [
      "Do 10 pushups",
      "Go for a walk",
      "Complete a workout",
      "Stretch after waking up",
      "Track calories",
    ],
  },

  {
    key: "mind",
    label: "Mind",
    icon: "book-open",
    gradient: ["#24163A", "#8B5CF6"],
    description:
      "Mental clarity and reflection",
    habits: [
      "Read for 10 minutes",
      "Journal one sentence",
      "Meditate for 5 minutes",
      "Practice gratitude",
      "No phone for 30 minutes",
    ],
  },

  {
    key: "productivity",
    label: "Focus",
    icon: "target",
    gradient: ["#3A220F", "#F97316"],
    description:
      "Execution and forward momentum",
    habits: [
      "Plan tomorrow",
      "Clear inbox",
      "Work on top priority",
      "Review goals",
      "Tidy workspace",
    ],
  },
];

export default function ChooseHabitScreen() {
  const [selectedCategoryKey, setSelectedCategoryKey] =
    useState("health");

  const [selectedHabits, setSelectedHabits] =
    useState([]);

  const [submitting, setSubmitting] =
    useState(false);

  const selectedCategory = useMemo(
    () =>
      habitCategories.find(
        (category) =>
          category.key ===
          selectedCategoryKey
      ) || habitCategories[0],

    [selectedCategoryKey]
  );

  function toggleHabit(habitName) {
    setSelectedHabits((current) => {
      if (current.includes(habitName)) {
        return current.filter(
          (habit) => habit !== habitName
        );
      }

      return [...current, habitName];
    });
  }

  async function createSelectedHabits() {
    if (selectedHabits.length === 0) {
      Alert.alert(
        "Choose at least one habit",
        "Pick one or more habits to begin building momentum."
      );

      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      await Promise.all(
        selectedHabits.map((habitName) =>
          api.post("/habits", {
            name: habitName,
            frequency: "daily",
            coins_per_completion: 5,
          })
        )
      );

      router.replace("/(tabs)/dashboard");
    } catch (error) {
      Alert.alert(
        "Could not create habits",
        error?.message ||
          "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function skipHabitSetup() {
    router.replace("/(tabs)/dashboard");
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Build Your Orbit"
        subtitle="Choose a few habits that feel realistic and sustainable."
      />

      <LinearGradient
        colors={selectedCategory.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroGlow} />

        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Feather
              name={selectedCategory.icon}
              size={34}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              {selectedHabits.length} selected
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.heroTitle}>
            {selectedCategory.label}
          </Text>

          <Text style={styles.heroDescription}>
            {selectedCategory.description}
          </Text>
        </View>

        <View style={styles.heroFooter}>
          <Feather
            name="orbit"
            size={15}
            color="rgba(255,255,255,0.85)"
          />

          <Text style={styles.heroHint}>
            Small actions shape your orbit.
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.categoryGrid}>
        {habitCategories.map((category) => {
          const selected =
            category.key ===
            selectedCategoryKey;

          return (
            <AnimatedPressable
              key={category.key}
              style={[
                styles.categoryCard,
                selected &&
                  styles.categoryCardActive,
              ]}
              onPress={() =>
                setSelectedCategoryKey(
                  category.key
                )
              }
            >
              <LinearGradient
                colors={category.gradient}
                style={styles.categoryGradient}
              >
                <Feather
                  name={category.icon}
                  size={22}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.categoryText}
                >
                  {category.label}
                </Text>
              </LinearGradient>
            </AnimatedPressable>
          );
        })}
      </View>

      <AppCard style={styles.habitCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Suggested habits
            </Text>

            <Text style={styles.sectionHint}>
              Start with a few small wins.
            </Text>
          </View>

          <View style={styles.sectionBadge}>
            <MaterialCommunityIcons
              name="lightning-bolt-outline"
              size={15}
              color={colors.gold}
            />

            <Text style={styles.sectionBadgeText}>
              Momentum
            </Text>
          </View>
        </View>

        {selectedCategory.habits.map(
          (habitName) => {
            const selected =
              selectedHabits.includes(
                habitName
              );

            return (
              <AnimatedPressable
                key={habitName}
                style={[
                  styles.habitRow,
                  selected &&
                    styles.habitRowSelected,
                ]}
                onPress={() =>
                  toggleHabit(habitName)
                }
              >
                <View
                  style={[
                    styles.checkCircle,
                    selected &&
                      styles.checkCircleSelected,
                  ]}
                >
                  {selected && (
                    <Feather
                      name="check"
                      size={15}
                      color={colors.white}
                    />
                  )}
                </View>

                <View style={styles.habitCopy}>
                  <Text
                    style={styles.habitText}
                  >
                    {habitName}
                  </Text>

                  <Text
                    style={
                      styles.habitSubtext
                    }
                  >
                    Build consistency and
                    strengthen momentum.
                  </Text>
                </View>

                <Feather
                  name={
                    selected
                      ? "check-circle"
                      : "plus-circle"
                  }
                  size={22}
                  color={
                    selected
                      ? colors.cyan
                      : colors.textMuted
                  }
                />
              </AnimatedPressable>
            );
          }
        )}
      </AppCard>

      {selectedHabits.length > 0 && (
        <AppCard style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>
              Your orbit
            </Text>

            <Text style={styles.selectedCount}>
              {selectedHabits.length}
            </Text>
          </View>

          <View style={styles.selectedPills}>
            {selectedHabits.map(
              (habitName) => (
                <AnimatedPressable
                  key={habitName}
                  style={styles.selectedPill}
                  onPress={() =>
                    toggleHabit(habitName)
                  }
                >
                  <Text
                    style={
                      styles.selectedPillText
                    }
                  >
                    {habitName}
                  </Text>

                  <Feather
                    name="x"
                    size={13}
                    color={colors.cyan}
                  />
                </AnimatedPressable>
              )
            )}
          </View>
        </AppCard>
      )}

      <AppButton
        style={styles.primaryButton}
        onPress={createSelectedHabits}
        disabled={
          submitting ||
          selectedHabits.length === 0
        }
        title={
          submitting
            ? "Building your orbit..."
            : `Start with ${selectedHabits.length} habit${
                selectedHabits.length === 1
                  ? ""
                  : "s"
              }`
        }
      />

      <AppButton
        variant="secondary"
        style={styles.skipButton}
        onPress={skipHabitSetup}
        title="Skip for now"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  hero: {
    overflow: "hidden",
    marginTop: spacing.lg,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    minHeight: 260,
    justifyContent: "space-between",
  },

  heroGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: radii.pill,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    top: -120,
    right: -80,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  heroIcon: {
    width: 78,
    height: 78,
    borderRadius: radii.pill,
    backgroundColor:
      "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroBadge: {
    backgroundColor:
      "rgba(255,255,255,0.16)",
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  heroBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
  },

  heroDescription: {
    color: "rgba(255,255,255,0.92)",
    marginTop: spacing.md,
    lineHeight: 24,
    fontWeight: "700",
    fontSize: 16,
  },

  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  heroHint: {
    color: "rgba(255,255,255,0.82)",
    fontWeight: "700",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  categoryCard: {
    width: "47%",
    borderRadius: radii.xl,
    overflow: "hidden",
  },

  categoryCardActive: {
    ...shadows.soft,
    transform: [{ scale: 1.02 }],
  },

  categoryGradient: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  categoryText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  habitCard: {
    marginTop: spacing.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },

  sectionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  sectionBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "900",
  },

  habitRow: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.md,
  },

  habitRowSelected: {
    borderColor: colors.cyan,
    backgroundColor: `${colors.cyan}12`,
  },

  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  checkCircleSelected: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },

  habitCopy: {
    flex: 1,
  },

  habitText: {
    ...typography.bodyBold,
    color: colors.text,
  },

  habitSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  selectedCard: {
    marginTop: spacing.xl,
  },

  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectedTitle: {
    ...typography.h3,
    color: colors.text,
  },

  selectedCount: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.cyan,
  },

  selectedPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cyan,
    backgroundColor: `${colors.cyan}12`,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },

  selectedPillText: {
    ...typography.caption,
    color: colors.cyan,
    fontWeight: "900",
  },

  primaryButton: {
    marginTop: spacing.xl,
  },

  skipButton: {
    marginTop: spacing.md,
  },
});