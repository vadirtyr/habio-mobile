import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { EmptyState } from "../../components/EmptyState";
import { LevelUpModal } from "../../components/LevelUpModal";
import { OrbitProgressBar } from "../../components/OrbitProgressBar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { XPGainToast } from "../../components/XPGainToast";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors, radii, spacing, typography } from "../../lib/theme";

export default function HabitsScreen() {
  const { token } = useAuth();

  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(0);
  const [streakCelebration, setStreakCelebration] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [xpToast, setXpToast] = useState(0);

  const completedToday = useMemo(
    () => habits.filter((habit) => habit.completed_today).length,
    [habits]
  );

  const activeToday = Math.max(habits.length - completedToday, 0);
  const progressPercent =
    habits.length === 0
      ? 0
      : Math.round((completedToday / habits.length) * 100);

  async function fetchHabits() {
    if (!token) return;

    try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance || 0);

      const data = await api.get("/habits", token);
      setHabits(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeHabit(habitId) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || habit.completed_today || !token) return;

    setHabits((current) =>
      current.map((h) =>
        h.id === habitId
          ? { ...h, completed_today: true, streak: (h.streak || 0) + 1 }
          : h
      )
    );

    setBalance((current) => current + (habit.coins_per_completion || 0));

    try {
      const data = await api.post(`/habits/${habitId}/complete`, {}, token);

      if (data.leveled_up) {
        setLevelUp({
          oldLevel: data.old_level,
          newLevel: data.new_level,
        });
      }

      setXpToast(data.xp_earned || 0);

      setTimeout(() => {
        setXpToast(0);
      }, 900);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      const bonus = data.streak_bonus || 0;

      setMessage(
        bonus > 0
          ? `+${data.base_coins} coins • +${bonus} streak bonus • +${
              data.xp_earned || 0
            } XP`
          : `+${data.coins_earned} coins • +${data.xp_earned || 0} XP`
      );

      setBalance(data.new_balance);

      if (bonus > 0) {
        setStreakCelebration({
          habitName: habit.name,
          streak: data.streak,
          baseCoins: data.base_coins,
          bonus,
          total: data.coins_earned,
        });

        setTimeout(() => setStreakCelebration(null), 2200);
      }

      setTimeout(() => setMessage(null), 2200);
    } catch (error) {
      fetchHabits();
      Alert.alert("Error", error.message);
    }
  }

  function confirmDeleteHabit(habitId) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    Alert.alert("Delete habit?", `Delete “${habit.name}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteHabit(habit),
      },
    ]);
  }

  async function deleteHabit(habit) {
    if (!token) return;

    const previous = habits;
    setHabits((current) => current.filter((h) => h.id !== habit.id));

    try {
      await api.delete(`/habits/${habit.id}`, token);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

      setMessage("Habit deleted");
      setTimeout(() => setMessage(null), 1600);
    } catch (error) {
      setHabits(previous);
      Alert.alert("Error", error.message);
    }
  }

  useEffect(() => {
    fetchHabits();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchHabits();
    }, [token])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Habits" subtitle="Loading your orbit..." />

        <SkeletonCard lines={2} />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard compact />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StreakCelebration data={streakCelebration} />

      <LevelUpModal
        visible={!!levelUp}
        oldLevel={levelUp?.oldLevel}
        newLevel={levelUp?.newLevel}
        onClose={() => setLevelUp(null)}
      />

      <XPGainToast xp={xpToast} />

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchHabits}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title="Habits"
              subtitle="Keep your daily orbit moving."
            />

            <AppCard style={styles.summaryCard}>
              <View style={styles.summaryGlowCyan} />
              <View style={styles.summaryGlowCoral} />

              <View style={styles.summaryTop}>
                <View style={styles.summaryCopy}>
                  <Text style={styles.summaryLabel}>Today</Text>

                  <Text style={styles.summaryTitle}>
                    {completedToday} of {habits.length} complete
                  </Text>

                  <Text style={styles.summarySubtitle}>
                    {activeToday > 0
                      ? `${activeToday} still waiting for you`
                      : habits.length > 0
                      ? "All habits complete. Great work."
                      : "Create your first habit to start."}
                  </Text>
                </View>

                <View style={styles.coinBadge}>
                  <MaterialCommunityIcons
                    name="circle-multiple"
                    size={24}
                    color={colors.gold}
                  />
                  <Text style={styles.coinValue}>{balance}</Text>
                </View>
              </View>

              <OrbitProgressBar
                percent={progressPercent}
                style={styles.progressBar}
              />

              <View style={styles.summaryActions}>
                <AppButton
                  title="Add Habit"
                  style={styles.summaryButton}
                  onPress={() => router.push("/create-habit")}
                />
              </View>
            </AppCard>

            <RewardToast message={message} />

            {habits.length > 0 ? (
              <SectionTitle
                title="Today’s Habits"
                action={<Text style={styles.sectionHint}>Swipe to manage</Text>}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <AppCard style={styles.emptyCard}>
            <EmptyState
              title="No habits yet"
              description="Start small. Pick one habit you can repeat every day."
              icon={<Feather name="target" size={38} color={colors.cyan} />}
            />

            <AppButton
              title="Create Habit"
              onPress={() => router.push("/create-habit")}
            />
          </AppCard>
        }
        renderItem={({ item, index }) => {
          const tier = getStreakTier(item.streak || 0);

          return (
            <Swipeable
              renderLeftActions={() =>
                item.completed_today ? null : (
                  <SwipeAction
                    color={colors.success}
                    icon="check-circle"
                    label="Done"
                  />
                )
              }
              renderRightActions={() => (
                <SwipeAction
                  color={colors.danger}
                  icon="trash-2"
                  label="Delete"
                  white
                />
              )}
              onSwipeableOpen={(direction) => {
                if (direction === "left") completeHabit(item.id);
                if (direction === "right") confirmDeleteHabit(item.id);
              }}
            >
              <AnimatedCard index={index}>
                <HabitCard
                  item={item}
                  tier={tier}
                  onComplete={() => completeHabit(item.id)}
                  onEdit={() =>
                    router.push({
                      pathname: "/edit-habit",
                      params: {
                        id: item.id,
                        name: item.name,
                        description: item.description || "",
                        frequency: item.frequency || "daily",
                        difficulty: item.difficulty || "medium",
                        custom_coins: item.custom_coins || "",
                        icon: item.icon || "flame",
                      },
                    })
                  }
                />
              </AnimatedCard>
            </Swipeable>
          );
        }}
      />
    </View>
  );
}

function HabitCard({ item, tier, onComplete, onEdit }) {
  return (
    <AppCard
      style={[
        styles.card,
        item.completed_today && styles.completedCard,
        tier.glow && { borderColor: tier.color },
      ]}
    >
      <View style={styles.cardTop}>
        <AnimatedPressable
          style={[
            styles.checkCircle,
            {
              backgroundColor: item.completed_today
                ? colors.success
                : colors.surfaceAlt,
              borderColor: item.completed_today ? colors.success : colors.border,
            },
          ]}
          onPress={onComplete}
        >
          <Feather
            name={item.completed_today ? "check" : "circle"}
            size={22}
            color={item.completed_today ? colors.white : colors.textMuted}
          />
        </AnimatedPressable>

        <View style={styles.cardCopy}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, item.completed_today && styles.completedText]}
            >
              {item.name}
            </Text>

            <AnimatedPressable style={styles.iconButton} onPress={onEdit}>
              <Feather name="edit-3" size={15} color={colors.text} />
            </AnimatedPressable>
          </View>

          {!!item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <CompactPill
          icon="trending-up"
          text={`${item.streak || 0} day streak`}
          color={getStreakColor(item.streak)}
          highlight={(item.streak || 0) >= 3}
        />

        <CompactPill
          icon={tier.icon}
          text={tier.label}
          color={tier.color}
          highlight
        />

        <CompactPill icon="award" text={getNextBonusText(item.streak || 0)} />
      </View>

      <View style={styles.statusRow}>
        <Text
          style={[
            styles.status,
            {
              color: item.completed_today ? colors.success : colors.textMuted,
            },
          ]}
        >
          {item.completed_today ? "Completed today" : "Tap or swipe to complete"}
        </Text>

        <Text style={styles.coinText}>
          +{item.coins_per_completion || 0} coins
        </Text>
      </View>
    </AppCard>
  );
}

function CompactPill({ icon, text, color = null, highlight = false }) {
  const pillColor = color || colors.textMuted;

  return (
    <View
      style={[
        styles.compactPill,
        {
          backgroundColor: highlight ? `${pillColor}12` : colors.surfaceAlt,
          borderColor: highlight ? pillColor : colors.border,
        },
      ]}
    >
      <Feather name={icon} size={13} color={pillColor} />
      <Text
        style={[
          styles.compactPillText,
          { color: highlight ? pillColor : colors.textSecondary },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SwipeAction({ color, icon, label, white = false }) {
  return (
    <View style={[styles.swipeAction, { backgroundColor: color }]}>
      <Feather
        name={icon}
        size={22}
        color={white ? colors.white : colors.primary}
      />
      <Text
        style={[
          styles.swipeText,
          { color: white ? colors.white : colors.primary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function getStreakTier(streak = 0) {
  if (streak >= 30) {
    return {
      label: "Legendary",
      color: colors.gold,
      icon: "award",
      glow: true,
    };
  }

  if (streak >= 14) {
    return {
      label: "Elite",
      color: colors.blue,
      icon: "zap",
      glow: true,
    };
  }

  if (streak >= 7) {
    return {
      label: "On Fire",
      color: colors.coral,
      icon: "zap",
      glow: false,
    };
  }

  if (streak >= 3) {
    return {
      label: "Momentum",
      color: colors.success,
      icon: "trending-up",
      glow: false,
    };
  }

  return {
    label: "Starter",
    color: colors.textMuted,
    icon: "circle",
    glow: false,
  };
}

function getStreakColor(streak = 0) {
  if (streak >= 7) return colors.coral;
  if (streak >= 3) return colors.success;
  return colors.textMuted;
}

function getNextBonusText(streak = 0) {
  if (streak < 3) return `${3 - streak}d to bonus`;
  if (streak < 7) return `${7 - streak}d to +15`;
  if (streak < 14) return `${14 - streak}d to +30`;
  if (streak < 30) return `${30 - streak}d to +75`;
  return "+75 active";
}

function AnimatedCard({ children, index = 0 }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 240 }));
    translateY.value = withDelay(index * 45, withTiming(0, { duration: 240 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

function RewardToast({ message }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (message) {
      opacity.value = withTiming(1, { duration: 180 });
      scale.value = withSequence(withSpring(1.08), withSpring(1));
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [message]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, animatedStyle]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

function StreakCelebration({ data }) {
  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    if (data) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withSpring(0);
      scale.value = withSequence(withSpring(1.12), withSpring(1));
    } else {
      opacity.value = withTiming(0, { duration: 160 });
      translateY.value = withTiming(28, { duration: 160 });
      scale.value = withTiming(0.55, { duration: 160 });
    }
  }, [data]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!data) return null;

  return (
    <Modal visible transparent animationType="none">
      <View style={styles.celebrationOverlay}>
        <Animated.View style={[styles.celebrationCard, animatedStyle]}>
          <View style={styles.celebrationIconCircle}>
            <Feather name="zap" size={38} color={colors.white} />
          </View>

          <Text style={styles.celebrationEyebrow}>Streak Bonus</Text>

          <Text style={styles.celebrationTitle}>{data.streak} days strong</Text>

          <Text style={styles.celebrationName}>{data.habitName}</Text>

          <View style={styles.bonusBreakdown}>
            <Text style={styles.bonusLine}>Base coins: +{data.baseCoins}</Text>
            <Text style={styles.bonusLine}>Bonus coins: +{data.bonus}</Text>
            <Text style={styles.bonusTotal}>Total earned: +{data.total}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  listContent: {
    paddingBottom: 120,
  },

  summaryCard: {
    overflow: "hidden",
  },

  summaryGlowCyan: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    top: -130,
    right: -90,
    backgroundColor: `${colors.cyan}18`,
  },

  summaryGlowCoral: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
    backgroundColor: `${colors.coral}12`,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  summaryCopy: {
    flex: 1,
  },

  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  summaryTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },

  summarySubtitle: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  coinBadge: {
    minWidth: 78,
    minHeight: 78,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: `${colors.gold}18`,
    borderWidth: 1,
    borderColor: colors.border,
  },

  coinValue: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },

  progressBar: {
    marginTop: spacing.xl,
  },

  summaryActions: {
    marginTop: spacing.lg,
  },

  summaryButton: {
    alignSelf: "flex-start",
    minWidth: 132,
  },

  toast: {
    marginTop: spacing.md,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    backgroundColor: `${colors.success}12`,
    borderColor: colors.success,
  },

  toastText: {
    ...typography.bodyBold,
    color: colors.success,
    textAlign: "center",
  },

  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },

  emptyCard: {
    marginTop: spacing.xl,
    alignItems: "center",
  },

  card: {
    marginBottom: spacing.md,
  },

  completedCard: {
    opacity: 0.62,
  },

  cardTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  checkCircle: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  cardCopy: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  name: {
    flex: 1,
    ...typography.h3,
    color: colors.text,
  },

  completedText: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  cardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  compactPill: {
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
  },

  compactPillText: {
    fontWeight: "800",
    fontSize: 12,
  },

  statusRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  status: {
    flex: 1,
    ...typography.caption,
  },

  coinText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 96,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },

  swipeText: {
    fontWeight: "900",
  },

  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },

  celebrationCard: {
    width: "100%",
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.surface,
    alignItems: "center",
  },

  celebrationIconCircle: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    backgroundColor: colors.success,
  },

  celebrationEyebrow: {
    ...typography.caption,
    color: colors.success,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  celebrationTitle: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  celebrationName: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },

  bonusBreakdown: {
    marginTop: spacing.xl,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },

  bonusLine: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  bonusTotal: {
    ...typography.h3,
    color: colors.success,
    marginTop: spacing.xs,
  },
});