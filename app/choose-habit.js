import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BrandHeader } from "../components/BrandMark";
import { api } from "../lib/api";
import { colors, radii, shadows, spacing } from "../lib/theme";

const habitCategories = [
  {
    key: "health",
    label: "Health",
    icon: "heart",
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
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("health");
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory =
    habitCategories.find((category) => category.key === selectedCategoryKey) ||
    habitCategories[0];

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
        "Pick one or more habits to start."
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
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <BrandHeader />

      <Text style={styles.title}>Choose your starter habits</Text>
      <Text style={styles.subtitle}>
        Pick a category, then select one or more habits to start with.
      </Text>

      <View style={styles.categoryGrid}>
        {habitCategories.map((category) => {
          const isSelected = selectedCategoryKey === category.key;

          return (
            <Pressable
              key={category.key}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
              ]}
              onPress={() => setSelectedCategoryKey(category.key)}
            >
              <Feather
                name={category.icon}
                size={22}
                color={isSelected ? colors.textDark : colors.accent}
              />
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.habitCard}>
        <Text style={styles.sectionTitle}>{selectedCategory.label} habits</Text>

        {selectedCategory.habits.map((habitName) => {
          const isSelected = selectedHabits.includes(habitName);

          return (
            <Pressable
              key={habitName}
              style={[styles.habitRow, isSelected && styles.habitRowSelected]}
              onPress={() => toggleHabit(habitName)}
            >
              <View
                style={[
                  styles.checkCircle,
                  isSelected && styles.checkCircleSelected,
                ]}
              >
                {isSelected && (
                  <Feather name="check" size={16} color={colors.textDark} />
                )}
              </View>

              <Text
                style={[
                  styles.habitText,
                  isSelected && styles.habitTextSelected,
                ]}
              >
                {habitName}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedHabits.length > 0 && (
        <View style={styles.selectedBox}>
          <Text style={styles.selectedTitle}>
            Selected habits: {selectedHabits.length}
          </Text>

          <View style={styles.selectedPills}>
            {selectedHabits.map((habitName) => (
              <Pressable
                key={habitName}
                style={styles.selectedPill}
                onPress={() => toggleHabit(habitName)}
              >
                <Text style={styles.selectedPillText}>{habitName}</Text>
                <Feather name="x" size={13} color={colors.accent} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        style={[
          styles.primaryButton,
          (submitting || selectedHabits.length === 0) &&
            styles.primaryButtonDisabled,
        ]}
        onPress={createSelectedHabits}
        disabled={submitting}
      >
        <Text style={styles.primaryButtonText}>
          {submitting
            ? "Creating habits..."
            : selectedHabits.length === 0
            ? "Select habits to continue"
            : `Start with ${selectedHabits.length} habit${
                selectedHabits.length === 1 ? "" : "s"
              }`}
        </Text>
      </Pressable>

      <Pressable style={styles.skipButton} onPress={skipHabitSetup}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing.lg,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: spacing.lg,
  },

  categoryCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadows.card,
  },

  categoryCardSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  categoryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },

  categoryTextSelected: {
    color: colors.textDark,
  },

  habitCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },

  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    marginTop: 10,
  },

  habitRowSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(34, 197, 94, 0.16)",
  },

  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  checkCircleSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  habitText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },

  habitTextSelected: {
    color: colors.accent,
  },

  selectedBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: spacing.lg,
    ...shadows.card,
  },

  selectedTitle: {
    color: colors.text,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },

  selectedPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  selectedPillText: {
    color: colors.accent,
    fontWeight: "900",
    fontSize: 12,
  },

  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.lg,
    ...shadows.glow,
  },

  primaryButtonDisabled: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "900",
  },

  skipButton: {
    paddingVertical: 16,
    alignItems: "center",
  },

  skipText: {
    color: colors.textMuted,
    fontWeight: "800",
  },
});