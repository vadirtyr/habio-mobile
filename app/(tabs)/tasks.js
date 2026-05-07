import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
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
import { BrandHeader } from "../../components/BrandMark";
import { api } from "../../lib/api";
import { colors, radii, shadows, spacing } from "../../lib/theme";

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(0);

  async function fetchTasks() {
    try {
      const statsData = await api.get("/stats");
      setBalance(statsData.coin_balance);

      const data = await api.get("/tasks");
      setTasks(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed) return;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );

    setBalance((b) => b + (task.coins_reward || 0));

    try {
      const data = await api.post(`/tasks/${taskId}/complete`);
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
    const previous = tasks;
    setTasks((current) => current.filter((t) => t.id !== task.id));

    try {
      await api.delete(`/tasks/${task.id}`);
      setMessage("Task deleted");
      setTimeout(() => setMessage(null), 1600);
    } catch (error) {
      setTasks(previous);
      Alert.alert("Error", error.message);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
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

            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/create-task")}
            >
              <Text style={styles.addButtonText}>+ Add Task</Text>
            </Pressable>

            <RewardToast message={message} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>Start planning your day.</Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/create-task")}
            >
              <Text style={styles.emptyButtonText}>Create Task</Text>
            </Pressable>
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
                    <Text style={styles.swipeText}>Done</Text>
                  </View>
                )
              }
              renderRightActions={() => (
                <View style={styles.deleteAction}>
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
                  <Text style={styles.name}>{item.name}</Text>

                  {!!item.description && (
                    <Text style={styles.description}>{item.description}</Text>
                  )}

                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>🪙 {item.coins_reward}</Text>

                    <Text style={[styles.meta, isUrgent && styles.urgentText]}>
                      {item.due_date || "No due date"}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.status,
                      item.completed && styles.statusDone,
                    ]}
                  >
                    {item.completed ? "Completed" : "Swipe to complete"}
                  </Text>

                  <Pressable
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
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
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
    fontWeight: "800",
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
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
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
  },
  completedCard: {
    opacity: 0.5,
  },
  urgentCard: {
    borderColor: colors.danger || "#EF4444",
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
    justifyContent: "space-between",
    marginTop: 8,
    gap: 10,
  },
  meta: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  urgentText: {
    color: colors.danger || "#EF4444",
  },
  status: {
    marginTop: 10,
    color: colors.primaryBright,
    fontWeight: "700",
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
  },
  editText: {
    color: colors.text,
    fontWeight: "900",
  },
  completeAction: {
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    borderRadius: radii.lg,
    marginBottom: 12,
  },
  deleteAction: {
    backgroundColor: colors.danger || "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    borderRadius: radii.lg,
    marginBottom: 12,
  },
  swipeText: {
    color: "white",
    fontWeight: "900",
  },
});