import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

  async function fetchHabits() {
    if (!token) return;

    try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance);

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
          ? { ...h, completed_today: true, streak: h.streak + 1 }
          : h
      )
    );

    setBalance((b) => b + (habit.coins_per_completion || 0));

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
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
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
            <BrandHeader eyebrow="Today" title="Your Habits" />

            <ThemedCard style={styles.balanceCard}>
              <ThemedText muted style={styles.balanceLabel}>
                Coins
              </ThemedText>
              <ThemedText style={styles.balanceValue}>{balance}</ThemedText>
              <ThemedText muted style={styles.balanceSub}>
                Streak bonuses start at 3 days.
              </ThemedText>
            </ThemedCard>

            <ThemedButton
              style={styles.addButton}
              onPress={() => router.push("/create-habit")}
            >
              Add Habit
            </ThemedButton>

            <RewardToast message={message} theme={theme} />
          </View>
        }
        ListEmptyComponent={
          <ThemedCard style={styles.emptyCard}>
            <Feather name="target" size={34} color={theme.colors.primary} />
            <ThemedText variant="section" style={styles.emptyTitle}>
              No habits yet
            </ThemedText>
            <ThemedText muted style={styles.emptyText}>
              Start building momentum today.
            </ThemedText>
            <ThemedButton onPress={() => router.push("/create-habit")}>
              Create Habit
            </ThemedButton>
          </ThemedCard>
        }
        renderItem={({ item, index }) => (
          <Swipeable
            renderLeftActions={() =>
              item.completed_today ? null : (
                <View
                  style={[
                    styles.completeAction,
                    { backgroundColor: theme.colors.success },
                  ]}
                >
                  <Feather
                    name="check-circle"
                    size={22}
                    color={theme.colors.primaryText}
                  />
                  <ThemedText
                    style={[
                      styles.completeActionText,
                      { color: theme.colors.primaryText },
                    ]}
                  >
                    Done
                  </ThemedText>
                </View>
              )
            }
            renderRightActions={() => (
              <View
                style={[
                  styles.deleteAction,
                  { backgroundColor: theme.colors.danger },
                ]}
              >
                <Feather name="trash-2" size={22} color="white" />
                <ThemedText style={styles.swipeText}>Delete</ThemedText>
              </View>
            )}
            onSwipeableOpen={(direction) => {
              if (direction === "left") completeHabit(item.id);
              if (direction === "right") confirmDeleteHabit(item.id);
            }}
          >
            <AnimatedCard index={index}>
              <ThemedCard
                style={[
                  styles.card,
                  item.completed_today && styles.completedCard,
                ]}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: item.completed_today
                          ? theme.colors.success
                          : theme.colors.surfaceAlt,
                        borderColor: item.completed_today
                          ? theme.colors.success
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={item.completed_today ? "check" : "zap"}
                      size={22}
                      color={
                        item.completed_today
                          ? theme.colors.primaryText
                          : theme.colors.primary
                      }
                    />
                  </View>

                  <View style={styles.cardText}>
                    <ThemedText style={styles.name}>{item.name}</ThemedText>

                    {!!item.description && (
                      <ThemedText muted style={styles.description}>
                        {item.description}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <MetaPill
                    theme={theme}
                    icon={
                      <Feather
                        name="trending-up"
                        size={14}
                        color={getStreakColor(item.streak, theme)}
                      />
                    }
                    text={`${item.streak} streak`}
                    highlight={item.streak >= 3}
                  />

                  <MetaPill
                    theme={theme}
                    icon={
                      <MaterialCommunityIcons
                        name="circle-multiple"
                        size={15}
                        color={theme.colors.muted}
                      />
                    }
                    text={`${item.coins_per_completion} coins`}
                  />

                  <MetaPill
                    theme={theme}
                    icon={
                      <Feather
                        name="award"
                        size={14}
                        color={theme.colors.muted}
                      />
                    }
                    text={getNextBonusText(item.streak)}
                  />
                </View>

                <ThemedText
                  style={[
                    styles.status,
                    {
                      color: item.completed_today
                        ? theme.colors.success
                        : theme.colors.primary,
                    },
                  ]}
                >
                  {item.completed_today
                    ? "Completed today"
                    : "Swipe to complete"}
                </ThemedText>

                <AnimatedPressable
                  style={[
                    styles.editButton,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() =>
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
                >
                  <Feather name="edit-3" size={16} color={theme.colors.text} />
                  <ThemedText style={styles.editText}>Edit</ThemedText>
                </AnimatedPressable>
              </ThemedCard>
            </AnimatedCard>
          </Swipeable>
        )}
      />
    </View>
  );
}

function MetaPill({ theme, icon, text, highlight = false }) {
  return (
    <View
      style={[
        styles.metaPill,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {icon}
      <ThemedText
        muted={!highlight}
        style={[
          styles.metaText,
          highlight && { color: theme.colors.success },
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

function getStreakColor(streak = 0, theme) {
  if (streak >= 7) return theme.colors.success;
  if (streak >= 3) return theme.colors.primary;
  return theme.colors.muted;
}

function getNextBonusText(streak = 0) {
  if (streak < 3) return `${3 - streak} days to bonus`;
  if (streak < 7) return `${7 - streak} days to +15`;
  if (streak < 14) return `${14 - streak} days to +30`;
  if (streak < 30) return `${30 - streak} days to +75`;
  return "+75 bonus active";
}

function AnimatedCard({ children, index = 0 }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(index * 55, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(index * 55, withTiming(0, { duration: 260 }));
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
  balanceCard: {
    marginTop: 14,
  },
  balanceLabel: {
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4,
  },
  balanceSub: {
    marginTop: 4,
    fontWeight: "700",
  },
  addButton: {
    marginTop: 14,
    marginBottom: 12,
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
  },
  card: {
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.58,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cardText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
  },
  description: {
    marginTop: 4,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  metaText: {
    fontWeight: "800",
    fontSize: 12,
  },
  status: {
    marginTop: 10,
    fontWeight: "800",
  },
  editButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    borderWidth: 1,
  },
  editText: {
    fontWeight: "900",
  },
  completeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 105,
    borderRadius: 18,
    marginBottom: 12,
    gap: 4,
  },
  completeActionText: {
    fontWeight: "900",
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 105,
    borderRadius: 18,
    marginBottom: 12,
    gap: 4,
  },
  swipeText: {
    color: "white",
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