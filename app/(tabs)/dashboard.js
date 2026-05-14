import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { BrandHeader } from "../../components/BrandMark";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import ThemedScreen from "../../components/ThemedScreen";
import ThemedText from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";

export default function DashboardScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    coin_balance: 0,
    completed_today: 0,
    streak_days: 0,
    total_habits: 0,
    total_tasks: 0,
  });

  const [todayHabits, setTodayHabits] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);

  const [achievementSummary, setAchievementSummary] = useState({
    earnedCount: 0,
    total: 0,
    nextUnlock: null,
  });

  const totalTodayItems = todayHabits.length + todayTasks.length;
  const dailyGoal = Math.max(totalTodayItems, stats.completed_today, 1);
  const todayPercent = Math.min(
    100,
    Math.round((stats.completed_today / dailyGoal) * 100)
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  async function loadDashboard() {
    if (!token) return;

    try {
      const [statsData, achievementData, habitsData, tasksData] =
        await Promise.allSettled([
          api.get("/stats", token),
          api.get("/achievements", token),
          api.get("/habits", token),
          api.get("/tasks", token),
        ]);

      if (statsData.status === "fulfilled") {
        const data = statsData.value || {};

        setStats({
          coin_balance: data.coin_balance || 0,
          completed_today: data.completed_today || 0,
          streak_days: data.streak_days || data.current_max_streak || 0,
          total_habits: data.total_habits || data.habits_count || 0,
          total_tasks: data.total_tasks || data.tasks_total || 0,
        });
      }

      if (achievementData.status === "fulfilled") {
        const data = achievementData.value || {};

        setAchievementSummary({
          earnedCount: data.earned_count || 0,
          total: data.total || 0,
          nextUnlock: data.next_unlock || null,
        });
      }

      if (habitsData.status === "fulfilled") {
        const habits = normalizeList(habitsData.value)
          .filter((item) => !item.completed_today)
          .slice(0, 3);

        setTodayHabits(habits);
      }

      if (tasksData.status === "fulfilled") {
        const tasks = normalizeList(tasksData.value)
          .filter((item) => !item.completed && !item.done)
          .slice(0, 3);

        setTodayTasks(tasks);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [token])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ThemedScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <BrandHeader eyebrow="Today" title="Dashboard" />

        <ThemedCard style={styles.heroCard}>
          <View
            style={[
              styles.heroGlow,
              { backgroundColor: `${theme.colors.primary}18` },
            ]}
          />

          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <ThemedText muted style={styles.heroGreeting}>
                {greeting}
              </ThemedText>

              <ThemedText style={styles.heroTitle}>
                Keep your streak alive.
              </ThemedText>

              <ThemedText muted style={styles.heroSubtitle}>
                {stats.completed_today} completed today
              </ThemedText>
            </View>

            <View
              style={[
                styles.streakBadge,
                { backgroundColor: theme.colors.surfaceAlt },
              ]}
            >
              <MaterialCommunityIcons
                name="fire"
                size={28}
                color={theme.colors.primary}
              />

              <ThemedText style={styles.streakNumber}>
                {stats.streak_days}
              </ThemedText>

              <ThemedText muted style={styles.streakLabel}>
                days
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.progressOuter,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}
          >
            <View
              style={[
                styles.progressInner,
                {
                  width: `${todayPercent}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.progressFooter}>
            <ThemedText muted style={styles.progressText}>
              Daily progress
            </ThemedText>

            <ThemedText style={styles.progressPercent}>
              {todayPercent}%
            </ThemedText>
          </View>
        </ThemedCard>

        <View style={styles.sectionHeader}>
          <ThemedText variant="section">Today Focus</ThemedText>
        </View>

        <ThemedCard style={styles.todayCard}>
          {totalTodayItems > 0 ? (
            <>
              <ThemedText style={styles.todayTitle}>
                You have {totalTodayItems} item
                {totalTodayItems === 1 ? "" : "s"} to move forward.
              </ThemedText>

              <View style={styles.previewList}>
                {todayHabits.map((habit) => (
                  <PreviewItem
                    key={`habit-${habit.id || habit._id || habit.name}`}
                    icon="repeat"
                    label={habit.name || habit.title || "Habit"}
                    theme={theme}
                  />
                ))}

                {todayTasks.map((task) => (
                  <PreviewItem
                    key={`task-${
                      task.id || task._id || task.name || task.title
                    }`}
                    icon="checkbox-marked-circle-outline"
                    label={task.title || task.name || "Task"}
                    theme={theme}
                  />
                ))}
              </View>

              <View style={styles.todayActions}>
                <ThemedButton
                  style={styles.todayButton}
                  onPress={() => router.push("/habits")}
                >
                  Go to Habits
                </ThemedButton>

                <ThemedButton
                  variant="secondary"
                  style={styles.todayButton}
                  onPress={() => router.push("/tasks")}
                >
                  Go to Tasks
                </ThemedButton>
              </View>
            </>
          ) : (
            <View style={styles.emptyToday}>
              <MaterialCommunityIcons
                name="check-decagram-outline"
                size={38}
                color={theme.colors.primary}
              />

              <ThemedText style={styles.emptyTitle}>
                You are clear for now.
              </ThemedText>

              <ThemedText muted style={styles.emptyCopy}>
                Add a habit or task to keep building momentum.
              </ThemedText>

              <View style={styles.emptyActions}>
                <ThemedButton
                  style={styles.emptyButton}
                  onPress={() => router.push("/create-habit")}
                >
                  Add Habit
                </ThemedButton>

                <ThemedButton
                  variant="secondary"
                  style={styles.emptyButton}
                  onPress={() => router.push("/create-task")}
                >
                  Add Task
                </ThemedButton>
              </View>
            </View>
          )}
        </ThemedCard>

        <View style={styles.statsGrid}>
          <StatCard
            label="Coins"
            value={stats.coin_balance}
            icon="circle-multiple"
            theme={theme}
          />

          <StatCard
            label="Streak"
            value={stats.streak_days}
            icon="fire"
            theme={theme}
          />

          <StatCard
            label="Habits"
            value={stats.total_habits}
            icon="repeat"
            theme={theme}
          />

          <StatCard
            label="Tasks"
            value={stats.total_tasks}
            icon="clipboard-check-outline"
            theme={theme}
          />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText variant="section">Achievements</ThemedText>
        </View>

        <ThemedCard style={styles.achievementCard}>
          <View style={styles.achievementTop}>
            <View>
              <ThemedText muted style={styles.achievementLabel}>
                Earned
              </ThemedText>

              <ThemedText style={styles.achievementValue}>
                {achievementSummary.earnedCount} / {achievementSummary.total}
              </ThemedText>
            </View>

            <View
              style={[
                styles.achievementIconWrap,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="trophy-outline"
                size={30}
                color={theme.colors.primary}
              />
            </View>
          </View>

          {achievementSummary.nextUnlock ? (
            <View style={styles.nextUnlockBox}>
              <View style={styles.nextUnlockHeader}>
                <ThemedText style={styles.nextUnlockName}>
                  {achievementSummary.nextUnlock.name}
                </ThemedText>

                <ThemedText muted style={styles.nextUnlockPercent}>
                  {achievementSummary.nextUnlock.percent || 0}%
                </ThemedText>
              </View>

              <View
                style={[
                  styles.nextUnlockProgressOuter,
                  { backgroundColor: theme.colors.surfaceAlt },
                ]}
              >
                <View
                  style={[
                    styles.nextUnlockProgressInner,
                    {
                      width: `${achievementSummary.nextUnlock.percent || 0}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          ) : (
            <ThemedText muted style={styles.completeText}>
              All achievements unlocked. Beast mode.
            </ThemedText>
          )}
        </ThemedCard>

        <ThemedCard style={styles.focusCard}>
          <ThemedText style={styles.focusTitle}>
            Keep building momentum.
          </ThemedText>

          <ThemedText muted style={styles.focusCopy}>
            Add a new habit or task and continue your streak.
          </ThemedText>

          <View style={styles.focusActions}>
            <ThemedButton
              style={styles.focusButton}
              onPress={() => router.push("/create-habit")}
            >
              New Habit
            </ThemedButton>

            <ThemedButton
              variant="secondary"
              style={styles.focusButton}
              onPress={() => router.push("/create-task")}
            >
              New Task
            </ThemedButton>
          </View>
        </ThemedCard>
      </ScrollView>
    </ThemedScreen>
  );
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.habits)) return data.habits;
  if (Array.isArray(data?.tasks)) return data.tasks;
  return [];
}

function PreviewItem({ icon, label, theme }) {
  return (
    <View
      style={[
        styles.previewItem,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={theme.colors.primary}
      />

      <ThemedText numberOfLines={1} style={styles.previewLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function StatCard({ label, value, icon, theme }) {
  return (
    <ThemedCard style={styles.statCard}>
      <View
        style={[styles.statIcon, { backgroundColor: theme.colors.surfaceAlt }]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={theme.colors.primary}
        />
      </View>

      <ThemedText style={styles.statValue}>{value}</ThemedText>

      <ThemedText muted style={styles.statLabel}>
        {label}
      </ThemedText>
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  heroCard: {
    marginTop: 18,
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -120,
    right: -80,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
  },

  heroCopy: {
    flex: 1,
  },

  heroGreeting: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    marginTop: 6,
  },

  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
  },

  streakBadge: {
    width: 88,
    minHeight: 102,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  streakNumber: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },

  streakLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  progressOuter: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 22,
  },

  progressInner: {
    height: "100%",
    borderRadius: 999,
  },

  progressFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressText: {
    fontWeight: "700",
  },

  progressPercent: {
    fontWeight: "900",
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
  },

  todayCard: {
    paddingBottom: 18,
  },

  todayTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },

  previewList: {
    marginTop: 16,
    gap: 10,
  },

  previewItem: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  previewLabel: {
    flex: 1,
    fontWeight: "800",
  },

  todayActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  todayButton: {
    flex: 1,
  },

  emptyToday: {
    alignItems: "center",
    paddingVertical: 10,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },

  emptyCopy: {
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },

  emptyActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  emptyButton: {
    minWidth: 120,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },

  statCard: {
    width: "47%",
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 12,
  },

  statLabel: {
    marginTop: 2,
    fontWeight: "800",
  },

  achievementCard: {
    marginTop: 0,
  },

  achievementTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  achievementLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  achievementValue: {
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4,
  },

  achievementIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  nextUnlockBox: {
    marginTop: 16,
  },

  nextUnlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nextUnlockName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
  },

  nextUnlockPercent: {
    fontWeight: "900",
  },

  nextUnlockProgressOuter: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },

  nextUnlockProgressInner: {
    height: "100%",
    borderRadius: 999,
  },

  completeText: {
    marginTop: 14,
    fontWeight: "700",
  },

  focusCard: {
    marginTop: 28,
  },

  focusTitle: {
    fontSize: 20,
    fontWeight: "900",
  },

  focusCopy: {
    marginTop: 8,
    lineHeight: 20,
  },

  focusActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  focusButton: {
    flex: 1,
  },
});