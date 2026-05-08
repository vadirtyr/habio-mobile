import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

export default function TasksScreen() {
  const { token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(0);

  async function fetchTasks() {
    if (!token) return;

    try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance);

      const data = await api.get("/tasks", token);
      setTasks(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed || !token) return;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );

    setBalance((b) => b + (task.coins_reward || 0));

    try {
      const data = await api.post(`/tasks/${taskId}/complete`, {}, token);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      setMessage(`+${data.coins_earned} coins`);
      setBalance(data.new_balance);
      setTimeout(() => setMessage(null), 1800);
    } catch (error) {
      fetchTasks();
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
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchTasks}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Plan" title="Your Tasks" />

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Coins</Text>
              <Text style={styles.balanceValue}>{balance}</Text>
            </View>

            <AnimatedPressable
              style={styles.addButton}
              onPress={() => router.push("/create-task")}
            >
              <Feather name="plus-circle" size={18} color={colors.textDark} />
              <Text style={styles.addButtonText}>Add Task</Text>
            </AnimatedPressable>

            <RewardToast message={message} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Feather name="check-square" size={34} color={colors.accent} />
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>Start planning your day.</Text>

            <AnimatedPressable
              style={styles.emptyButton}
              onPress={() => router.push("/create-task")}
            >
              <Text style={styles.emptyButtonText}>Create Task</Text>
            </AnimatedPressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const isUrgent =
            item.due_date &&
            !item.completed &&
            new Date(item.due_date) < new Date();

          return (
            <Swipeable
              renderLeftActions={() =>
                item.completed ? null : (
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
                if (direction === "left") completeTask(item.id);
                if (direction === "right") confirmDeleteTask(item.id);
              }}
            >
              <AnimatedCard index={index}>
                <View
                  style={[
                    styles.card,
                    item.completed && styles.completedCard,
                    isUrgent && styles.urgentCard,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.iconCircle,
                        item.completed && styles.iconCircleDone,
                        isUrgent && styles.iconCircleUrgent,
                      ]}
                    >
                      <Feather
                        name={
                          item.completed
                            ? "check"
                            : isUrgent
                            ? "alert-circle"
                            : "check-square"
                        }
                        size={22}
                        color={
                          item.completed
                            ? colors.textDark
                            : isUrgent
                            ? colors.danger || "#EF4444"
                            : colors.primaryBright
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
                      <MaterialCommunityIcons
                        name="gold"
                        size={15}
                        color={colors.textMuted}
                      />
                      <Text style={styles.metaText}>
                        {item.coins_reward} coins
                      </Text>
                    </View>

                    <View style={styles.metaPill}>
                      <Feather
                        name="calendar"
                        size={14}
                        color={
                          isUrgent
                            ? colors.danger || "#EF4444"
                            : colors.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.metaText,
                          isUrgent && styles.urgentText,
                        ]}
                      >
                        {item.due_date || "No due date"}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.status,
                      item.completed && styles.statusDone,
                      isUrgent && styles.statusUrgent,
                    ]}
                  >
                    {item.completed
                      ? "Completed"
                      : isUrgent
                      ? "Past due"
                      : "Swipe to complete"}
                  </Text>

                  <AnimatedPressable
                    style={styles.editButton}
                    onPress={() =>
                      router.push({
                        pathname: "/edit-task",
                        params: {
                          id: item.id,
                          name: item.name,
                          description: item.description || "",
                          due_date: item.due_date || "",
                          difficulty: item.difficulty || "medium",
                          custom_coins: item.custom_coins || "",
                          recurrence: item.recurrence || "none",
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
          );
        }}
      />
    </View>
  );
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
  urgentCard: {
    borderColor: colors.danger || "#EF4444",
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
  iconCircleUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    borderColor: colors.danger || "#EF4444",
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
  urgentText: {
    color: colors.danger || "#EF4444",
  },
  status: {
    marginTop: 10,
    color: colors.primaryBright,
    fontWeight: "800",
  },
  statusDone: {
    color: colors.accent,
  },
  statusUrgent: {
    color: colors.danger || "#EF4444",
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
});