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
import { colors, radii, shadows, spacing } from "../../lib/theme";

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
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  const claimableQuests = quests.filter((q) => q.claimable).length;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Overview</Text>
      <Text style={styles.title}>Your Progress</Text>

      {/* HERO */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Coin Balance</Text>
        <Text style={styles.heroValue}>{stats.coin_balance}</Text>
        <Text style={styles.heroSub}>Keep earning rewards 🔥</Text>
      </View>

      {/* STATS GRID */}
      <View style={styles.grid}>
        <StatCard label="Habits" value={stats.habits_count} />
        <StatCard label="Pending Tasks" value={stats.tasks_pending} />
        <StatCard label="Current Streak" value={stats.current_max_streak} />
        <StatCard label="Claimable Quests" value={claimableQuests} highlight />
      </View>

      {/* ACTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/create-habit")}
        >
          <Text style={styles.primaryText}>+ Add Habit</Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/create-task")}
        >
          <Text style={styles.primaryText}>+ Add Task</Text>
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

function StatCard({ label, value, highlight }) {
  return (
    <View style={[styles.statCard, highlight && styles.statHighlight]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
    fontWeight: "600",
  },
  eyebrow: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.text,
    marginTop: 4,
  },

  heroCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryBright,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.glow,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  heroValue: {
    color: "white",
    fontSize: 48,
    fontWeight: "900",
    marginTop: 6,
  },
  heroSub: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 6,
    fontWeight: "600",
  },

  grid: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statHighlight: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
  },
  statLabel: {
    marginTop: 4,
    color: colors.textMuted,
    fontWeight: "700",
  },

  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    marginBottom: spacing.md,
  },

  primaryButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radii.lg,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryText: {
    color: colors.textDark,
    fontWeight: "900",
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radii.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
});