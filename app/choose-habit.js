import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { BrandHeader } from "../components/BrandMark";
import { colors, radii, shadows, spacing } from "../lib/theme";

const HABIT_CATEGORIES = [
  {
    id: "health",
    title: "Health",
    icon: "heart",
    description: "Feel better and build your foundation.",
    habits: [
      "Drink water",
      "Take vitamins",
      "Stretch for 5 minutes",
      "Walk for 10 minutes",
      "Sleep by 10:30 PM",
    ],
  },
  {
    id: "fitness",
    title: "Fitness",
    icon: "activity",
    description: "Move your body and build energy.",
    habits: [
      "Do 10 pushups",
      "Go for a walk",
      "Complete a workout",
      "Stretch after waking up",
      "Track calories",
    ],
  },
  {
    id: "mind",
    title: "Mind",
    icon: "book-open",
    description: "Train focus, calm, and clarity.",
    habits: [
      "Read for 10 minutes",
      "Journal one sentence",
      "Meditate for 5 minutes",
      "Practice gratitude",
      "No phone for 30 minutes",
    ],
  },
  {
    id: "productivity",
    title: "Productivity",
    icon: "check-square",
    description: "Make progress without overthinking.",
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
  const [selectedCategory, setSelectedCategory] = useState(null);

  const title = selectedCategory ? selectedCategory.title : "Choose a Category";
  const subtitle = selectedCategory
    ? "Pick a starter habit. You can customize it before saving."
    : "Start with an area you want to improve first.";

  function chooseHabit(habit) {
    router.push({
      pathname: "/create-habit",
      params: {
        firstHabit: "true",
        name: habit,
        category: selectedCategory.title,
      },
    });
  }

  function goBack() {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      router.replace("/(tabs)/dashboard");
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <BrandHeader eyebrow="First Habit" title={title} />
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {selectedCategory ? (
        <FlatList
          data={selectedCategory.habits}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Pressable style={styles.backButton} onPress={goBack}>
              <Feather name="arrow-left" size={17} color={colors.text} />
              <Text style={styles.backText}>Back to categories</Text>
            </Pressable>
          }
          renderItem={({ item, index }) => (
            <AnimatedCard index={index}>
              <Pressable
                style={styles.habitCard}
                onPress={() => chooseHabit(item)}
              >
                <View style={styles.iconCircle}>
                  <Feather
                    name={selectedCategory.icon}
                    size={22}
                    color={colors.accent}
                  />
                </View>

                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item}</Text>
                  <Text style={styles.cardSubtitle}>
                    Daily • Medium • 10 coins
                  </Text>
                </View>

                <Feather
                  name="chevron-right"
                  size={22}
                  color={colors.textMuted}
                />
              </Pressable>
            </AnimatedCard>
          )}
        />
      ) : (
        <FlatList
          data={HABIT_CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <AnimatedCard index={index}>
              <Pressable
                style={styles.categoryCard}
                onPress={() => setSelectedCategory(item)}
              >
                <View style={styles.iconCircle}>
                  <Feather name={item.icon} size={22} color={colors.accent} />
                </View>

                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.description}</Text>
                </View>

                <Feather
                  name="chevron-right"
                  size={22}
                  color={colors.textMuted}
                />
              </Pressable>
            </AnimatedCard>
          )}
          ListFooterComponent={
            <Pressable style={styles.skipButton} onPress={goBack}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          }
        />
      )}
    </View>
  );
}

function AnimatedCard({ children, index = 0 }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(index * 55, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(index * 55, withSpring(0));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 120,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadows.card,
  },
  habitCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadows.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 17,
  },
  cardSubtitle: {
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: "700",
    lineHeight: 18,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.text,
    fontWeight: "900",
  },
  skipButton: {
    padding: spacing.md,
    alignItems: "center",
  },
  skipText: {
    color: colors.textMuted,
    fontWeight: "900",
  },
});