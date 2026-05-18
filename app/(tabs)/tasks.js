import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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

export default function TasksScreen() {
  const { token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [completionCelebration, setCompletionCelebration] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [xpToast, setXpToast] = useState(0);
  const completedToday = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  const openTasks = Math.max(tasks.length - completedToday, 0);

  const progressPercent =
    tasks.length === 0
      ? 0
      : Math.round((completedToday / tasks.length) * 100);

  async function fetchTasks() {
    if (!token) return;

    try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance || 0);

      const data = await api.get("/tasks", token);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed || !token) return;

    const previous = tasks;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );

    setBalance((current) => current + (task.coins_reward || 0));

    try {
      const data = await api.post(`/tasks/${taskId}/complete`, {}, token);
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

      setBalance(data.new_balance);
      setMessage(
  `+${data.coins_earned} coins • +${data.xp_earned || 0} XP`
);

      setCompletionCelebration({
        taskName: task.name,
        coins: data.coins_earned,
        newBalance: data.new_balance,
        nextTaskCreated: !!data.next_task_id,
        newAchievements: data.new_achievements || [],
      });

      setTimeout(() => setMessage(null), 2200);
      setTimeout(() => setCompletionCelebration(null), 2600);

      await fetchTasks();
    } catch (error) {
      setTasks(previous);
      fetchTasks();
      Alert.alert("Error", error.message);
    }
  }

  async function uncompleteTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.completed || !token) return;

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
      Alert.alert("Error", error.message);
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
      Alert.alert("Error", error.message);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [token])
  );

  if (loading) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Tasks"
        subtitle="Loading today’s progress..."
      />

      <SkeletonCard lines={2} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard compact />
    </View>
  );
}

  return (
    <View style={styles.container}>
      <TaskCompletionCelebration data={completionCelebration} />
      <LevelUpModal
        visible={!!levelUp}
        oldLevel={levelUp?.oldLevel}
         newLevel={levelUp?.newLevel}
        onClose={() => setLevelUp(null)}
        />
        <XPGainToast xp={xpToast} />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchTasks}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title="Tasks"
              subtitle="Turn momentum into progress."
            />

            <AppCard style={styles.summaryCard}>
              <View style={styles.summaryGlowBlue} />
              <View style={styles.summaryGlowCoral} />

              <View style={styles.summaryTop}>
                <View style={styles.summaryCopy}>
                  <Text style={styles.summaryLabel}>Today</Text>

                  <Text style={styles.summaryTitle}>
                    {completedToday} of {tasks.length} complete
                  </Text>

                  <Text style={styles.summarySubtitle}>
                    {openTasks > 0
                      ? `${openTasks} task${
                          openTasks === 1 ? "" : "s"
                        } left to finish`
                      : tasks.length > 0
                      ? "All tasks complete. Nice work."
                      : "Add a task to start earning coins."}
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
                action={<Text style={styles.sectionHint}>Swipe to manage</Text>}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <AppCard style={styles.emptyCard}>
            <EmptyState
              title="No tasks yet"
              description="Add one small task and turn it into a quick win."
              icon={<Feather name="check-square" size={38} color={colors.blue} />}
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
              item.completed ? (
                <SwipeAction
                  color={colors.blue}
                  icon="rotate-ccw"
                  label="Reopen"
                />
              ) : (
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
              if (direction === "left") {
                item.completed ? uncompleteTask(item.id) : completeTask(item.id);
              }

              if (direction === "right") {
                confirmDeleteTask(item.id);
              }
            }}
          >
            <AnimatedCard index={index}>
              <TaskCard
                item={item}
                onToggle={() =>
                  item.completed ? uncompleteTask(item.id) : completeTask(item.id)
                }
                onEdit={() =>
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
  return (
    <AppCard
      style={[
        styles.card,
        item.completed && styles.completedCard,
        item.completed && { borderColor: colors.success },
      ]}
    >
      <View style={styles.cardTop}>
        <AnimatedPressable
          style={[
            styles.checkCircle,
            {
              backgroundColor: item.completed ? colors.success : colors.surfaceAlt,
              borderColor: item.completed ? colors.success : colors.border,
            },
          ]}
          onPress={onToggle}
        >
          <Feather
            name={item.completed ? "check" : "square"}
            size={22}
            color={item.completed ? colors.white : colors.textMuted}
          />
        </AnimatedPressable>

        <View style={styles.cardCopy}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, item.completed && styles.completedText]}>
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
        <CompactPill icon="circle" text={`${item.coins_reward || 0} coins`} />

        <CompactPill
          icon="calendar"
          text={formatDueDate(item.due_date)}
          highlight={isDueSoon(item.due_date) && !item.completed}
          color={colors.warning}
        />

        <CompactPill
          icon={item.completed ? "check-circle" : "clock"}
          text={item.completed ? "Complete" : "Open"}
          highlight={item.completed}
          color={item.completed ? colors.success : colors.blue}
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
              color: item.completed ? colors.success : colors.textMuted,
            },
          ]}
        >
          {item.completed ? "Completed" : "Tap or swipe to complete"}
        </Text>

        <Text style={styles.coinText}>+{item.coins_reward || 0}</Text>
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
          {
            color: highlight ? pillColor : colors.textSecondary,
          },
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
          {
            color: white ? colors.white : colors.primary,
          },
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

  const diffMs =
    due.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);

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
  if (!message) return null;

  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

function TaskCompletionCelebration({ data }) {
  if (!data) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.celebrationOverlay}>
        <View style={styles.celebrationCard}>
          <View style={styles.celebrationIconCircle}>
            <Feather name="check" size={38} color={colors.white} />
          </View>

          <Text style={styles.celebrationEyebrow}>Task Complete</Text>

          <Text style={styles.celebrationTitle}>+{data.coins} coins</Text>

          <Text style={styles.celebrationName}>{data.taskName}</Text>

          <View style={styles.bonusBreakdown}>
            <Text style={styles.bonusLine}>
              New balance: {data.newBalance} coins
            </Text>

            {data.nextTaskCreated ? (
              <Text style={styles.bonusLine}>Recurring task created</Text>
            ) : null}

            {data.newAchievements?.length > 0 ? (
              <Text style={styles.bonusTotal}>
                Achievement progress unlocked
              </Text>
            ) : null}
            
          </View>
        </View>
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
    backgroundColor: `${colors.blue}16`,
  },

  summaryGlowCoral: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
    backgroundColor: `${colors.coral}10`,
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
    color: colors.warning,
    marginTop: spacing.xs,
  },
});