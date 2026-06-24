import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { AvatarUnlockModal } from "../../components/AvatarUnlockModal";
import { BrandHeader } from "../../components/BrandMark";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { MilestoneCelebrationModal } from "../../components/MilestoneCelebrationModal";
import { OrbitProgressBar } from "../../components/OrbitProgressBar";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { XPGainToast } from "../../components/XPGainToast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { useCelebrationQueue } from "../../hooks/useCelebrationQueue";
import { api } from "../../lib/api";
import { getOrbitItems, mergeUnique } from "../../lib/orbitItems";
import { radii, spacing, typography } from "../../lib/theme";

function isWeeklyTargetHabit(item) {
  return item?.frequency === "weekly" && Number(item?.weekly_target || 1) > 1;
}

function weeklyProgressText(item) {
  return `${item.weekly_completed_count || 0} / ${item.weekly_target || 1} this week`;
}

export default function HabitsScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(0);
  const [streakCelebration, setStreakCelebration] = useState(null);
  const [xpToast, setXpToast] = useState(0);
  const [avatarUnlock, setAvatarUnlock] = useState(null);

  const firstBalanceLoad = useRef(true);
  const coinScale = useSharedValue(1);
  const {
    activeCelebration,
    celebrationCount,
    enqueueCelebrations,
    loadPendingCelebrations,
    dismissCelebration,
  } = useCelebrationQueue();

  const coinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinScale.value }],
  }));

  useEffect(() => {
    if (firstBalanceLoad.current) {
      firstBalanceLoad.current = false;
      return;
    }

    coinScale.value = withSequence(
      withSpring(1.1, { damping: 12, stiffness: 260 }),
      withSpring(1, { damping: 14, stiffness: 240 })
    );
  }, [balance]);

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      const groupA = getHabitGroupLabel(a);
      const groupB = getHabitGroupLabel(b);
      if (groupA !== groupB) return groupA === "Personal" ? -1 : groupA.localeCompare(groupB);
      if (!!a.completed_today === !!b.completed_today) return 0;
      return a.completed_today ? 1 : -1;
    });
  }, [habits]);

  const groupedHabits = useMemo(() => withGroupHeaders(sortedHabits, getHabitGroupLabel), [sortedHabits]);

  const completedToday = useMemo(
    () => habits.filter((habit) => habit.completed_today).length,
    [habits]
  );

  const activeToday = Math.max(habits.length - completedToday, 0);

  const progressPercent =
    habits.length === 0
      ? 0
      : Math.round((completedToday / habits.length) * 100);

  const orbitComplete = habits.length > 0 && completedToday === habits.length;

  async function fetchHabits() {
    if (!token) return;

    setError(null);

    try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance || 0);

      const [data, orbitItems] = await Promise.all([
        api.get("/habits", token),
        getOrbitItems().catch(() => ({ habits: [] })),
      ]);
      setHabits(mergeUnique(Array.isArray(data) ? data : [], orbitItems.habits, "habit"));
    } catch (error) {
      setError(error?.message || "Unable to load habits.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchHabits();
  }

  async function completeHabit(habitId) {
    const habit = habits.find((h) => h.id === habitId || h._list_key === habitId);
    if (!habit || habit.completed_today || !token) return;

    if (habit.is_orbit_item && habit.requires_proof) {
      router.push({ pathname: "/orbit-detail", params: { orbitId: habit.orbit_id } });
      return;
    }

    setHabits((current) =>
      current.map((h) => {
        const matches = h._list_key === habit._list_key || (!h._list_key && h.id === habit.id);
        if (!matches) return h;
        if (isWeeklyTargetHabit(h)) {
          const nextCount = Math.min((h.weekly_completed_count || 0) + 1, h.weekly_target || 1);
          const done = nextCount >= (h.weekly_target || 1);
          return {
            ...h,
            weekly_completed_count: nextCount,
            weekly_remaining_count: Math.max((h.weekly_target || 1) - nextCount, 0),
            completed_today: done,
            is_completed_for_period: done,
            streak: done ? (h.streak || 0) + 1 : h.streak,
          };
        }
        return { ...h, completed_today: true, streak: (h.streak || 0) + 1 };
      })
    );

    setBalance((current) => current + (habit.coins_per_completion || 0));

    try {
      if (habit.is_orbit_item) {
        await api.completeOrbitHabit(habit.orbit_id, habit.id);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage(`Completed for ${habit.orbit_name}`);
        setTimeout(() => setMessage(null), 1800);
        await fetchHabits();
        return;
      }
      const data = await api.post(`/habits/${habit.id}/complete`, {}, token);
      if (data?.habit) {
        setHabits((current) =>
          current.map((h) =>
            h._list_key === habit._list_key || (!h._list_key && h.id === habit.id)
              ? { ...h, ...data.habit }
              : h
          )
        );
      }
      const hasMilestone = (data?.celebrations?.length || 0) > 0;

      enqueueCelebrations(data?.celebrations || []);

      if (data?.new_avatars?.length > 0) {
        setAvatarUnlock(data.new_avatars[0]);
      }

      setXpToast(data.xp_earned || 0);
      setTimeout(() => setXpToast(0), 900);

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

      if (bonus > 0 && !hasMilestone) {
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
      Alert.alert("Could not complete habit", error.message);
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
      Alert.alert("Could not delete habit", error.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      fetchHabits();
      loadPendingCelebrations();
    }, [token])
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <BrandHeader
          eyebrow="OurOrbit"
          title="Habits"
          subtitle="Loading your orbit..."
          compact
        />

        <SkeletonCard lines={2} />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard compact />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <BrandHeader
          eyebrow="OurOrbit"
          title="Habits"
          subtitle="Keep your daily orbit moving."
          compact
        />

        <ErrorState
          title="Habits unavailable"
          description={error}
          onRetry={fetchHabits}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StreakCelebration data={streakCelebration} />

      <MilestoneCelebrationModal
        celebration={activeCelebration}
        remaining={celebrationCount}
        onDismiss={dismissCelebration}
      />

      <XPGainToast xp={xpToast} />

      <AvatarUnlockModal
        visible={!!avatarUnlock && !activeCelebration}
        avatar={avatarUnlock}
        onClose={() => setAvatarUnlock(null)}
      />

      <FlatList
        data={groupedHabits}
        keyExtractor={(item) => item._type === "group" ? item.id : item._list_key || item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <BrandHeader
              eyebrow="OurOrbit"
              title="Habits"
              subtitle="Keep your daily orbit moving."
              compact
            />

            <AppCard style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryGlowCyan,
                  {
                    backgroundColor:
                      c.surfaceGlow || `${c.cyan || c.primary}18`,
                  },
                ]}
              />
              <View
                style={[
                  styles.summaryGlowCoral,
                  { backgroundColor: `${c.coral || c.primary}12` },
                ]}
              />

              <View style={styles.summaryTop}>
                <View style={styles.summaryCopy}>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
                    Today
                  </Text>

                  <Text style={[styles.summaryTitle, { color: c.text }]}>
                    {completedToday} of {habits.length} complete
                  </Text>

                  <Text style={[styles.summarySubtitle, { color: c.textSecondary }]}>
                    {activeToday > 0
                      ? `${activeToday} still waiting for you`
                      : orbitComplete
                      ? "Today’s orbit is complete."
                      : "Create your first habit to start."}
                  </Text>
                </View>

                <Animated.View
                  style={[
                    styles.coinBadge,
                    {
                      backgroundColor: `${c.gold || c.primary}18`,
                      borderColor: c.border,
                    },
                    coinAnimatedStyle,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="circle-multiple"
                    size={24}
                    color={c.gold || c.primary}
                  />

                  <Text style={[styles.coinValue, { color: c.text }]}>
                    {balance}
                  </Text>
                </Animated.View>
              </View>

              <OrbitProgressBar
                percent={progressPercent}
                style={styles.progressBar}
                glow
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
                subtitle="Tap or swipe to complete."
                action={
                  <Text style={[styles.sectionHint, { color: c.textMuted || c.muted }]}>
                    Swipe to manage
                  </Text>
                }
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <AppCard style={styles.emptyCard}>
            <EmptyState
              title="No habits yet"
              description="Start small. Pick one habit you can repeat every day."
              icon={
                <Feather
                  name="target"
                  size={38}
                  color={c.cyan || c.primary}
                />
              }
            />

            <AppButton
              title="Create Habit"
              onPress={() => router.push("/create-habit")}
            />
          </AppCard>
        }
        renderItem={({ item, index }) => {
          if (item._type === "group") {
            return <GroupHeader title={item.title} count={item.count} />;
          }

          const tier = getStreakTier(item.streak || 0, c);

          return (
            <Swipeable
              renderLeftActions={() =>
                item.completed_today ? null : (
                  <SwipeAction
                    color={c.success}
                    icon="check-circle"
                    label="Done"
                  />
                )
              }
              renderRightActions={() => item.is_orbit_item ? null : (
                <SwipeAction
                  color={c.danger}
                  icon="trash-2"
                  label="Delete"
                  white
                />
              )}
              onSwipeableOpen={(direction) => {
                if (direction === "left") completeHabit(item._list_key || item.id);
                if (direction === "right" && !item.is_orbit_item) confirmDeleteHabit(item.id);
              }}
            >
              <AnimatedCard index={index}>
                <HabitCard
                  item={item}
                  tier={tier}
                  onComplete={() => completeHabit(item._list_key || item.id)}
                  onEdit={item.is_orbit_item ? null : () =>
                    router.push({
                      pathname: "/edit-habit",
                      params: {
                        id: item.id,
                        name: item.name,
                        description: item.description || "",
                        frequency: item.frequency || "daily",
                        recurrence_type: item.recurrence_type || item.frequency || "daily",
                        interval: String(item.interval || 1),
                        days_of_week: JSON.stringify(item.days_of_week || []),
                        day_of_month: String(item.day_of_month || ""),
                        annual_month: String(item.annual_month || ""),
                        annual_day: String(item.annual_day || ""),
                        show_days_before: String(item.show_days_before || 0),
                        weekly_target: String(item.weekly_target || 1),
                        difficulty: item.difficulty || "medium",
                        custom_coins: item.custom_coins || "",
                        icon: item.icon || "fire",
                        category: item.category || "custom",
                        reminder_enabled: item.reminder_enabled ? "true" : "false",
                        reminder_time: item.reminder_time || "",
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

function getHabitGroupLabel(item) {
  return item?.is_orbit_item ? `Orbit: ${item.orbit_name || "Shared Orbit"}` : "Personal";
}

function withGroupHeaders(items, getLabel) {
  const counts = items.reduce((acc, item) => {
    const label = getLabel(item);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const output = [];
  let currentLabel = null;
  items.forEach((item) => {
    const label = getLabel(item);
    if (label !== currentLabel) {
      currentLabel = label;
      output.push({ _type: "group", id: `group-${label}`, title: label, count: counts[label] || 0 });
    }
    output.push(item);
  });
  return output;
}

function GroupHeader({ title, count }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={styles.groupHeader}>
      <Text style={[styles.groupTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.groupCount, { color: c.textMuted }]}>{count}</Text>
    </View>
  );
}

function HabitCard({ item, tier, onComplete, onEdit }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const isMaintenance = item.category === "maintenance";

  const cardScale = useSharedValue(1);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  function handleComplete() {
    if (item.completed_today) return;

    cardScale.value = withSequence(
      withSpring(1.025, { damping: 12, stiffness: 260 }),
      withSpring(1, { damping: 15, stiffness: 240 })
    );

    ringOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 360 })
    );

    ringScale.value = withSequence(
      withTiming(0.55, { duration: 1 }),
      withTiming(1.8, { duration: 420 })
    );

    onComplete();
  }

  return (
    <Animated.View
      style={[
        cardAnimatedStyle,
        item.completed_today && styles.completedHabitWrap,
      ]}
    >
      <AppCard
        style={[
          styles.card,
          item.completed_today && {
            borderColor: `${c.success}40`,
            backgroundColor: `${c.success}08`,
          },
          tier.glow && { borderColor: tier.color },
        ]}
      >
        <View style={styles.cardTop}>
          <AnimatedPressable
            style={[
              styles.checkCircle,
              {
                backgroundColor: item.completed_today ? c.success : c.surfaceAlt,
                borderColor: item.completed_today ? c.success : c.border,
              },
            ]}
            onPress={handleComplete}
            disabled={item.completed_today}
            scaleTo={0.94}
          >
            <Animated.View
              style={[
                styles.completionRing,
                { backgroundColor: `${c.success}35` },
                ringAnimatedStyle,
              ]}
            />

            <Feather
              name={item.completed_today ? "check" : "circle"}
              size={22}
              color={item.completed_today ? "#FFFFFF" : c.textMuted || c.muted}
            />
          </AnimatedPressable>

          <View style={styles.cardCopy}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.name,
                  { color: item.completed_today ? c.success : c.text },
                ]}
              >
                {item.name}
              </Text>

              {!item.is_orbit_item && <AnimatedPressable
                style={[
                  styles.iconButton,
                  {
                    borderColor: c.border,
                    backgroundColor: c.surfaceAlt,
                  },
                ]}
                onPress={onEdit}
              >
                <Feather name="edit-3" size={15} color={c.text} />
              </AnimatedPressable>}
            </View>

            {!!item.description && (
              <Text style={[styles.description, { color: c.textSecondary }]}>
                {item.description}
              </Text>
            )}
            <Text style={[styles.orbitLabel, { color: item.is_orbit_item ? c.primary : c.textMuted }]}>{item.is_orbit_item ? item.orbit_name : "Personal"}</Text>
            {isWeeklyTargetHabit(item) ? (
              <Text style={[styles.orbitLabel, { color: c.primary }]}>
                {weeklyProgressText(item)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardFooter}>
          {isMaintenance ? (
            <CompactPill
              icon="bell"
              text="Maintenance"
              color={c.cyan || c.primary}
              highlight
            />
          ) : null}

          {isWeeklyTargetHabit(item) ? (
            <CompactPill
              icon="target"
              text={weeklyProgressText(item)}
              color={c.primary}
              highlight
            />
          ) : null}

          <CompactPill
            icon="trending-up"
            text={`${item.streak || 0} day streak`}
            color={getStreakColor(item.streak, c)}
            highlight={(item.streak || 0) >= 3}
          />

          {!isMaintenance ? (
            <>
              <CompactPill
                icon={tier.icon}
                text={tier.label}
                color={tier.color}
                highlight
              />

              <CompactPill
                icon="award"
                text={getNextBonusText(item.streak || 0)}
              />
            </>
          ) : (
            <CompactPill
              icon="circle"
              text="Low reward"
              color={c.textMuted || c.muted}
            />
          )}
        </View>

        <View style={styles.statusRow}>
          <Text
            style={[
              styles.status,
              {
                color: item.completed_today ? c.success : c.textMuted || c.muted,
              },
            ]}
          >
            {item.completed_today
              ? isWeeklyTargetHabit(item)
                ? "Weekly target met"
                : "Completed today"
              : isWeeklyTargetHabit(item)
              ? "Mark instance complete"
              : isMaintenance
              ? "Reminder habit"
              : "Tap or swipe to complete"}
          </Text>

          <Text style={[styles.coinText, { color: c.textSecondary }]}>
            +{item.coins_per_completion || 0} coins
          </Text>
        </View>
      </AppCard>
    </Animated.View>
  );
}

function CompactPill({ icon, text, color = null, highlight = false }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const pillColor = color || c.textMuted || c.muted;

  return (
    <View
      style={[
        styles.compactPill,
        {
          backgroundColor: highlight ? `${pillColor}12` : c.surfaceAlt,
          borderColor: highlight ? pillColor : c.border,
        },
      ]}
    >
      <Feather name={icon} size={13} color={pillColor} />

      <Text
        style={[
          styles.compactPillText,
          { color: highlight ? pillColor : c.textSecondary },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SwipeAction({ color, icon, label, white = false }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.swipeAction, { backgroundColor: color }]}>
      <Feather
        name={icon}
        size={22}
        color={white ? "#FFFFFF" : c.primaryText || c.primary}
      />

      <Text
        style={[
          styles.swipeText,
          { color: white ? "#FFFFFF" : c.primaryText || c.primary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function getStreakTier(streak = 0, c) {
  if (streak >= 30) {
    return {
      label: "Legendary",
      color: c.gold,
      icon: "award",
      glow: true,
    };
  }

  if (streak >= 14) {
    return {
      label: "Elite",
      color: c.blue,
      icon: "zap",
      glow: true,
    };
  }

  if (streak >= 7) {
    return {
      label: "On Fire",
      color: c.coral,
      icon: "zap",
      glow: false,
    };
  }

  if (streak >= 3) {
    return {
      label: "Momentum",
      color: c.success,
      icon: "trending-up",
      glow: false,
    };
  }

  return {
    label: "Starter",
    color: c.textMuted || c.muted,
    icon: "circle",
    glow: false,
  };
}

function getStreakColor(streak = 0, c) {
  if (streak >= 7) return c.coral;
  if (streak >= 3) return c.success;
  return c.textMuted || c.muted;
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
  const { theme } = useTheme();
  const c = theme.colors;

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
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: `${c.success}12`,
          borderColor: c.success,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.toastText, { color: c.success }]}>{message}</Text>
    </Animated.View>
  );
}

function StreakCelebration({ data }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);
  const glowScale = useSharedValue(0.8);

  useEffect(() => {
    if (data) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withSpring(0);
      scale.value = withSequence(withSpring(1.12), withSpring(1));
      glowScale.value = withSequence(
        withTiming(1.08, { duration: 260 }),
        withTiming(1, { duration: 260 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 160 });
      translateY.value = withTiming(28, { duration: 160 });
      scale.value = withTiming(0.55, { duration: 160 });
      glowScale.value = withTiming(0.8, { duration: 160 });
    }
  }, [data]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  if (!data) return null;

  return (
    <Modal visible transparent animationType="none">
      <View style={styles.celebrationOverlay}>
        <Animated.View
          style={[
            styles.celebrationCard,
            {
              borderColor: c.success,
              backgroundColor: c.surface,
            },
            animatedStyle,
          ]}
        >
          <Animated.View
            style={[
              styles.celebrationGlow,
              { backgroundColor: `${c.success}16` },
              glowAnimatedStyle,
            ]}
          />

          <View
            style={[
              styles.celebrationIconCircle,
              { backgroundColor: c.success },
            ]}
          >
            <Feather name="zap" size={38} color="#FFFFFF" />
          </View>

          <Text style={[styles.celebrationEyebrow, { color: c.success }]}>
            Streak Bonus
          </Text>

          <Text style={[styles.celebrationTitle, { color: c.text }]}>
            {data.streak} days strong
          </Text>

          <Text style={[styles.celebrationName, { color: c.textSecondary }]}>
            {data.habitName}
          </Text>

          <View
            style={[
              styles.bonusBreakdown,
              {
                borderColor: c.border,
                backgroundColor: c.surfaceAlt,
              },
            ]}
          >
            <Text style={[styles.bonusLine, { color: c.textSecondary }]}>
              Base coins: +{data.baseCoins}
            </Text>

            <Text style={[styles.bonusLine, { color: c.textSecondary }]}>
              Bonus coins: +{data.bonus}
            </Text>

            <Text style={[styles.bonusTotal, { color: c.success }]}>
              Total earned: +{data.total}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  listContent: {
    paddingBottom: 120,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  groupTitle: {
    ...typography.bodyBold,
  },

  groupCount: {
    ...typography.caption,
    fontWeight: "800",
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
  },

  summaryGlowCoral: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
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
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  summaryTitle: {
    ...typography.h2,
    marginTop: spacing.xs,
  },

  summarySubtitle: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
  },

  coinBadge: {
    minWidth: 78,
    minHeight: 78,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderWidth: 1,
  },

  coinValue: {
    ...typography.h3,
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
  },

  toastText: {
    ...typography.bodyBold,
    textAlign: "center",
  },

  sectionHint: {
    ...typography.caption,
  },

  emptyCard: {
    marginTop: spacing.xl,
    alignItems: "center",
  },

  completedHabitWrap: {
    opacity: 0.84,
  },

  card: {
    marginBottom: spacing.md,
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
    overflow: "hidden",
  },

  completionRing: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: radii.pill,
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
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  description: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  orbitLabel: { ...typography.caption, fontWeight: "800", marginTop: spacing.xs },

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
    alignItems: "center",
    overflow: "hidden",
  },

  celebrationGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -150,
  },

  celebrationIconCircle: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  celebrationEyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  celebrationTitle: {
    ...typography.h1,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  celebrationName: {
    ...typography.bodyBold,
    marginTop: spacing.xs,
    textAlign: "center",
  },

  bonusBreakdown: {
    marginTop: spacing.xl,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: "100%",
    borderWidth: 1,
  },

  bonusLine: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },

  bonusTotal: {
    ...typography.h3,
    marginTop: spacing.xs,
  },
});
