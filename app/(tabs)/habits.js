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
  Text,
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
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors, radii, shadows, spacing } from "../../lib/theme";

export default function HabitsScreen() {
  const { token } = useAuth();

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
      setHabits(data);
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
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading habits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StreakCelebration data={streakCelebration} />

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchHabits}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Today" title="Your Habits" />

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Coins</Text>
              <Text style={styles.balanceValue}>{balance}</Text>
              <Text style={styles.balanceSub}>
                Streak bonuses start at 3 days.
              </Text>
            </View>

            <AnimatedPressable
              style={styles.addButton}
              onPress={() => router.push("/create-habit")}
            >
              <Feather name="plus-circle" size={18} color={colors.textDark} />
              <Text style={styles.addButtonText}>Add Habit</Text>
            </AnimatedPressable>

            <RewardToast message={message} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Feather name="target" size={34} color={colors.accent} />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>
              Start building momentum today.
            </Text>
            <AnimatedPressable
              style={styles.emptyButton}
              onPress={() => router.push("/create-habit")}
            >
              <Text style={styles.emptyButtonText}>Create Habit</Text>
            </AnimatedPressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <Swipeable
            renderLeftActions={() =>
              item.completed_today ? null : (
                <View style={styles.completeAction}>
                  <Feather
                    name="check-circle"
                    size={22}
                    color={colors.textDark}
                  />
                  <Text style={styles.completeActionText}>Done</Text>
                </View>
              )
            }
            renderRightActions={() => (
              <View style={styles.deleteAction}>
                <Feather name="trash-2" size={22} color="white" />
                <Text style={styles.swipeText}>Delete</Text>
              </View>
            )}
            onSwipeableOpen={(direction) => {
              if (direction === "left") completeHabit(item.id);
              if (direction === "right") confirmDeleteHabit(item.id);
            }}
          >
            <AnimatedCard index={index}>
              <View
                style={[
                  styles.card,
                  item.completed_today && styles.completedCard,
                ]}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.iconCircle,
                      item.completed_today && styles.iconCircleDone,
                    ]}
                  >
                    <Feather
                      name={item.completed_today ? "check" : "zap"}
                      size={22}
                      color={
                        item.completed_today
                          ? colors.textDark
                          : colors.accent
                      }
                    />
                  </View>

                  <View style={styles.cardText}>
                    <Text style={styles.name}>{item.name}</Text>

                    {!!item.description && (
                      <Text style={styles.description}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Feather
                      name="trending-up"
                      size={14}
                      color={getStreakColor(item.streak)}
                    />
                    <Text
                      style={[
                        styles.metaText,
                        item.streak >= 3 && styles.streakMetaText,
                      ]}
                    >
                      {item.streak} streak
                    </Text>
                  </View>

                  <View style={styles.metaPill}>
                    <MaterialCommunityIcons
                      name="gold"
                      size={15}
                      color={colors.textMuted}
                    />
                    <Text style={styles.metaText}>
                      {item.coins_per_completion} coins
                    </Text>
                  </View>

                  <View style={styles.metaPill}>
                    <Feather
                      name="award"
                      size={14}
                      color={colors.textMuted}
                    />
                    <Text style={styles.metaText}>
                      {getNextBonusText(item.streak)}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.status,
                    item.completed_today && styles.statusDone,
                  ]}
                >
                  {item.completed_today
                    ? "Completed today"
                    : "Swipe to complete"}
                </Text>

                <AnimatedPressable
                  style={styles.editButton}
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
                  <Feather name="edit-3" size={16} color={colors.text} />
                  <Text style={styles.editText}>Edit</Text>
                </AnimatedPressable>
              </View>
            </AnimatedCard>
          </Swipeable>
        )}
      />
    </View>
  );
}

function getStreakColor(streak = 0) {
  if (streak >= 7) return colors.accent;
  if (streak >= 3) return colors.primaryBright;
  return colors.textMuted;
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
            <Feather name="zap" size={38} color={colors.textDark} />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  listContent: {
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 10,
  },
  balanceCard: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryBright,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.glow,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
  },
  balanceValue: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4,
  },
  balanceSub: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontWeight: "700",
  },
  addButton: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  addButtonText: {
    color: colors.textDark,
    fontWeight: "900",
  },
  toast: {
    marginTop: 12,
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderColor: colors.accent,
    borderWidth: 1,
    padding: 12,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  toastText: {
    color: colors.accent,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radii.md,
  },
  emptyButtonText: {
    color: colors.textDark,
    fontWeight: "900",
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
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
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircleDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  cardText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  description: {
    color: colors.textMuted,
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
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: colors.textMuted,
    fontWeight: "800",
    fontSize: 12,
  },
  streakMetaText: {
    color: colors.accent,
  },
  status: {
    marginTop: 10,
    color: colors.primaryBright,
    fontWeight: "800",
  },
  statusDone: {
    color: colors.accent,
  },
  editButton: {
    marginTop: 12,
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  editText: {
    color: colors.text,
    fontWeight: "900",
  },
  completeAction: {
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    width: 105,
    borderRadius: radii.lg,
    marginBottom: 12,
    gap: 4,
  },
  completeActionText: {
    color: colors.textDark,
    fontWeight: "900",
  },
  deleteAction: {
    backgroundColor: colors.danger || "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 105,
    borderRadius: radii.lg,
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
    padding: spacing.lg,
  },
  celebrationCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    ...shadows.glow,
  },
  celebrationIconCircle: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  celebrationEyebrow: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  celebrationTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  celebrationName: {
    color: colors.textMuted,
    fontWeight: "800",
    marginTop: spacing.xs,
    textAlign: "center",
  },
  bonusBreakdown: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  bonusLine: {
    color: colors.textMuted,
    fontWeight: "800",
    marginBottom: 6,
  },
  bonusTotal: {
    color: colors.accent,
    fontWeight: "900",
    fontSize: 18,
    marginTop: 4,
  },
});