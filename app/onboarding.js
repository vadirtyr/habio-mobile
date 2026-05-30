import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AnimatedPressable } from "../components/AnimatedPressable";
import { AnimatedScreen } from "../components/AnimatedScreen";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import {
    BrandBadge,
    BrandHeader,
} from "../components/BrandMark";
import { OrbitProgressBar } from "../components/OrbitProgressBar";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

import { api } from "../lib/api";

import {
    radii,
    spacing,
    typography,
} from "../lib/theme";

const CATEGORIES = [
  {
    id: "health",
    title: "Health",
    icon: "heart",
    description:
      "Energy, movement, hydration, and sleep.",
    habits: [
      {
        name: "Drink water",
        description:
          "Drink a full glass of water.",
        icon: "cup-water",
      },
      {
        name: "Take a walk",
        description:
          "Walk for at least 10 minutes.",
        icon: "walk",
      },
      {
        name: "Stretch",
        description:
          "Do a short stretch session.",
        icon: "human-handsup",
      },
    ],
  },

  {
    id: "mind",
    title: "Mind",
    icon: "brain",
    description:
      "Focus, reflection, and mental reset.",
    habits: [
      {
        name: "Journal",
        description:
          "Write a few thoughts for the day.",
        icon: "notebook-outline",
      },
      {
        name: "Meditate",
        description:
          "Take 5 quiet minutes.",
        icon: "meditation",
      },
      {
        name: "Read",
        description:
          "Read for 10 minutes.",
        icon: "book-open-page-variant",
      },
    ],
  },

  {
    id: "productivity",
    title: "Productivity",
    icon: "rocket-launch",
    description:
      "Small actions that move your day forward.",
    habits: [
      {
        name: "Plan tomorrow",
        description:
          "Pick your top priorities.",
        icon: "calendar-check",
      },
      {
        name: "Clean one area",
        description:
          "Tidy one small space.",
        icon: "broom",
      },
      {
        name: "No-phone focus",
        description:
          "Do one focused work block.",
        icon: "cellphone-off",
      },
    ],
  },
];

export default function OnboardingScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();

  const c = theme.colors;

  const [step, setStep] = useState(0);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState(null);

  const [selectedHabits, setSelectedHabits] =
    useState([]);

  const [submitting, setSubmitting] =
    useState(false);

  const selectedCategory = useMemo(
    () =>
      CATEGORIES.find(
        (category) =>
          category.id ===
          selectedCategoryId
      ),
    [selectedCategoryId]
  );

  const progress =
    step === 0
      ? 33
      : step === 1
      ? 66
      : 100;

  function toggleHabit(habit) {
    const exists =
      selectedHabits.some(
        (item) =>
          item.name === habit.name
      );

    if (exists) {
      setSelectedHabits(
        (current) =>
          current.filter(
            (item) =>
              item.name !==
              habit.name
          )
      );

      return;
    }

    setSelectedHabits(
      (current) => [
        ...current,
        habit,
      ]
    );
  }

  async function getOnboardingKey() {
    let email =
      (await SecureStore.getItemAsync(
        "currentUserEmail"
      )) || null;

    if (!email && token) {
      try {
        const me =
          await api.get("/auth/me");

        email =
          me?.email?.toLowerCase() ||
          null;

        if (email) {
          await SecureStore.setItemAsync(
            "currentUserEmail",
            email
          );
        }
      } catch {}
    }

    const safeEmail = (
      email || "default"
    ).replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );

    return `onboarding_${safeEmail}`;
  }

  async function finishOnboarding() {
    if (submitting) return;

    setSubmitting(true);

    try {
      if (
        token &&
        selectedHabits.length > 0
      ) {
        for (const habit of selectedHabits) {
          await api.post("/habits", {
            name: habit.name,
            description:
              habit.description,

            frequency: "daily",

            difficulty: "easy",

            icon:
              habit.icon ||
              "flame",

            category:
              selectedCategory?.title ||
              "Starter",
          });
        }
      }

      const onboardingKey =
        await getOnboardingKey();

      await SecureStore.setItemAsync(
        onboardingKey,
        "true"
      );

      await Haptics.notificationAsync(
        Haptics
          .NotificationFeedbackType
          .Success
      );

      router.replace(
        "/(tabs)/dashboard"
      );
    } catch (error) {
      Alert.alert(
        "Onboarding error",
        error?.message ||
          "Unable to finish onboarding."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor:
            c.background,
        },
      ]}
    >
      <View
        style={[
          styles.glowOne,
          {
            backgroundColor:
              `${
                c.cyan ||
                c.primary
              }14`,
          },
        ]}
      />

      <View
        style={[
          styles.glowTwo,
          {
            backgroundColor:
              `${
                c.coral ||
                c.primary
              }10`,
          },
        ]}
      />

      <AnimatedScreen
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={
            styles.container
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <BrandHeader
            centered
            eyebrow="Welcome"
            title="Start Your Orbit"
            subtitle="Build momentum through small daily actions."
          />

          <View
            style={
              styles.progressWrap
            }
          >
            <OrbitProgressBar
              percent={progress}
              style={
                styles.progress
              }
            />

            <Text
              style={[
                styles.progressText,
                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Step {step + 1} of 3
            </Text>
          </View>

          {step === 0 ? (
            <IntroStep
              onNext={() =>
                setStep(1)
              }
            />
          ) : step === 1 ? (
            <CategoryStep
              selectedCategoryId={
                selectedCategoryId
              }
              onSelect={(id) => {
                setSelectedCategoryId(
                  id
                );

                setSelectedHabits([]);
              }}
              onBack={() =>
                setStep(0)
              }
              onNext={() => {
                if (
                  !selectedCategoryId
                ) {
                  Alert.alert(
                    "Choose a category",
                    "Pick one area to start with."
                  );

                  return;
                }

                setStep(2);
              }}
            />
          ) : (
            <HabitStep
              category={
                selectedCategory
              }
              selectedHabits={
                selectedHabits
              }
              onToggleHabit={
                toggleHabit
              }
              onBack={() =>
                setStep(1)
              }
              onFinish={
                finishOnboarding
              }
              submitting={
                submitting
              }
            />
          )}
        </ScrollView>
      </AnimatedScreen>
    </View>
  );
}

function IntroStep({ onNext }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.step}>
      <AppCard
        style={styles.heroCard}
      >
        <View
          style={[
            styles.heroGlow,
            {
              backgroundColor:
                `${
                  c.cyan ||
                  c.primary
                }12`,
            },
          ]}
        />

        <View
          style={[
            styles.heroIcon,
            {
              backgroundColor:
                `${
                  c.cyan ||
                  c.primary
                }14`,

              borderColor:
                c.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="orbit"
            size={42}
            color={
              c.cyan ||
              c.primary
            }
          />
        </View>

        <BrandBadge label="Momentum Begins" />

        <Text
          style={[
            styles.heroTitle,
            {
              color: c.text,
            },
          ]}
        >
          Small actions create lasting change.
        </Text>

        <Text
          style={[
            styles.heroText,
            {
              color:
                c.textSecondary,
            },
          ]}
        >
          Build habits, complete tasks,
          earn rewards, and level up
          your progress one day at a
          time.
        </Text>

        <View
          style={
            styles.featureList
          }
        >
          <Feature
            icon="check-circle"
            text="Complete habits and tasks"
          />

          <Feature
            icon="zap"
            text="Earn XP and level up"
          />

          <Feature
            icon="gift"
            text="Unlock rewards and themes"
          />
        </View>
      </AppCard>

      <AppButton
        title="Get Started"
        onPress={onNext}
        style={styles.button}
      />
    </View>
  );
}

function Feature({
  icon,
  text,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.feature}>
      <Feather
        name={icon}
        size={18}
        color={c.success}
      />

      <Text
        style={[
          styles.featureText,
          {
            color: c.text,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function CategoryStep({
  selectedCategoryId,
  onSelect,
  onBack,
  onNext,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.step}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: c.text,
          },
        ]}
      >
        Choose your starting focus
      </Text>

      <Text
        style={[
          styles.helperText,
          {
            color:
              c.textSecondary,
          },
        ]}
      >
        Start small. You can always
        expand later.
      </Text>

      {CATEGORIES.map(
        (category) => {
          const selected =
            selectedCategoryId ===
            category.id;

          return (
            <AnimatedPressable
              key={category.id}
              onPress={() =>
                onSelect(
                  category.id
                )
              }
            >
              <AppCard
                style={[
                  styles.optionCard,

                  selected && {
                    borderColor:
                      c.cyan ||
                      c.primary,
                  },
                ]}
              >
                <View
                  style={
                    styles.optionRow
                  }
                >
                  <View
                    style={[
                      styles.optionIcon,
                      {
                        backgroundColor:
                          selected
                            ? `${
                                c.cyan ||
                                c.primary
                              }18`
                            : c.surfaceAlt,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        category.icon
                      }
                      size={26}
                      color={
                        selected
                          ? c.cyan ||
                            c.primary
                          : c.textMuted
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.optionCopy
                    }
                  >
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color:
                            c.text,
                        },
                      ]}
                    >
                      {
                        category.title
                      }
                    </Text>

                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      {
                        category.description
                      }
                    </Text>
                  </View>

                  <Feather
                    name={
                      selected
                        ? "check-circle"
                        : "circle"
                    }
                    size={22}
                    color={
                      selected
                        ? c.cyan ||
                          c.primary
                        : c.textMuted
                    }
                  />
                </View>
              </AppCard>
            </AnimatedPressable>
          );
        }
      )}

      <View style={styles.actions}>
        <AppButton
          title="Back"
          variant="secondary"
          onPress={onBack}
          style={styles.actionButton}
        />

        <AppButton
          title="Next"
          onPress={onNext}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

function HabitStep({
  category,
  selectedHabits,
  onToggleHabit,
  onBack,
  onFinish,
  submitting,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.step}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: c.text,
          },
        ]}
      >
        Pick your starter habits
      </Text>

      <Text
        style={[
          styles.helperText,
          {
            color:
              c.textSecondary,
          },
        ]}
      >
        Choose one or more habits to
        begin building momentum.
      </Text>

      {(category?.habits || []).map(
        (habit) => {
          const selected =
            selectedHabits.some(
              (item) =>
                item.name ===
                habit.name
            );

          return (
            <AnimatedPressable
              key={habit.name}
              onPress={() =>
                onToggleHabit(
                  habit
                )
              }
            >
              <AppCard
                style={[
                  styles.optionCard,

                  selected && {
                    borderColor:
                      c.success,
                  },
                ]}
              >
                <View
                  style={
                    styles.optionRow
                  }
                >
                  <View
                    style={[
                      styles.optionIcon,
                      {
                        backgroundColor:
                          selected
                            ? `${c.success}18`
                            : c.surfaceAlt,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        habit.icon
                      }
                      size={25}
                      color={
                        selected
                          ? c.success
                          : c.textMuted
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.optionCopy
                    }
                  >
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color:
                            c.text,
                        },
                      ]}
                    >
                      {habit.name}
                    </Text>

                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      {
                        habit.description
                      }
                    </Text>
                  </View>

                  <Feather
                    name={
                      selected
                        ? "check-circle"
                        : "circle"
                    }
                    size={22}
                    color={
                      selected
                        ? c.success
                        : c.textMuted
                    }
                  />
                </View>
              </AppCard>
            </AnimatedPressable>
          );
        }
      )}

      <View style={styles.actions}>
        <AppButton
          title="Back"
          variant="secondary"
          onPress={onBack}
          style={styles.actionButton}
        />

        <AppButton
          title={
            submitting
              ? "Starting..."
              : "Start My Orbit"
          }
          onPress={onFinish}
          disabled={submitting}
          style={styles.actionButton}
        />
      </View>

      <AppButton
        title="Skip for Now"
        variant="ghost"
        onPress={onFinish}
        disabled={submitting}
        style={styles.skipButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  glowOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    top: -120,
    right: -90,
  },

  glowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    bottom: -100,
    left: -70,
  },

  container: {
    padding: spacing.xl,
    paddingTop: 56,
    paddingBottom: 80,
  },

  progressWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },

  progress: {
    marginBottom: spacing.sm,
  },

  progressText: {
    ...typography.caption,
    textAlign: "right",
  },

  step: {
    gap: spacing.md,
  },

  heroCard: {
    alignItems: "center",
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    top: -140,
    right: -120,
  },

  heroIcon: {
    width: 82,
    height: 82,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  heroTitle: {
    ...typography.h1,
    textAlign: "center",
    marginTop: spacing.lg,
  },

  heroText: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },

  featureList: {
    width: "100%",
    marginTop: spacing.xl,
    gap: spacing.sm,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  featureText: {
    ...typography.bodyBold,
  },

  sectionTitle: {
    ...typography.h2,
  },

  helperText: {
    ...typography.body,
    marginBottom: spacing.sm,
  },

  optionCard: {
    marginBottom: spacing.md,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  optionCopy: {
    flex: 1,
  },

  optionTitle: {
    ...typography.h3,
  },

  optionText: {
    ...typography.body,
    marginTop: spacing.xs,
  },

  actions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },

  actionButton: {
    flex: 1,
  },

  button: {
    marginTop: spacing.lg,
  },

  skipButton: {
    marginTop: spacing.sm,
  },
});