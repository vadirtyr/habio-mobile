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

export default function TasksScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [tasks, setTasks] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [completionCelebration, setCompletionCelebration] = useState(null);
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

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (!!a.completed === !!b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  }, [tasks]);

  const completedToday = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  const openTasks = Math.max(tasks.length - completedToday, 0);

  const progressPercent =
    tasks.length === 0
      ? 0
      : Math.round((completedToday / tasks.length) * 100);

  const orbitComplete = tasks.length > 0 && completedToday === tasks.length;

  async function fetchTasks() {
    if (!token) return;

    setError(null);

    try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance || 0);

      const [data, orbitItems] = await Promise.all([
        api.get("/tasks", token),
        getOrbitItems().catch(() => ({ tasks: [] })),
      ]);
      setTasks(mergeUnique(Array.isArray(data) ? data : [], orbitItems.tasks, "task"));
    } catch (error) {
      setError(error?.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchTasks();
  }

  async function completeTask(taskId) {
    const task = tasks.find((t) => t.id === taskId || t._list_key === taskId);
    if (!task || task.completed || !token) return;

    if (task.is_orbit_item && task.requires_proof) {
      router.push({ pathname: "/orbit-detail", params: { orbitId: task.orbit_id } });
      return;
    }

    const previous = tasks;

    setTasks((current) =>
      current.map((t) => (t._list_key === task._list_key || (!t._list_key && t.id === task.id) ? { ...t, completed: true } : t))
    );

    setBalance((current) => current + (task.coins_reward || 0));

    try {
      if (task.is_orbit_item) {
        await api.completeOrbitTask(task.orbit_id, task.id);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage(`Completed for ${task.orbit_name}`);
        setTimeout(() => setMessage(null), 1800);
        await fetchTasks();
        return;
      }
      const data = await api.post(`/tasks/${task.id}/complete`, {}, token);
      const hasMilestone = (data?.celebrations?.length || 0) > 0;

      enqueueCelebrations(data?.celebrations || []);
      if (data?.new_avatars?.length > 0) {
      const avatar = data.new_avatars[0];

      
     setAvatarUnlock(avatar);
    }

      setXpToast(data.xp_earned || 0);
      setTimeout(() => setXpToast(0), 900);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      setBalance(data.new_balance);
      setMessage(`+${data.coins_earned} coins • +${data.xp_earned || 0} XP`);

      if (!hasMilestone) {
        setCompletionCelebration({
          taskName: task.name,
          coins: data.coins_earned,
          newBalance: data.new_balance,
          nextTaskCreated: !!data.next_task_id,
          newAchievements: data.new_achievements || [],
        });
      }

      setTimeout(() => setMessage(null), 2200);
      setTimeout(() => setCompletionCelebration(null), 2600);

      await fetchTasks();
    } catch (error) {
      setTasks(previous);
      fetchTasks();
      Alert.alert("Could not complete task", error.message);
    }
  }

  async function uncompleteTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.completed || !token) return;
    if (task.is_orbit_item) return;

    const previous = tasks;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, completed: false } : t))
    );

    try {
      const data = await api.post(`/tasks/${taskId}/uncomplete`, {}, token);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

      setBalance(data.new_balance);
      setMessage("Task reopened");
      setTimeout(() => setMessage(null), 1800);
    } catch (error) {
      setTasks(previous);
      Alert.alert("Could not reopen task", error.message);
    }
  }

  function confirmDeleteTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    Alert.alert("Delete task?", `Delete “${task.name}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTask(task),
      },
    ]);
  }

  async function deleteTask(task) {
    if (!token) return;

    const previous = tasks;
    setTasks((current) => current.filter((t) => t.id !== task.id));

    try {
      await api.delete(`/tasks/${task.id}`, token);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

      setMessage("Task deleted");
      setTimeout(() => setMessage(null), 1600);
    } catch (error) {
      setTasks(previous);
      Alert.alert("Could not delete task", error.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      fetchTasks();
      loadPendingCelebrations();
    }, [token])
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <BrandHeader
          eyebrow="OurOrbit"
          title="Tasks"
          subtitle="Loading today’s progress..."
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
          title="Tasks"
          subtitle="Turn momentum into progress."
          compact
        />

        <ErrorState
          title="Tasks unavailable"
          description={error}
          onRetry={fetchTasks}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TaskCompletionCelebration data={completionCelebration} />

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
        data={sortedTasks}
        keyExtractor={(item) => item._list_key || item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <BrandHeader
              eyebrow="OurOrbit"
              title="Tasks"
              subtitle="Turn momentum into progress."
              compact
            />

            <AppCard style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryGlowBlue,
                  {
                    backgroundColor:
                      c.surfaceGlow || `${c.blue || c.primary}16`,
                  },
                ]}
              />

              <View
                style={[
                  styles.summaryGlowCoral,
                  { backgroundColor: `${c.coral || c.primary}10` },
                ]}
              />

              <View style={styles.summaryTop}>
                <View style={styles.summaryCopy}>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
                    Today
                  </Text>

                  <Text style={[styles.summaryTitle, { color: c.text }]}>
                    {completedToday} of {tasks.length} complete
                  </Text>

                  <Text style={[styles.summarySubtitle, { color: c.textSecondary }]}>
                    {openTasks > 0
                      ? `${openTasks} task${
                          openTasks === 1 ? "" : "s"
                        } left to finish`
                      : orbitComplete
                      ? "Today’s orbit is complete."
                      : "Add a task to start earning coins."}
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
                  title="Add Task"
                  style={styles.summaryButton}
                  onPress={() => router.push("/create-task")}
                />
              </View>
            </AppCard>

            <RewardToast message={message} />

            {tasks.length > 0 ? (
              <SectionTitle
                title="Today’s Tasks"
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
              title="No tasks yet"
              description="Add one small task and turn it into a quick win."
              icon={
                <Feather
                  name="check-square"
                  size={38}
                  color={c.blue || c.primary}
                />
              }
            />

            <AppButton
              title="Create Task"
              onPress={() => router.push("/create-task")}
            />
          </AppCard>
        }
        renderItem={({ item, index }) => (
          <Swipeable
            renderLeftActions={() =>
              item.is_orbit_item && item.completed ? null : item.completed ? (
                <SwipeAction
                  color={c.blue || c.primary}
                  icon="rotate-ccw"
                  label="Reopen"
                />
              ) : (
                <SwipeAction
                  color={c.success}
                  icon="check-circle"
                  label="Done"
                />
              )
            }
            renderRightActions={() => item.is_orbit_item ? null : (
              <SwipeAction color={c.danger} icon="trash-2" label="Delete" white />
            )}
            onSwipeableOpen={(direction) => {
              if (direction === "left") {
                item.completed ? uncompleteTask(item.id) : completeTask(item._list_key || item.id);
              }

              if (direction === "right" && !item.is_orbit_item) {
                confirmDeleteTask(item.id);
              }
            }}
          >
            <AnimatedCard index={index}>
              <TaskCard
                item={item}
                onToggle={() =>
                  item.completed ? uncompleteTask(item.id) : completeTask(item._list_key || item.id)
                }
                onEdit={item.is_orbit_item ? null : () =>
                  router.push({
                    pathname: "/edit-task",
                    params: {
                      id: item.id,
                      name: item.name,
                      description: item.description || "",
                      difficulty: item.difficulty || "medium",
                      custom_coins: item.custom_coins || "",
                      due_date: item.due_date || "",
                        recurrence: item.recurrence || "none",
                        recurrence_type: item.recurrence || "none",
                        interval: String(item.interval || 1),
                        days_of_week: JSON.stringify(item.days_of_week || []),
                        day_of_month: String(item.day_of_month || ""),
                        annual_month: String(item.annual_month || ""),
                        annual_day: String(item.annual_day || ""),
                        show_days_before: String(item.show_days_before || 0),
                    },
                  })
                }
              />
            </AnimatedCard>
          </Swipeable>
        )}
      />
    </View>
  );
}

function TaskCard({ item, onToggle, onEdit }) {
  const { theme } = useTheme();
  const c = theme.colors;

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

  function handleToggle() {
    if (!item.completed) {
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
    }

    onToggle();
  }

  return (
    <Animated.View
      style={[
        cardAnimatedStyle,
        item.completed && styles.completedTaskWrap,
      ]}
    >
      <AppCard
        style={[
          styles.card,
          item.completed && {
            borderColor: `${c.success}40`,
            backgroundColor: `${c.success}08`,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <AnimatedPressable
            style={[
              styles.checkCircle,
              {
                backgroundColor: item.completed ? c.success : c.surfaceAlt,
                borderColor: item.completed ? c.success : c.border,
              },
            ]}
            onPress={handleToggle}
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
              name={item.completed ? "check" : "square"}
              size={22}
              color={item.completed ? "#FFFFFF" : c.textMuted || c.muted}
            />
          </AnimatedPressable>

          <View style={styles.cardCopy}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.name,
                  { color: item.completed ? c.success : c.text },
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
            {item.is_orbit_item && <Text style={[styles.orbitLabel, { color: c.primary }]}>Orbit: {item.orbit_name}</Text>}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <CompactPill icon="circle" text={`${item.coins_reward || 0} coins`} />

          <CompactPill
            icon="calendar"
            text={formatDueDate(item.due_date)}
            highlight={isDueSoon(item.due_date) && !item.completed}
            color={c.warning}
          />

          <CompactPill
            icon={item.completed ? "check-circle" : "clock"}
            text={item.completed ? "Complete" : "Open"}
            highlight={item.completed}
            color={item.completed ? c.success : c.blue || c.primary}
          />

          {item.recurrence && item.recurrence !== "none" && (
            <CompactPill icon="repeat" text={item.recurrence} />
          )}
        </View>

        <View style={styles.statusRow}>
          <Text
            style={[
              styles.status,
              {
                color: item.completed ? c.success : c.textMuted || c.muted,
              },
            ]}
          >
            {item.completed ? "Completed" : "Tap or swipe to complete"}
          </Text>

          <Text style={[styles.coinText, { color: c.textSecondary }]}>
            +{item.coins_reward || 0}
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
          {
            color: highlight ? pillColor : c.textSecondary,
          },
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

function formatDueDate(value) {
  if (!value) return "No due date";
  return value;
}

function isDueSoon(value) {
  if (!value) return false;

  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();

  const diffMs = due.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(diffMs / 86400000);

  return diffDays <= 1;
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

function TaskCompletionCelebration({ data }) {
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
            <Feather name="check" size={38} color="#FFFFFF" />
          </View>

          <Text style={[styles.celebrationEyebrow, { color: c.success }]}>
            Task Complete
          </Text>

          <Text style={[styles.celebrationTitle, { color: c.text }]}>
            +{data.coins} coins
          </Text>

          <Text style={[styles.celebrationName, { color: c.textSecondary }]}>
            {data.taskName}
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
              New balance: {data.newBalance} coins
            </Text>

            {data.nextTaskCreated ? (
              <Text style={[styles.bonusLine, { color: c.textSecondary }]}>
                Recurring task created
              </Text>
            ) : null}

            {data.newAchievements?.length > 0 ? (
              <Text style={[styles.bonusTotal, { color: c.warning }]}>
                Achievement progress unlocked
              </Text>
            ) : null}
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

  summaryCard: {
    overflow: "hidden",
  },

  summaryGlowBlue: {
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

  sectionHint: {
    ...typography.caption,
  },

  emptyCard: {
    marginTop: spacing.xl,
    alignItems: "center",
  },

  completedTaskWrap: {
    opacity: 0.82,
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
    textTransform: "capitalize",
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
