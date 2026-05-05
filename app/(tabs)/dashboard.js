import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { api } from "../../lib/api";

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchDashboard() {
    try {
      const statsData = await api.get("/stats");
      const questsData = await api.get("/quests");

      setStats(statsData);
      setQuests(questsData.items || []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  if (loading || !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const claimableQuests = quests.filter((q) => q.claimable).length;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Overview</Text>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Coin balance</Text>
        <Text style={styles.heroValue}>{stats.coin_balance}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.habits_count}</Text>
          <Text style={styles.statLabel}>Habits</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.tasks_pending}</Text>
          <Text style={styles.statLabel}>Pending tasks</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.current_max_streak}</Text>
          <Text style={styles.statLabel}>Current streak</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{claimableQuests}</Text>
          <Text style={styles.statLabel}>Claimable quests</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>

        <Pressable
          style={styles.actionButton}
          onPress={() => router.push("/create-habit")}
        >
          <Text style={styles.actionText}>+ Add Habit</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => router.push("/create-task")}
        >
          <Text style={styles.actionText}>+ Add Task</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/(tabs)/quests")}
        >
          <Text style={styles.secondaryText}>View Quests</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  container: {
    padding: 20,
    paddingTop: 34,
    paddingBottom: 120,
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
  eyebrow: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#111827",
    marginTop: 2,
  },
  heroCard: {
    marginTop: 18,
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 22,
  },
  heroLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  heroValue: {
    color: "white",
    fontSize: 46,
    fontWeight: "900",
    marginTop: 6,
  },
  grid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
  },
  statLabel: {
    marginTop: 4,
    color: "#6B7280",
    fontWeight: "700",
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 16,
  },
});