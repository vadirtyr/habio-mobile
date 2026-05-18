import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { EmptyState } from "../../components/EmptyState";
import { OrbitProgressBar } from "../../components/OrbitProgressBar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { StatPill } from "../../components/StatPill";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors, radii, spacing, typography } from "../../lib/theme";

export default function DashboardScreen() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    coin_balance: 0,
    completed_today: 0,
    streak_days: 0,
    total_habits: 0,
    total_tasks: 0,
    xp: 0,
    level_data: {
    level: 1,
    current_xp: 0,
    progress: 0,
    needed: 100,
    percent: 0,
    },
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
          xp: data.xp || 0,
          level_data: data.level_data || {
          level: 1,
          current_xp: 0,
          progress: 0,
          needed: 100,
          percent: 0,
        },
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
      console.error("Dashboard load failed:", error);
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
    <View style={styles.container}>
      <ScreenHeader
        title="Dashboard"
        subtitle="Preparing your orbit..."
      />

      <SkeletonCard lines={2} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard compact />
    </View>
  );
}

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ScreenHeader title="Dashboard" subtitle="Build better days." />

        <AppCard style={styles.heroCard}>
          <View style={styles.heroGlowCyan} />
          <View style={styles.heroGlowCoral} />

          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroGreeting}>{greeting}</Text>

              <Text style={styles.heroTitle}>Your orbit is in motion.</Text>

              <Text style={styles.heroSubtitle}>
                {stats.completed_today} completed today
              </Text>
            </View>

            <View style={styles.streakBadge}>
              <MaterialCommunityIcons
                name="fire"
                size={28}
                color={colors.coral}
              />

              <Text style={styles.streakNumber}>{stats.streak_days}</Text>
              <Text style={styles.streakLabel}>days</Text>
            </View>
          </View>

          <OrbitProgressBar percent={todayPercent} style={styles.progressBar} />

          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>Daily progress</Text>
            <Text style={styles.progressPercent}>{todayPercent}%</Text>
          </View>
        </AppCard>
         <AppCard style={styles.levelCard}>
  <View style={styles.levelTop}>
    <View>
      <Text style={styles.levelEyebrow}>Orbit Level</Text>
      <Text style={styles.levelTitle}>
        Level {stats.level_data.level}
      </Text>
    </View>

    <View style={styles.levelBadge}>
      <MaterialCommunityIcons
        name="orbit"
        size={30}
        color={colors.cyan}
      />
    </View>
  </View>

  <OrbitProgressBar
    percent={stats.level_data.percent || 0}
    style={styles.progressBar}
  />

  <View style={styles.progressFooter}>
    <Text style={styles.progressText}>
      {stats.level_data.progress || 0} / {stats.level_data.needed || 100} XP
    </Text>

    <Text style={styles.progressPercent}>
      {stats.level_data.percent || 0}%
    </Text>
  </View>
</AppCard> 
        <SectionTitle title="Today Focus" />

        <AppCard>
          {totalTodayItems > 0 ? (
            <>
              <Text style={styles.todayTitle}>
                You have {totalTodayItems} item
                {totalTodayItems === 1 ? "" : "s"} to move forward.
              </Text>

              <View style={styles.previewList}>
                {todayHabits.map((habit) => (
                  <PreviewItem
                    key={`habit-${habit.id || habit._id || habit.name}`}
                    icon="repeat"
                    label={habit.name || habit.title || "Habit"}
                    accent="cyan"
                  />
                ))}

                {todayTasks.map((task) => (
                  <PreviewItem
                    key={`task-${
                      task.id || task._id || task.name || task.title
                    }`}
                    icon="checkbox-marked-circle-outline"
                    label={task.title || task.name || "Task"}
                    accent="coral"
                  />
                ))}
              </View>

              <View style={styles.actionRow}>
                <AppButton
                  title="Go to Habits"
                  style={styles.actionButton}
                  onPress={() => router.push("/habits")}
                />

                <AppButton
                  title="Go to Tasks"
                  variant="secondary"
                  style={styles.actionButton}
                  onPress={() => router.push("/tasks")}
                />
              </View>
            </>
          ) : (
            <>
              <EmptyState
                title="Your orbit is clear."
                description="Add a habit or task to keep your momentum moving."
                icon={
                  <MaterialCommunityIcons
                    name="check-decagram-outline"
                    size={42}
                    color={colors.cyan}
                  />
                }
              />

              <View style={styles.actionRow}>
                <AppButton
                  title="Add Habit"
                  style={styles.actionButton}
                  onPress={() => router.push("/create-habit")}
                />

                <AppButton
                  title="Add Task"
                  variant="secondary"
                  style={styles.actionButton}
                  onPress={() => router.push("/create-task")}
                />
              </View>
            </>
          )}
        </AppCard>

        <SectionTitle title="Progress Snapshot" />

        <View style={styles.statsGrid}>
          <StatPill
            label="Coins"
            value={stats.coin_balance}
            icon="circle-multiple"
            accent="gold"
          />

          <StatPill
            label="Streak"
            value={stats.streak_days}
            icon="fire"
            accent="coral"
          />

          <StatPill
            label="Habits"
            value={stats.total_habits}
            icon="repeat"
            accent="cyan"
          />

          <StatPill
            label="Tasks"
            value={stats.total_tasks}
            icon="clipboard-check-outline"
            accent="blue"
          />
        </View>

        <SectionTitle title="Achievements" />

        <AppCard>
          <View style={styles.achievementTop}>
            <View>
              <Text style={styles.achievementLabel}>Earned</Text>

              <Text style={styles.achievementValue}>
                {achievementSummary.earnedCount} / {achievementSummary.total}
              </Text>
            </View>

            <View style={styles.achievementIconWrap}>
              <MaterialCommunityIcons
                name="trophy-outline"
                size={30}
                color={colors.gold}
              />
            </View>
          </View>

          {achievementSummary.nextUnlock ? (
            <View style={styles.nextUnlockBox}>
              <View style={styles.nextUnlockHeader}>
                <Text style={styles.nextUnlockName}>
                  {achievementSummary.nextUnlock.name}
                </Text>

                <Text style={styles.nextUnlockPercent}>
                  {achievementSummary.nextUnlock.percent || 0}%
                </Text>
              </View>

              <OrbitProgressBar
                percent={achievementSummary.nextUnlock.percent || 0}
              />
            </View>
          ) : (
            <Text style={styles.completeText}>
              All achievements unlocked. Beast mode.
            </Text>
          )}
        </AppCard>

        <AppCard style={styles.focusCard}>
          <Text style={styles.focusTitle}>Keep building momentum.</Text>

          <Text style={styles.focusCopy}>
            Add a new habit or task and continue your streak.
          </Text>

          <View style={styles.actionRow}>
            <AppButton
              title="New Habit"
              style={styles.actionButton}
              onPress={() => router.push("/create-habit")}
            />

            <AppButton
              title="New Task"
              variant="secondary"
              style={styles.actionButton}
              onPress={() => router.push("/create-task")}
            />
          </View>
        </AppCard>
      </ScrollView>
    </View>
  );
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.habits)) return data.habits;
  if (Array.isArray(data?.tasks)) return data.tasks;
  return [];
}

function PreviewItem({ icon, label, accent = "cyan" }) {
  const accentColor = colors[accent] || colors.cyan;

  return (
    <View style={styles.previewItem}>
      <View
        style={[
          styles.previewIcon,
          {
            backgroundColor: `${accentColor}18`,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={19} color={accentColor} />
      </View>

      <Text numberOfLines={1} style={styles.previewLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  heroCard: {
    overflow: "hidden",
  },

  heroGlowCyan: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    top: -130,
    right: -80,
    backgroundColor: `${colors.cyan}18`,
  },

  heroGlowCoral: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
    backgroundColor: `${colors.coral}12`,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  heroCopy: {
    flex: 1,
  },

  heroGreeting: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  heroTitle: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.sm,
  },

  heroSubtitle: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  streakBadge: {
    width: 88,
    minHeight: 102,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  streakNumber: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },

  streakLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },

  progressBar: {
    marginTop: spacing.xl,
  },

  progressFooter: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  progressPercent: {
    ...typography.bodyBold,
    color: colors.text,
  },

  todayTitle: {
    ...typography.h3,
    color: colors.text,
  },

  previewList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  previewItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },

  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  previewLabel: {
    flex: 1,
    ...typography.bodyBold,
    color: colors.text,
  },

  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  actionButton: {
    flex: 1,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  achievementTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  achievementLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  achievementValue: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.xs,
  },

  achievementIconWrap: {
    width: 62,
    height: 62,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: `${colors.gold}18`,
  },

  nextUnlockBox: {
    marginTop: spacing.lg,
  },

  nextUnlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nextUnlockName: {
    flex: 1,
    ...typography.bodyBold,
    color: colors.text,
  },

  nextUnlockPercent: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },

  completeText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },

  focusCard: {
    marginTop: spacing.xl,
  },

  focusTitle: {
    ...typography.h3,
    color: colors.text,
  },

  focusCopy: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  levelCard: {
  marginTop: spacing.xl,
  overflow: "hidden",
},

levelTop: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.lg,
},

levelEyebrow: {
  ...typography.caption,
  color: colors.textSecondary,
  textTransform: "uppercase",
  letterSpacing: 0.8,
},

levelTitle: {
  ...typography.h2,
  color: colors.text,
  marginTop: spacing.xs,
},

levelBadge: {
  width: 64,
  height: 64,
  borderRadius: radii.pill,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: `${colors.cyan}14`,
  borderWidth: 1,
  borderColor: colors.border,
},
});