import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AnimatedScreen } from "../../components/AnimatedScreen";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { BrandBadge, BrandHeader } from "../../components/BrandMark";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { MomentumBadge } from "../../components/MomentumBadge";
import { OrbitProgressBar } from "../../components/OrbitProgressBar";
import { OrbitRing } from "../../components/OrbitRing";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { StatPill } from "../../components/StatPill";
import { WeeklyOrbitChart } from "../../components/WeeklyOrbitChart";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";
import { radii, spacing, typography } from "../../lib/theme";

export default function DashboardScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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

  const completedAllToday =
    totalTodayItems > 0 && stats.completed_today >= totalTodayItems;

  const momentumScore = Math.min(
    100,
    Math.round(
      todayPercent * 0.45 +
        Math.min(stats.streak_days * 6, 35) +
        Math.min((stats.level_data.percent || 0) * 0.2, 20)
    )
  );

  const heroMessage =
    momentumScore >= 90
      ? "You’re on fire right now."
      : momentumScore >= 75
      ? "Momentum is building fast."
      : momentumScore >= 55
      ? "Your orbit is stabilizing."
      : momentumScore >= 35
      ? "Small wins are stacking up."
      : "Start with one small action today.";

  const xpRemaining = Math.max(
    0,
    (stats.level_data.needed || 100) - (stats.level_data.progress || 0)
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  async function loadDashboard() {
    if (!token) return;

    setError(null);

    try {
      const [statsData, achievementData, habitsData, tasksData] =
        await Promise.allSettled([
          api.get("/stats", token),
          api.get("/achievements", token),
          api.get("/habits", token),
          api.get("/tasks", token),
        ]);

      const failed =
        statsData.status === "rejected" &&
        achievementData.status === "rejected" &&
        habitsData.status === "rejected" &&
        tasksData.status === "rejected";

      if (failed) {
        throw new Error("Unable to load your dashboard right now.");
      }

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
      setError(error?.message || "Unable to load dashboard.");
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
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View style={styles.container}>
          <BrandHeader
            eyebrow="OurOrbit"
            title="Your Orbit Today"
            subtitle="Preparing your progress..."
            compact
          />

          <SkeletonCard lines={2} />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard compact />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View style={styles.container}>
          <BrandHeader
            eyebrow="OurOrbit"
            title="Your Orbit Today"
            subtitle="Your momentum hub."
            compact
          />

          <ErrorState
            title="Dashboard unavailable"
            description={error}
            onRetry={loadDashboard}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <AnimatedScreen style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
            />
          }
        >
          <BrandHeader
            eyebrow="OurOrbit"
            title="Your Orbit Today"
            subtitle="Small actions compound into real progress."
            compact
          />

          <AnimatedScreen delay={40}>
            <AppCard style={styles.heroCard}>
              <View
                style={[
                  styles.heroGlowCyan,
                  {
                    backgroundColor:
                      c.surfaceGlow || `${c.cyan || c.primary}18`,
                  },
                ]}
              />

              <View
                style={[
                  styles.heroGlowCoral,
                  {
                    backgroundColor: `${c.coral || c.primary}12`,
                  },
                ]}
              />

              <View style={styles.heroTop}>
                <View style={styles.heroCopy}>
                  <View style={styles.heroGreetingRow}>
                    <Text
                      style={[styles.heroGreeting, { color: c.textSecondary }]}
                    >
                      {greeting}
                    </Text>

                    <BrandBadge
                      label={completedAllToday ? "Orbit Complete" : "In Motion"}
                    />
                  </View>

                  <Text style={[styles.heroTitle, { color: c.text }]}>
                    {heroMessage}
                  </Text>

                  <Text style={[styles.heroSubtitle, { color: c.textSecondary }]}>
                    {completedAllToday
                      ? "Today’s orbit is complete."
                      : `${stats.completed_today} completed today`}
                  </Text>

                  <View style={styles.momentumBadgeWrap}>
                    <MomentumBadge score={momentumScore} compact />
                  </View>
                </View>

                <OrbitRing
                  percent={todayPercent}
                  value={`${todayPercent}%`}
                  label="Today"
                  size={108}
                  strokeWidth={10}
                  color={c.cyan || c.primary}
                />
              </View>

              <OrbitProgressBar
                percent={todayPercent}
                style={styles.progressBar}
                glow
              />

              <View style={styles.progressFooter}>
                <Text style={[styles.progressText, { color: c.textSecondary }]}>
                  Daily progress
                </Text>

                <Text style={[styles.progressPercent, { color: c.text }]}>
                  {todayPercent}%
                </Text>
              </View>
            </AppCard>
          </AnimatedScreen>

          <AnimatedScreen delay={70}>
            <WeeklyOrbitChart />
          </AnimatedScreen>

          <AnimatedScreen delay={90}>
            <AppCard style={styles.levelCard}>
              <View
                style={[
                  styles.levelGlow,
                  {
                    backgroundColor: `${c.cyan || c.primary}10`,
                  },
                ]}
              />

              <View style={styles.levelTop}>
                <View style={styles.levelCopyWrap}>
                  <Text style={[styles.levelEyebrow, { color: c.textSecondary }]}>
                    Orbit Level
                  </Text>

                  <Text style={[styles.levelTitle, { color: c.text }]}>
                    Level {stats.level_data.level}
                  </Text>

                  <Text style={[styles.levelCopy, { color: c.textSecondary }]}>
                    Keep showing up to unlock new themes and rewards.
                  </Text>
                </View>

                <View
                  style={[
                    styles.levelBadge,
                    {
                      backgroundColor: `${c.cyan || c.primary}14`,
                      borderColor: c.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="orbit"
                    size={30}
                    color={c.cyan || c.primary}
                  />
                </View>
              </View>

              <OrbitProgressBar
                percent={stats.level_data.percent || 0}
                style={styles.progressBar}
                glow
              />

              <View style={styles.progressFooter}>
                <Text style={[styles.progressText, { color: c.textSecondary }]}>
                  {stats.level_data.progress || 0} /{" "}
                  {stats.level_data.needed || 100} XP
                </Text>

                <Text style={[styles.progressPercent, { color: c.text }]}>
                  {stats.level_data.percent || 0}%
                </Text>
              </View>

              <Text style={[styles.xpHint, { color: c.textSecondary }]}>
                {xpRemaining} XP until next orbit level
              </Text>
            </AppCard>
          </AnimatedScreen>

          <AnimatedScreen delay={120}>
            <SectionTitle
              title="Today's Focus"
              subtitle="Your next meaningful actions."
            />

            <AppCard>
              {totalTodayItems > 0 ? (
                <>
                  <Text style={[styles.todayTitle, { color: c.text }]}>
                    You have {totalTodayItems} item
                    {totalTodayItems === 1 ? "" : "s"} to move forward.
                  </Text>

                  <Text style={[styles.todayCopy, { color: c.textSecondary }]}>
                    Choose one small win and keep your orbit moving.
                  </Text>

                  <View style={styles.previewList}>
                    {todayHabits.map((habit) => (
                      <PreviewItem
                        key={`habit-${habit.id || habit._id || habit.name}`}
                        icon="repeat"
                        label={habit.name || habit.title || "Habit"}
                        accent="cyan"
                        themeColors={c}
                      />
                    ))}

                    {todayTasks.map((task) => (
                      <PreviewItem
                        key={`task-${task.id || task._id || task.name || task.title}`}
                        icon="checkbox-marked-circle-outline"
                        label={task.title || task.name || "Task"}
                        accent="coral"
                        themeColors={c}
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
                        color={c.cyan || c.primary}
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
          </AnimatedScreen>

          <AnimatedScreen delay={160}>
            <SectionTitle
              title="Progress Snapshot"
              subtitle="A quick look at your current momentum."
            />

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

            {stats.streak_days >= 7 ? (
              <Text
                style={[
                  styles.streakCallout,
                  { color: c.coral || c.primary },
                ]}
              >
                Your consistency is compounding.
              </Text>
            ) : null}
          </AnimatedScreen>

          <AnimatedScreen delay={200}>
            <SectionTitle
              title="Achievements"
              subtitle="Track your long-term wins."
            />

            <AppCard>
              <View style={styles.achievementTop}>
                <View>
                  <Text
                    style={[
                      styles.achievementLabel,
                      { color: c.textSecondary },
                    ]}
                  >
                    Earned
                  </Text>

                  <Text style={[styles.achievementValue, { color: c.text }]}>
                    {achievementSummary.earnedCount} /{" "}
                    {achievementSummary.total}
                  </Text>
                </View>

                <View
                  style={[
                    styles.achievementIconWrap,
                    {
                      borderColor: c.border,
                      backgroundColor: `${c.gold || c.primary}18`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="trophy-outline"
                    size={30}
                    color={c.gold || c.primary}
                  />
                </View>
              </View>

              {achievementSummary.nextUnlock ? (
                <View style={styles.nextUnlockBox}>
                  <View style={styles.nextUnlockHeader}>
                    <Text style={[styles.nextUnlockName, { color: c.text }]}>
                      {achievementSummary.nextUnlock.name}
                    </Text>

                    <Text
                      style={[
                        styles.nextUnlockPercent,
                        { color: c.textSecondary },
                      ]}
                    >
                      {achievementSummary.nextUnlock.percent || 0}%
                    </Text>
                  </View>

                  <OrbitProgressBar
                    percent={achievementSummary.nextUnlock.percent || 0}
                    glow
                  />
                </View>
              ) : (
                <Text style={[styles.completeText, { color: c.textSecondary }]}>
                  All achievements unlocked. Beast mode.
                </Text>
              )}
            </AppCard>
          </AnimatedScreen>
        </ScrollView>
      </AnimatedScreen>
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

function PreviewItem({ icon, label, accent = "cyan", themeColors }) {
  const c = themeColors;
  const accentColor = c?.[accent] || c?.primary || "#22C7DE";

  return (
    <View
      style={[
        styles.previewItem,
        {
          borderColor: c.border,
          backgroundColor: c.surfaceAlt,
        },
      ]}
    >
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

      <Text numberOfLines={1} style={[styles.previewLabel, { color: c.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
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
  },

  heroGlowCoral: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  heroCopy: {
    flex: 1,
  },

  heroGreetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  heroGreeting: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  heroTitle: {
    ...typography.h1,
    marginTop: spacing.sm,
  },

  heroSubtitle: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
  },

  momentumBadgeWrap: {
    marginTop: spacing.lg,
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
  },

  progressPercent: {
    ...typography.bodyBold,
  },

  levelCard: {
    marginTop: spacing.xl,
    overflow: "hidden",
  },

  levelGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: radii.pill,
    top: -110,
    right: -80,
  },

  levelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.lg,
  },

  levelCopyWrap: {
    flex: 1,
  },

  levelEyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  levelTitle: {
    ...typography.h2,
    marginTop: spacing.xs,
  },

  levelCopy: {
    ...typography.body,
    marginTop: spacing.xs,
  },

  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  xpHint: {
    ...typography.caption,
    marginTop: spacing.sm,
  },

  todayTitle: {
    ...typography.h3,
  },

  todayCopy: {
    ...typography.body,
    marginTop: spacing.sm,
  },

  previewList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  previewItem: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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

  streakCallout: {
    ...typography.bodyBold,
    marginTop: spacing.md,
  },

  achievementTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  achievementLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  achievementValue: {
    ...typography.h1,
    marginTop: spacing.xs,
  },

  achievementIconWrap: {
    width: 62,
    height: 62,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
  },

  nextUnlockPercent: {
    ...typography.bodyBold,
  },

  completeText: {
    ...typography.bodyBold,
    marginTop: spacing.lg,
  },
});