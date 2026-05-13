import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

export default function TasksScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();

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
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <ThemedText muted style={styles.loadingText}>
          Loading tasks...
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchTasks}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Plan" title="Your Tasks" />

            <ThemedCard style={styles.balanceCard}>
              <ThemedText muted style={styles.balanceLabel}>
                Coins
              </ThemedText>
              <ThemedText style={styles.balanceValue}>{balance}</ThemedText>
            </ThemedCard>

            <ThemedButton
              style={styles.addButton}
              onPress={() => router.push("/create-task")}
            >
              Add Task
            </ThemedButton>

            <RewardToast message={message} theme={theme} />
          </View>
        }
        ListEmptyComponent={
          <ThemedCard style={styles.emptyCard}>
            <Feather name="check-square" size={34} color={theme.colors.primary} />

            <ThemedText variant="section" style={styles.emptyTitle}>
              No tasks yet
            </ThemedText>

            <ThemedText muted style={styles.emptyText}>
              Start planning your day.
            </ThemedText>

            <ThemedButton onPress={() => router.push("/create-task")}>
              Create Task
            </ThemedButton>
          </ThemedCard>
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
                if (direction === "left") completeTask(item.id);
                if (direction === "right") confirmDeleteTask(item.id);
              }}
            >
              <AnimatedCard index={index}>
                <ThemedCard
                  style={[
                    styles.card,
                    item.completed && styles.completedCard,
                    isUrgent && {
                      borderColor: theme.colors.danger,
                    },
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: item.completed
                            ? theme.colors.success
                            : isUrgent
                            ? theme.colors.surfaceAlt
                            : theme.colors.surfaceAlt,
                          borderColor: item.completed
                            ? theme.colors.success
                            : isUrgent
                            ? theme.colors.danger
                            : theme.colors.border,
                        },
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
                            ? theme.colors.primaryText
                            : isUrgent
                            ? theme.colors.danger
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
                        <MaterialCommunityIcons
                          name="circle-multiple"
                          size={15}
                          color={theme.colors.muted}
                        />
                      }
                      text={`${item.coins_reward} coins`}
                    />

                    <MetaPill
                      theme={theme}
                      icon={
                        <Feather
                          name="calendar"
                          size={14}
                          color={
                            isUrgent ? theme.colors.danger : theme.colors.muted
                          }
                        />
                      }
                      text={item.due_date || "No due date"}
                      danger={isUrgent}
                    />
                  </View>

                  <ThemedText
                    style={[
                      styles.status,
                      {
                        color: item.completed
                          ? theme.colors.success
                          : isUrgent
                          ? theme.colors.danger
                          : theme.colors.primary,
                      },
                    ]}
                  >
                    {item.completed
                      ? "Completed"
                      : isUrgent
                      ? "Past due"
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
                    <Feather name="edit-3" size={16} color={theme.colors.text} />
                    <ThemedText style={styles.editText}>Edit</ThemedText>
                  </AnimatedPressable>
                </ThemedCard>
              </AnimatedCard>
            </Swipeable>
          );
        }}
      />
    </View>
  );
}

function MetaPill({ theme, icon, text, danger = false }) {
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
        muted={!danger}
        style={[styles.metaText, danger && { color: theme.colors.danger }]}
      >
        {text}
      </ThemedText>
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
});