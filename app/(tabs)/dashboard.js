import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AnimatedScreen } from "../../components/AnimatedScreen";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { BrandHeader } from "../../components/BrandMark";
import { AchievementStrip } from "../../components/dashboard/AchievementStrip";
import { ActiveQuestCard } from "../../components/dashboard/ActiveQuestCard";
import { DashboardStatsGrid } from "../../components/dashboard/DashboardStatsGrid";
import { EncouragementCard } from "../../components/dashboard/EncouragementCard";
import { MomentumCard } from "../../components/dashboard/MomentumCard";
import { TodayOrbitCard } from "../../components/dashboard/TodayOrbitCard";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { UserAvatar } from "../../components/UserAvatar";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";
import { getOrbitItems, mergeUnique } from "../../lib/orbitItems";
import { getOrbitTheme } from "../../lib/orbitThemes";
import { gradientContrastInfo, radii, spacing, typography } from "../../lib/theme";

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const [quests, setQuests] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const [stats, setStats] = useState({
    coin_balance: 0,
    completed_today: 0,
    streak_days: 0,
    total_habits: 0,
    total_tasks: 0,
    tasks_done: 0,
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
  const [orbitSummaries, setOrbitSummaries] = useState([]);
  const [orbitCounts, setOrbitCounts] = useState({ habitsTotal: 0, habitsDone: 0, tasksTotal: 0, tasksDone: 0 });

  const totalTodayItems = todayHabits.length + todayTasks.length;
  const dailyGoal = Math.max(totalTodayItems, stats.completed_today, 1);

  const todayPercent = Math.min(
    100,
    Math.round((stats.completed_today / dailyGoal) * 100)
  );

  const momentumScore = Math.min(
    100,
    Math.round(
      todayPercent * 0.45 +
        Math.min(stats.streak_days * 6, 35) +
        Math.min((stats.level_data.percent || 0) * 0.2, 20)
    )
  );

  const activeQuest =
    quests.find((q) => q.claimable) ||
    quests.find((q) => !q.claimed) ||
    quests[0] ||
    null;

  async function loadNotificationCount() {
    if (!token) return;

    try {
      const response = await api.getUnreadNotificationCount();
      setNotificationCount(response.count || 0);
    } catch (error) {
      console.log("Unable to load notification count", error);
    }
  }

  async function loadDashboard() {
    if (!token) return;

    setError(null);

    try {
      const [
        statsData,
        achievementData,
        habitsData,
        tasksData,
        questsData,
        orbitItemsData,
      ] = await Promise.allSettled([
        api.get("/stats"),
        api.get("/achievements"),
        api.get("/habits"),
        api.get("/tasks"),
        api.get("/quests"),
        getOrbitItems(),
      ]);

      await loadNotificationCount();

      const failed =
        statsData.status === "rejected" &&
        achievementData.status === "rejected" &&
        habitsData.status === "rejected" &&
        tasksData.status === "rejected" &&
        questsData.status === "rejected";

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
          tasks_done: data.tasks_done || 0,
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
        setAchievements(data.items || []);
      }

      const orbitItems = orbitItemsData.status === "fulfilled"
        ? orbitItemsData.value
        : { habits: [], tasks: [] };
      setOrbitSummaries(orbitItems.orbits || []);
      setOrbitCounts({
        habitsTotal: orbitItems.habits.length,
        habitsDone: orbitItems.habits.filter((item) => item.completed_today).length,
        tasksTotal: orbitItems.tasks.length,
        tasksDone: orbitItems.tasks.filter((item) => item.completed).length,
      });

      if (habitsData.status === "fulfilled") {
        const habits = mergeUnique(normalizeList(habitsData.value), orbitItems.habits, "habit")
          .sort((a, b) => Number(b.is_orbit_item) - Number(a.is_orbit_item))
          .filter((item) => !item.completed_today)
          .slice(0, 3);

        setTodayHabits(habits);
      }

      if (tasksData.status === "fulfilled") {
        const tasks = mergeUnique(normalizeList(tasksData.value), orbitItems.tasks, "task")
          .sort((a, b) => Number(b.is_orbit_item) - Number(a.is_orbit_item))
          .filter((item) => !item.completed && !item.done)
          .slice(0, 3);

        setTodayTasks(tasks);
      }

      if (questsData.status === "fulfilled") {
        const data = questsData.value || {};
        setQuests(Array.isArray(data) ? data : data.items || []);
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

  function HeaderWithBell({ subtitle }) {
    return (
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <BrandHeader
            eyebrow="OurOrbit"
            title="My Orbits"
            subtitle={subtitle}
            compact
          />
        </View>

        <View style={styles.headerActions}>
        <Pressable onPress={() => router.push("/profile")} accessibilityLabel="Open profile">
          <UserAvatar user={user} size={44} icon="account-circle" color={c.primary} backgroundColor={c.surfaceAlt} borderColor={c.border} />
        </Pressable>
        <Pressable
          style={[
            styles.notificationButton,
            {
              backgroundColor: c.surfaceAlt,
              borderColor: c.border,
            },
          ]}
          onPress={() => router.push("/notifications")}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={c.text}
          />

          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 99 ? "99+" : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View style={styles.container}>
          <HeaderWithBell subtitle="Preparing your progress..." />

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
          <HeaderWithBell subtitle="Your momentum hub." />

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
          <HeaderWithBell subtitle="Your shared goals, habits, and progress live here." />

          <SectionTitle
            title="My Orbits"
            subtitle="Switch Orbits, check shared progress, and jump into the right group."
            action={orbitSummaries.length ? (
              <Pressable onPress={() => router.push("/orbits")}>
                <Text style={[styles.sectionLink, { color: c.primary }]}>View all</Text>
              </Pressable>
            ) : null}
          />
          {orbitSummaries.length ? <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orbitStrip}>
              {orbitSummaries.map((orbit) => <DashboardOrbitCard key={orbit.id} orbit={orbit} colors={c} />)}
            </ScrollView>
            <View style={styles.featuredOrbits}>
              {orbitSummaries.slice(0, 3).map((orbit) => <DashboardOrbitCard key={`featured-${orbit.id}`} orbit={orbit} colors={c} featured />)}
            </View>
          </> : <AppCard style={styles.noOrbitCard}>
            <MaterialCommunityIcons name="account-group-outline" size={36} color={c.primary} />
            <Text style={[styles.todayTitle, { color: c.text }]}>Create your first Orbit</Text>
            <Text style={[styles.todayCopy, { color: c.textSecondary }]}>Share habits, tasks, challenges, and progress with people who matter.</Text>
            <View style={styles.actionRow}><AppButton title="Create Orbit" style={styles.actionButton} onPress={() => router.push("/create-orbit")} /><AppButton title="Start from Template" variant="secondary" style={styles.actionButton} onPress={() => router.push("/create-orbit")} /></View>
          </AppCard>}

          <MomentumCard
            name="Explorer"
            level={stats?.level_data?.level || 1}
            xp={stats?.level_data?.progress || stats?.xp || 0}
            xpToNextLevel={stats?.level_data?.needed || 100}
            streak={stats?.streak_days || 0}
            completedToday={(stats?.completed_today || 0) + (stats?.tasks_done || 0) + orbitCounts.habitsDone + orbitCounts.tasksDone}
            totalToday={(stats?.total_habits || 0) + (stats?.total_tasks || 0) + orbitCounts.habitsTotal + orbitCounts.tasksTotal}
          />

          <TodayOrbitCard
            habitsCompleted={(stats?.completed_today || 0) + orbitCounts.habitsDone}
            habitsTotal={(stats?.total_habits || 0) + orbitCounts.habitsTotal}
            tasksCompleted={(stats?.tasks_done || 0) + orbitCounts.tasksDone}
            tasksTotal={(stats?.total_tasks || 0) + orbitCounts.tasksTotal}
          />

          <DashboardStatsGrid
            coins={stats?.coin_balance || 0}
            xp={stats?.xp || 0}
            streak={stats?.streak_days || 0}
            completedToday={stats?.completed_today || 0}
          />
          <Pressable
  style={[
    styles.recapCard,
    {
      backgroundColor: c.surface,
      borderColor: c.border,
    },
  ]}
  onPress={() => router.push("/weekly-recap")}
>
  <View style={styles.recapIcon}>
    <MaterialCommunityIcons
      name="chart-line"
      size={26}
      color={c.primary}
    />
  </View>

  <View style={styles.recapText}>
    <Text style={[styles.recapTitle, { color: c.text }]}>
      Weekly Recap
    </Text>

    <Text style={[styles.recapSubtitle, { color: c.textSecondary }]}>
      See how your orbit grew this week.
    </Text>
  </View>

  <MaterialCommunityIcons
    name="chevron-right"
    size={24}
    color={c.textSecondary}
  />
</Pressable>
          <ActiveQuestCard quest={activeQuest} />

          <AchievementStrip achievements={achievements} />

          <EncouragementCard momentum={momentumScore} />

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
                        badge={habit.is_orbit_item ? habit.orbit_name : "Personal"}
                        accent="cyan"
                        themeColors={c}
                      />
                    ))}

                    {todayTasks.map((task) => (
                      <PreviewItem
                        key={`task-${
                          task.id || task._id || task.name || task.title
                        }`}
                        icon="checkbox-marked-circle-outline"
                        label={task.title || task.name || "Task"}
                        badge={task.is_orbit_item ? task.orbit_name : "Personal"}
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

function DashboardOrbitCard({ orbit, colors, featured = false }) {
  const orbitTheme = getOrbitTheme(orbit.theme || orbit.theme_id);
  const contrast = gradientContrastInfo(orbitTheme.gradient);
  const textColor = orbitTheme.text_color || contrast.textColor;
  const secondaryTextColor = contrast.secondaryTextColor;
  const accentColor = orbitTheme.accent || textColor;
  const progress = Math.min(100, Math.max(0, orbit.weekly_completion_rate || 0));

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/orbit-detail", params: { orbitId: orbit.id } })}
      style={featured ? null : styles.orbitChipWrap}
    >
      <LinearGradient colors={orbitTheme.gradient} style={[styles.orbitGradientCard, featured ? styles.featuredOrbitCard : styles.orbitChip]}>
        {contrast.needsScrim ? <View style={styles.orbitGradientScrim} /> : null}
        <View style={styles.orbitCardHeader}>
          <View style={[styles.orbitIcon, { backgroundColor: `${accentColor}28` }]}>
            <MaterialCommunityIcons name="account-group" size={22} color={textColor} />
          </View>
          <Text style={[styles.orbitLevel, { color: textColor }]}>Level {orbit.level || 1}</Text>
        </View>

        <Text style={[styles.orbitName, { color: textColor }]} numberOfLines={1}>{orbit.name}</Text>
        <Text style={[styles.previewBadge, { color: secondaryTextColor }]}>
          {orbit.member_count || 0} member{(orbit.member_count || 0) === 1 ? "" : "s"}
        </Text>

        {featured ? (
          <>
            <View style={[styles.orbitTrack, { backgroundColor: "rgba(255,255,255,0.28)" }]}>
              <View style={[styles.orbitFill, { backgroundColor: accentColor, width: `${progress}%` }]} />
            </View>
            <Text style={[styles.todayCopy, { color: secondaryTextColor }]}> 
              {progress}% this week | {orbit.active_challenges_count || 0} challenges | {orbit.due_count || 0} due
            </Text>
          </>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

function PreviewItem({ icon, label, badge, accent = "cyan", themeColors }) {
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

      <View style={styles.previewCopy}>
        <Text numberOfLines={1} style={[styles.previewLabel, { color: c.text }]}>{label}</Text>
        {!!badge && <Text numberOfLines={1} style={[styles.previewBadge, { color: c.primary }]}>{badge}</Text>}
      </View>
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

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },

  headerContent: {
    flex: 1,
  },

  notificationButton: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  notificationBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
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
    ...typography.bodyBold,
  },
  previewCopy: { flex: 1 },
  previewBadge: { ...typography.caption, fontWeight: "800", marginTop: 2 },
  sectionLink: { ...typography.caption, fontWeight: "900" },
  orbitStrip: { gap: spacing.sm, paddingBottom: spacing.sm },
  orbitChipWrap: { width: 220 },
  orbitChip: { width: 220, minHeight: 128 },
  orbitGradientCard: { borderRadius: radii.xl, padding: spacing.lg, overflow: "hidden" },
  orbitGradientScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.24)" },
  orbitIcon: { width: 38, height: 38, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  orbitName: { ...typography.h3, marginTop: spacing.sm },
  featuredOrbits: { gap: spacing.sm, marginBottom: spacing.md },
  featuredOrbitCard: { marginBottom: 0, minHeight: 150 },
  orbitCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  orbitLevel: { ...typography.caption, fontWeight: "900" },
  orbitTrack: { height: 8, borderRadius: radii.pill, overflow: "hidden", marginTop: spacing.md },
  orbitFill: { height: "100%", borderRadius: radii.pill },
  noOrbitCard: { marginBottom: spacing.md },

  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
 recapCard: {
  borderWidth: 1,
  borderRadius: radii.lg,
  padding: spacing.lg,
  marginTop: spacing.md,
  marginBottom: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
},

recapIcon: {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center",
  justifyContent: "center",
},

recapText: {
  flex: 1,
},

recapTitle: {
  ...typography.h3,
},

recapSubtitle: {
  ...typography.body,
  marginTop: spacing.xs,
},
  actionButton: {
    flex: 1,
  },
});
