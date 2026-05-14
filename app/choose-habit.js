import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { AnimatedPressable } from "../components/AnimatedPressable";
import { BrandHeader } from "../components/BrandMark";
import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";
import ThemedScreen from "../components/ThemedScreen";
import ThemedText from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";

const habitCategories = [
  {
    key: "health",
    label: "Health",
    icon: "heart",
    gradient: ["#ECFDF5", "#22C55E"],
    description: "Energy, sleep, hydration, recovery",
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
    gradient: ["#EFF6FF", "#3B82F6"],
    description: "Movement and physical momentum",
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
    gradient: ["#F5F3FF", "#8B5CF6"],
    description: "Mental clarity and reflection",
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
    label: "Productivity",
    icon: "check-circle",
    gradient: ["#FFF7ED", "#F97316"],
    description: "Focus and daily execution",
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
  const { theme } = useTheme();

  const [selectedCategoryKey, setSelectedCategoryKey] = useState("health");
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = useMemo(
    () =>
      habitCategories.find(
        (category) => category.key === selectedCategoryKey
      ) || habitCategories[0],
    [selectedCategoryKey]
  );

  function toggleHabit(habitName) {
    setSelectedHabits((current) => {
      if (current.includes(habitName)) {
        return current.filter((habit) => habit !== habitName);
      }

      return [...current, habitName];
    });
  }

  async function createSelectedHabits() {
    if (selectedHabits.length === 0) {
      Alert.alert(
        "Choose at least one habit",
        "Pick one or more habits to get started."
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
        error?.message || "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function skipHabitSetup() {
    router.replace("/(tabs)/dashboard");
  }

  return (
    <ThemedScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <BrandHeader eyebrow="Setup" title="Starter Habits" />

        <ThemedText muted style={styles.subtitle}>
          Start small. Pick a few habits you can realistically sustain.
        </ThemedText>

        <LinearGradient
          colors={selectedCategory.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Feather
                name={selectedCategory.icon}
                size={32}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.heroBadge}>
              <ThemedText style={styles.heroBadgeText}>
                {selectedHabits.length} selected
              </ThemedText>
            </View>
          </View>

          <View>
            <ThemedText style={styles.heroTitle}>
              {selectedCategory.label}
            </ThemedText>

            <ThemedText style={styles.heroDescription}>
              {selectedCategory.description}
            </ThemedText>
          </View>
        </LinearGradient>

        <View style={styles.categoryGrid}>
          {habitCategories.map((category) => {
            const selected = category.key === selectedCategoryKey;

            return (
              <AnimatedPressable
                key={category.key}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedCategoryKey(category.key)}
              >
                <Feather
                  name={category.icon}
                  size={20}
                  color={
                    selected
                      ? theme.colors.primaryText
                      : theme.colors.primary
                  }
                />

                <ThemedText
                  style={[
                    styles.categoryText,
                    selected && {
                      color: theme.colors.primaryText,
                    },
                  ]}
                >
                  {category.label}
                </ThemedText>
              </AnimatedPressable>
            );
          })}
        </View>

        <ThemedCard style={styles.habitCard}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText variant="section">
                Suggested habits
              </ThemedText>

              <ThemedText muted style={styles.sectionHint}>
                Choose a few habits to build momentum.
              </ThemedText>
            </View>

            <View
              style={[
                styles.sectionBadge,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="lightning-bolt-outline"
                size={14}
                color={theme.colors.primary}
              />

              <ThemedText muted style={styles.sectionBadgeText}>
                +5 coins
              </ThemedText>
            </View>
          </View>

          {selectedCategory.habits.map((habitName) => {
            const selected = selectedHabits.includes(habitName);

            return (
              <AnimatedPressable
                key={habitName}
                style={[
                  styles.habitRow,
                  {
                    backgroundColor: selected
                      ? `${theme.colors.primary}12`
                      : theme.colors.surfaceAlt,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => toggleHabit(habitName)}
              >
                <View
                  style={[
                    styles.checkCircle,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary
                        : "transparent",
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  {selected && (
                    <Feather
                      name="check"
                      size={15}
                      color={theme.colors.primaryText}
                    />
                  )}
                </View>

                <View style={styles.habitCopy}>
                  <ThemedText style={styles.habitText}>
                    {habitName}
                  </ThemedText>

                  <ThemedText muted style={styles.habitSubtext}>
                    Daily habit • Earn coins and streaks
                  </ThemedText>
                </View>

                <Feather
                  name={selected ? "check-circle" : "plus-circle"}
                  size={20}
                  color={
                    selected
                      ? theme.colors.primary
                      : theme.colors.textMuted
                  }
                />
              </AnimatedPressable>
            );
          })}
        </ThemedCard>

        {selectedHabits.length > 0 && (
          <ThemedCard style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <ThemedText variant="section">
                Your starter habits
              </ThemedText>

              <ThemedText
                style={[
                  styles.selectedCount,
                  { color: theme.colors.primary },
                ]}
              >
                {selectedHabits.length}
              </ThemedText>
            </View>

            <View style={styles.selectedPills}>
              {selectedHabits.map((habitName) => (
                <AnimatedPressable
                  key={habitName}
                  style={[
                    styles.selectedPill,
                    {
                      backgroundColor: `${theme.colors.primary}12`,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => toggleHabit(habitName)}
                >
                  <ThemedText
                    style={[
                      styles.selectedPillText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {habitName}
                  </ThemedText>

                  <Feather
                    name="x"
                    size={13}
                    color={theme.colors.primary}
                  />
                </AnimatedPressable>
              ))}
            </View>
          </ThemedCard>
        )}

        <ThemedButton
          style={styles.primaryButton}
          onPress={createSelectedHabits}
          disabled={submitting || selectedHabits.length === 0}
        >
          {submitting
            ? "Creating habits..."
            : `Start with ${selectedHabits.length} habit${
                selectedHabits.length === 1 ? "" : "s"
              }`}
        </ThemedButton>

        <ThemedButton
          variant="secondary"
          style={styles.skipButton}
          onPress={skipHabitSetup}
        >
          Skip for now
        </ThemedButton>
      </ScrollView>
    </ThemedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
  },

  subtitle: {
    marginTop: 8,
    lineHeight: 20,
  },

  hero: {
    marginTop: 20,
    borderRadius: 30,
    padding: 24,
    minHeight: 220,
    justifyContent: "space-between",
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  heroBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
  },

  heroDescription: {
    color: "rgba(255,255,255,0.92)",
    marginTop: 10,
    lineHeight: 22,
    fontWeight: "700",
    fontSize: 16,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },

  categoryCard: {
    width: "48%",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  categoryText: {
    fontWeight: "900",
    fontSize: 15,
  },

  habitCard: {
    marginTop: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  sectionHint: {
    marginTop: 4,
    lineHeight: 18,
  },

  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  habitRow: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
  },

  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  habitCopy: {
    flex: 1,
  },

  habitText: {
    fontSize: 16,
    fontWeight: "900",
  },

  habitSubtext: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },

  selectedCard: {
    marginTop: 18,
  },

  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectedCount: {
    fontSize: 26,
    fontWeight: "900",
  },

  selectedPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  selectedPillText: {
    fontWeight: "900",
    fontSize: 12,
  },

  primaryButton: {
    marginTop: 22,
  },

  skipButton: {
    marginTop: 12,
  },
});