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
import { api } from "../../lib/api";

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

    // optimistic update
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t
      )
    );

    setBalance((b) => b + (task.coins_reward || 0));

    try {
      const data = await api.post(`/tasks/${taskId}/complete`);

      setMessage(`+${data.coins_earned} coins earned`);
      setBalance(data.new_balance);
      setTimeout(() => setMessage(null), 2200);
    } catch (error) {
      // rollback
      setTasks((current) =>
        current.map((t) =>
          t.id === taskId ? { ...t, completed: false } : t
        )
      );

      setBalance((b) => Math.max(0, b - (task.coins_reward || 0)));
      Alert.alert("Error", error.message);
    }
  }

  function confirmDeleteTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    Alert.alert(
      "Delete task?",
      `Delete “${task.name}”?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTask(task),
        },
      ]
    );
  }

  async function deleteTask(task) {
    const previous = tasks;

    // optimistic remove
    setTasks((current) => current.filter((t) => t.id !== task.id));

    try {
      await api.delete(`/tasks/${task.id}`);

      setMessage("Task deleted");
      setTimeout(() => setMessage(null), 1800);
    } catch (error) {
      // rollback
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
        <ActivityIndicator size="large" />
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
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Plan</Text>
            <Text style={styles.title}>Tasks</Text>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Coin balance</Text>
              <Text style={styles.balanceValue}>{balance}</Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/create-task")}
            >
              <Text style={styles.addButtonText}>+ Add Task</Text>
            </Pressable>

            {message && <Text style={styles.message}>{message}</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>
              Add your first task.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Swipeable
            leftThreshold={80}
            rightThreshold={80}
            renderLeftActions={() => (
              <View style={styles.completeAction}>
                <Text style={styles.swipeText}>Complete</Text>
              </View>
            )}
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
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>

              {!!item.description && (
                <Text style={styles.description}>
                  {item.description}
                </Text>
              )}

              <Text style={styles.meta}>
                🪙 {item.coins_reward} •{" "}
                {item.due_date || "No due date"}
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
                    },
                  })
                }
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            </View>
          </Swipeable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F6F7FB" },
  listContent: { paddingBottom: 120 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10 },

  header: { marginBottom: 10 },
  eyebrow: { color: "#6B7280", fontWeight: "bold" },
  title: { fontSize: 32, fontWeight: "bold" },

  balanceCard: {
    marginTop: 10,
    backgroundColor: "black",
    padding: 16,
    borderRadius: 16,
  },
  balanceLabel: { color: "#aaa" },
  balanceValue: { color: "white", fontSize: 28, fontWeight: "bold" },

  addButton: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: { color: "white", fontWeight: "bold" },

  message: {
    marginTop: 10,
    backgroundColor: "#DCFCE7",
    padding: 10,
    borderRadius: 10,
  },

  emptyCard: { alignItems: "center", marginTop: 40 },
  emptyTitle: { fontWeight: "bold", fontSize: 18 },
  emptyText: { color: "#666" },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "bold" },
  description: { color: "#666", marginTop: 4 },
  meta: { marginTop: 6, color: "#444" },

  editButton: {
    marginTop: 10,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  editText: { fontWeight: "bold" },

  completeAction: {
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
  },
  deleteAction: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
  },
  swipeText: { color: "white", fontWeight: "bold" },
});