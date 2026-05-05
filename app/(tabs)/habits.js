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

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(0);

  async function fetchHabits() {
    try {
      const statsData = await api.get("/stats");
      setBalance(statsData.coin_balance);

      const data = await api.get("/habits");
      setHabits(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeHabit(habitId) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || habit.completed_today) return;

    setHabits((current) =>
      current.map((h) =>
        h.id === habitId
          ? { ...h, completed_today: true, streak: h.streak + 1 }
          : h
      )
    );

    setBalance((b) => b + (habit.coins_per_completion || 0));

    try {
      const data = await api.post(`/habits/${habitId}/complete`);
      setMessage(`+${data.coins_earned} coins earned`);
      setBalance(data.new_balance);
      setTimeout(() => setMessage(null), 2200);
    } catch (error) {
      setHabits((current) =>
        current.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completed_today: false,
                streak: Math.max(0, h.streak - 1),
              }
            : h
        )
      );

      setBalance((b) => Math.max(0, b - (habit.coins_per_completion || 0)));
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
    const previous = habits;

    setHabits((current) => current.filter((h) => h.id !== habit.id));

    try {
      await api.delete(`/habits/${habit.id}`);
      setMessage("Habit deleted");
      setTimeout(() => setMessage(null), 1800);
    } catch (error) {
      setHabits(previous);
      Alert.alert("Error", error.message);
    }
  }

  async function handleLogout() {
    await api.logout();
  }

  useEffect(() => {
    fetchHabits();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHabits();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading habits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchHabits}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.eyebrow}>Today</Text>
                <Text style={styles.title}>Habits</Text>
              </View>

              <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Coin balance</Text>
              <Text style={styles.balanceValue}>{balance}</Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/create-habit")}
            >
              <Text style={styles.addButtonText}>+ Add Habit</Text>
            </Pressable>

            {message && <Text style={styles.message}>{message}</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>
              Add your first habit and start earning coins.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/create-habit")}
            >
              <Text style={styles.emptyButtonText}>Create Habit</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Swipeable
            leftThreshold={80}
            rightThreshold={80}
            overshootLeft={false}
            overshootRight={false}
            renderLeftActions={() =>
              item.completed_today ? null : (
                <View style={styles.completeAction}>
                  <Text style={styles.swipeText}>Complete</Text>
                </View>
              )
            }
            renderRightActions={() => (
              <View style={styles.deleteAction}>
                <Text style={styles.swipeText}>Delete</Text>
              </View>
            )}
            onSwipeableOpen={(direction) => {
              if (direction === "left") completeHabit(item.id);
              if (direction === "right") confirmDeleteHabit(item.id);
            }}
          >
            <View style={[styles.card, item.completed_today && styles.completedCard]}>
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>🔥</Text>
                </View>

                <View style={styles.cardText}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.description && (
                    <Text style={styles.description}>{item.description}</Text>
                  )}
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaPill}>🔥 {item.streak} streak</Text>
                <Text style={styles.metaPill}>
                  🪙 {item.coins_per_completion} coins
                </Text>
                <Text
                  style={[
                    styles.statusPill,
                    item.completed_today && styles.statusDone,
                  ]}
                >
                  {item.completed_today
                    ? "Done today"
                    : "Swipe right to complete • left to delete"}
                </Text>
              </View>

              <Pressable
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
  container: {
    flex: 1,
    paddingTop: 22,
    paddingHorizontal: 20,
    backgroundColor: "#F6F7FB",
  },
  listContent: {
    paddingBottom: 110,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F6F7FB",
  },
  loadingText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  header: {
    marginBottom: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#111827",
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  logoutText: {
    color: "#B91C1C",
    fontWeight: "800",
  },
  balanceCard: {
    marginTop: 18,
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 18,
  },
  balanceLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  balanceValue: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },
  addButton: {
    marginTop: 14,
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  message: {
    marginTop: 12,
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: 12,
    borderRadius: 14,
    textAlign: "center",
    fontWeight: "900",
  },
  emptyCard: {
    marginTop: 16,
    backgroundColor: "white",
    padding: 22,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "900",
  },
  completeAction: {
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    width: 118,
    borderRadius: 22,
    marginBottom: 14,
  },
  deleteAction: {
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    width: 118,
    borderRadius: 22,
    marginBottom: 14,
  },
  swipeText: {
    color: "white",
    fontWeight: "900",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  completedCard: {
    opacity: 0.62,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 22,
  },
  cardText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  description: {
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  metaPill: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "800",
    fontSize: 12,
  },
  statusPill: {
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "900",
    fontSize: 12,
  },
  statusDone: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },
  editButton: {
    marginTop: 12,
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  editText: {
    color: "#111827",
    fontWeight: "900",
  },
});