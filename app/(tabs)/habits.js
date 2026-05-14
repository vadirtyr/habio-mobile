import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  View,
} from "react-native";
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
import { BrandHeader } from "../../components/BrandMark";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import ThemedText from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";

export default function HabitsScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();

  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(0);
  const [streakCelebration, setStreakCelebration] = useState(null);

  const completedToday = useMemo(
    () => habits.filter((habit) => habit.completed_today).length,
    [habits]
  );

  const activeToday = Math.max(habits.length - completedToday, 0);
  const progressPercent =
    habits.length === 0 ? 0 : Math.round((completedToday / habits.length) * 100);

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

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      const bonus = data.streak_bonus || 0;

      setMessage(
        bonus > 0
          ? `+${data.base_coins} coins • +${bonus} streak bonus`
          : `+${data.coins_earned} coins`
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
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <ThemedText muted style={styles.loadingText}>
          Loading habits...
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StreakCelebration data={streakCelebration} theme={theme} />

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchHabits}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Daily rhythm" title="Habits" />

            <ThemedCard style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryGlow,
                  { backgroundColor: `${theme.colors.primary}18` },
                ]}
              />

              <View style={styles.summaryTop}>
                <View style={styles.summaryCopy}>
                  <ThemedText muted style={styles.summaryLabel}>
                    Today
                  </ThemedText>

                  <ThemedText style={styles.summaryTitle}>
                    {completedToday} of {habits.length} complete
                  </ThemedText>

                  <ThemedText muted style={styles.summarySubtitle}>
                    {activeToday > 0
                      ? `${activeToday} still waiting for you`
                      : habits.length > 0
                      ? "All habits complete. Great work."
                      : "Create your first habit to start."}
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.coinBadge,
                    { backgroundColor: theme.colors.surfaceAlt },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="circle-multiple"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <ThemedText style={styles.coinValue}>{balance}</ThemedText>
                </View>
              </View>

              <View
                style={[
                  styles.progressOuter,
                  { backgroundColor: theme.colors.surfaceAlt },
                ]}
              >
                <View
                  style={[
                    styles.progressInner,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.summaryActions}>
                <ThemedButton
                  style={styles.summaryButton}
                  onPress={() => router.push("/create-habit")}
                >
                  Add Habit
                </ThemedButton>
              </View>
            </ThemedCard>

            <RewardToast message={message} theme={theme} />

            {habits.length > 0 && (
              <View style={styles.sectionHeader}>
                <ThemedText variant="section">Today’s Habits</ThemedText>
                <ThemedText muted style={styles.sectionHint}>
                  Swipe right to complete. Swipe left to delete.
                </ThemedText>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <ThemedCard style={styles.emptyCard}>
            <Feather name="target" size={34} color={theme.colors.primary} />

            <ThemedText variant="section" style={styles.emptyTitle}>
              No habits yet
            </ThemedText>

            <ThemedText muted style={styles.emptyText}>
              Start small. Pick one habit you can repeat every day.
            </ThemedText>

            <ThemedButton onPress={() => router.push("/create-habit")}>
              Create Habit
            </ThemedButton>
          </ThemedCard>
        }
        renderItem={({ item, index }) => {
          const tier = getStreakTier(item.streak || 0);

          return (
            <Swipeable
              renderLeftActions={() =>
                item.completed_today ? null : (
                  <SwipeAction
                    theme={theme}
                    color={theme.colors.success}
                    icon="check-circle"
                    label="Done"
                  />
                )
              }
              renderRightActions={() => (
                <SwipeAction
                  theme={theme}
                  color={theme.colors.danger}
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
                  theme={theme}
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

function HabitCard({ item, tier, theme, onComplete, onEdit }) {
  return (
    <ThemedCard
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
                ? theme.colors.success
                : theme.colors.surfaceAlt,
              borderColor: item.completed_today
                ? theme.colors.success
                : theme.colors.border,
            },
          ]}
          onPress={onComplete}
        >
          <Feather
            name={item.completed_today ? "check" : "circle"}
            size={22}
            color={
              item.completed_today
                ? theme.colors.primaryText
                : theme.colors.textMuted
            }
          />
        </AnimatedPressable>

        <View style={styles.cardCopy}>
          <View style={styles.nameRow}>
            <ThemedText
              style={[
                styles.name,
                item.completed_today && styles.completedText,
              ]}
            >
              {item.name}
            </ThemedText>

            <AnimatedPressable
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={onEdit}
            >
              <Feather name="edit-3" size={15} color={theme.colors.text} />
            </AnimatedPressable>
          </View>

          {!!item.description && (
            <ThemedText muted style={styles.description}>
              {item.description}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <CompactPill
          theme={theme}
          icon="trending-up"
          text={`${item.streak || 0} day streak`}
          color={getStreakColor(item.streak, theme)}
          highlight={(item.streak || 0) >= 3}
        />

        <CompactPill
          theme={theme}
          icon={tier.icon}
          text={tier.label}
          color={tier.color}
          highlight
        />

        <CompactPill
          theme={theme}
          icon="award"
          text={getNextBonusText(item.streak || 0)}
        />
      </View>

      <View style={styles.statusRow}>
        <ThemedText
          style={[
            styles.status,
            {
              color: item.completed_today
                ? theme.colors.success
                : theme.colors.textMuted,
            },
          ]}
        >
          {item.completed_today ? "Completed today" : "Tap or swipe to complete"}
        </ThemedText>

        <ThemedText muted style={styles.coinText}>
          +{item.coins_per_completion || 0} coins
        </ThemedText>
      </View>
    </ThemedCard>
  );
}

function CompactPill({
  theme,
  icon,
  text,
  color = null,
  highlight = false,
}) {
  const pillColor = color || theme.colors.textMuted;

  return (
    <View
      style={[
        styles.compactPill,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: highlight ? pillColor : theme.colors.border,
        },
      ]}
    >
      <Feather name={icon} size={13} color={pillColor} />
      <ThemedText
        muted={!highlight}
        style={[styles.compactPillText, highlight && { color: pillColor }]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

function SwipeAction({ theme, color, icon, label, white = false }) {
  return (
    <View style={[styles.swipeAction, { backgroundColor: color }]}>
      <Feather
        name={icon}
        size={22}
        color={white ? "white" : theme.colors.primaryText}
      />
      <ThemedText
        style={[
          styles.swipeText,
          { color: white ? "white" : theme.colors.primaryText },
        ]}
      >
        {label}
      </ThemedText>
    </View>
  );
}

function getStreakTier(streak = 0) {
  if (streak >= 30) {
    return {
      label: "Legendary",
      color: "#F59E0B",
      icon: "award",
      glow: true,
    };
  }

  if (streak >= 14) {
    return {
      label: "Elite",
      color: "#8B5CF6",
      icon: "zap",
      glow: true,
    };
  }

  if (streak >= 7) {
    return {
      label: "On Fire",
      color: "#EF4444",
      icon: "zap",
      glow: false,
    };
  }

  if (streak >= 3) {
    return {
      label: "Momentum",
      color: "#10B981",
      icon: "trending-up",
      glow: false,
    };
  }

  return {
    label: "Starter",
    color: "#94A3B8",
    icon: "circle",
    glow: false,
  };
}

function getStreakColor(streak = 0, theme) {
  if (streak >= 7) return "#EF4444";
  if (streak >= 3) return theme.colors.success;
  return theme.colors.textMuted;
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

function RewardToast({ message, theme }) {
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
        animatedStyle,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.success,
        },
      ]}
    >
      <ThemedText style={[styles.toastText, { color: theme.colors.success }]}>
        {message}
      </ThemedText>
    </Animated.View>
  );
}

function StreakCelebration({ data, theme }) {
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
        <Animated.View
          style={[
            styles.celebrationCard,
            animatedStyle,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.success,
            },
          ]}
        >
          <View
            style={[
              styles.celebrationIconCircle,
              { backgroundColor: theme.colors.success },
            ]}
          >
            <Feather name="zap" size={38} color={theme.colors.primaryText} />
          </View>

          <ThemedText
            style={[styles.celebrationEyebrow, { color: theme.colors.success }]}
          >
            Streak Bonus
          </ThemedText>

          <ThemedText style={styles.celebrationTitle}>
            {data.streak} days strong
          </ThemedText>

          <ThemedText muted style={styles.celebrationName}>
            {data.habitName}
          </ThemedText>

          <View
            style={[
              styles.bonusBreakdown,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <ThemedText muted style={styles.bonusLine}>
              Base coins: +{data.baseCoins}
            </ThemedText>

            <ThemedText muted style={styles.bonusLine}>
              Bonus coins: +{data.bonus}
            </ThemedText>

            <ThemedText
              style={[styles.bonusTotal, { color: theme.colors.success }]}
            >
              Total earned: +{data.total}
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  listContent: {
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
  },

  summaryCard: {
    marginTop: 16,
    overflow: "hidden",
  },

  summaryGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -130,
    right: -90,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  summaryCopy: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  summaryTitle: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },

  summarySubtitle: {
    marginTop: 6,
    fontWeight: "700",
    lineHeight: 20,
  },

  coinBadge: {
    minWidth: 78,
    minHeight: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  coinValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "900",
  },

  progressOuter: {
    height: 11,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 20,
  },

  progressInner: {
    height: "100%",
    borderRadius: 999,
  },

  summaryActions: {
    marginTop: 18,
  },

  summaryButton: {
    alignSelf: "flex-start",
    minWidth: 132,
  },

  toast: {
    marginTop: 12,
    borderWidth: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
  },

  toastText: {
    fontWeight: "900",
    textAlign: "center",
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
  },

  sectionHint: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },

  emptyCard: {
    marginTop: 20,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,
  },

  emptyText: {
    marginTop: 6,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },

  card: {
    marginBottom: 12,
  },

  completedCard: {
    opacity: 0.62,
  },

  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  checkCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
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
    gap: 10,
  },

  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },

  completedText: {
    textDecorationLine: "line-through",
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  description: {
    marginTop: 4,
    lineHeight: 20,
  },

  cardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  compactPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },

  compactPillText: {
    fontWeight: "800",
    fontSize: 12,
  },

  statusRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  status: {
    flex: 1,
    fontWeight: "800",
  },

  coinText: {
    fontWeight: "800",
  },

  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 96,
    borderRadius: 18,
    marginBottom: 12,
    gap: 4,
  },

  swipeText: {
    fontWeight: "900",
  },

  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  celebrationCard: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },

  celebrationIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  celebrationEyebrow: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  celebrationTitle: {
    fontSize: 30,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },

  celebrationName: {
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },

  bonusBreakdown: {
    marginTop: 20,
    borderRadius: 18,
    padding: 14,
    width: "100%",
    borderWidth: 1,
  },

  bonusLine: {
    fontWeight: "800",
    marginBottom: 6,
  },

  bonusTotal: {
    fontWeight: "900",
    fontSize: 18,
    marginTop: 4,
  },
});