import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { BrandHeader } from "../../components/BrandMark";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors, radii, shadows, spacing } from "../../lib/theme";

export default function DashboardScreen() {
  const { token, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [quests, setQuests] = useState([]);
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchDashboard() {
    if (!token) return;

    try {
      const [statsData, questsData, habitsData, tasksData, rewardsData] =
        await Promise.all([
          api.get("/stats", token),
          api.get("/quests", token),
          api.get("/habits", token),
          api.get("/tasks", token),
          api.get("/rewards", token),
        ]);

      setStats(statsData);
      setQuests(questsData.items || []);
      setHabits(habitsData || []);
      setTasks(tasksData || []);
      setRewards(rewardsData || []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [token])
  );

  const smartData = useMemo(() => {
    if (!stats) return null;

    const incompleteHabits = habits.filter((h) => !h.completed_today).slice(0, 3);

    const pendingTasks = tasks
      .filter((t) => !t.completed)
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      })
      .slice(0, 3);

    const claimableQuests = quests.filter((q) => q.claimable && !q.claimed);

    const affordableRewards = rewards
      .filter((r) => stats.coin_balance >= r.cost)
      .sort((a, b) => b.cost - a.cost);

    const nextReward =
      affordableRewards[0] ||
      rewards
        .slice()
        .sort((a, b) => a.cost - b.cost)
        .find((r) => r.cost > stats.coin_balance);

    return {
      incompleteHabits,
      pendingTasks,
      claimableQuests,
      nextReward,
    };
  }, [stats, habits, tasks, quests, rewards]);

  if (loading || !stats || !smartData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  const { incompleteHabits, pendingTasks, claimableQuests, nextReward } =
    smartData;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <BrandHeader eyebrow="Overview" title="Dashboard" />

      <AnimatedCard index={0}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Coin Balance</Text>

          <View style={styles.heroRow}>
            <MaterialCommunityIcons name="gold" size={36} color="white" />
            <Text style={styles.heroValue}>{stats.coin_balance}</Text>
          </View>

          <Text style={styles.heroSub}>
            {nextReward
              ? stats.coin_balance >= nextReward.cost
                ? `You can redeem ${nextReward.name}`
                : `${nextReward.cost - stats.coin_balance} coins until ${nextReward.name}`
              : "Keep earning rewards"}
          </Text>
        </View>
      </AnimatedCard>

      <View style={styles.grid}>
        <StatCard index={1} label="Habits" value={stats.habits_count} icon="repeat" />
        <StatCard index={2} label="Tasks" value={stats.tasks_pending} icon="check-square" />
        <StatCard index={3} label="Streak" value={stats.current_max_streak} icon="trending-up" />
        <StatCard index={4} label="Quests" value={claimableQuests.length} icon="target" highlight />
      </View>

      <SmartSection
        index={5}
        title="Do next"
        emptyText="No habits left for today."
        actionText="View Habits"
        onPress={() => router.push("/(tabs)/habits")}
        items={incompleteHabits.map((h) => ({
          id: h.id,
          icon: "zap",
          title: h.name,
          subtitle: `${h.streak || 0} streak • ${h.coins_per_completion || 0} coins`,
        }))}
      />

      <SmartSection
        index={6}
        title="Pending tasks"
        emptyText="No pending tasks."
        actionText="View Tasks"
        onPress={() => router.push("/(tabs)/tasks")}
        items={pendingTasks.map((t) => ({
          id: t.id,
          icon: "check-square",
          title: t.name,
          subtitle: t.due_date ? `Due ${t.due_date}` : "No due date",
        }))}
      />

      <SmartSection
        index={7}
        title="Quests ready"
        emptyText="No quests ready to claim."
        actionText="View Quests"
        onPress={() => router.push("/(tabs)/quests")}
        items={claimableQuests.slice(0, 3).map((q) => ({
          id: q.id,
          icon: "target",
          title: q.name,
          subtitle: `${q.reward || 0} coin reward`,
        }))}
        highlight
      />

      {nextReward && (
        <AnimatedCard index={8}>
          <View style={styles.rewardCard}>
            <View style={styles.rewardIcon}>
              <Feather name="gift" size={24} color={colors.accent} />
            </View>

            <View style={styles.rewardText}>
              <Text style={styles.rewardTitle}>Next reward</Text>
              <Text style={styles.rewardName}>{nextReward.name}</Text>
              <Text style={styles.rewardSub}>
                {stats.coin_balance >= nextReward.cost
                  ? "Ready to redeem"
                  : `${nextReward.cost - stats.coin_balance} coins away`}
              </Text>
            </View>

            <AnimatedPressable
              style={styles.rewardButton}
              onPress={() => router.push("/(tabs)/rewards")}
            >
              <Text style={styles.rewardButtonText}>Open</Text>
            </AnimatedPressable>
          </View>
        </AnimatedCard>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>

        <AnimatedPressable
          style={styles.primaryButton}
          onPress={() => router.push("/create-habit")}
        >
          <Feather name="plus-circle" size={18} color={colors.textDark} />
          <Text style={styles.primaryText}>Add Habit</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={styles.primaryButton}
          onPress={() => router.push("/create-task")}
        >
          <Feather name="plus-circle" size={18} color={colors.textDark} />
          <Text style={styles.primaryText}>Add Task</Text>
        </AnimatedPressable>

        <AnimatedPressable style={styles.secondaryButton} onPress={logout}>
          <Feather name="log-out" size={18} color={colors.text} />
          <Text style={styles.secondaryText}>Log out</Text>
        </AnimatedPressable>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, icon, highlight, index }) {
  return (
    <AnimatedCard index={index} style={styles.statWrapper}>
      <View style={[styles.statCard, highlight && styles.statHighlight]}>
        <Feather
          name={icon}
          size={20}
          color={highlight ? colors.accent : colors.textMuted}
        />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </AnimatedCard>
  );
}

function SmartSection({
  title,
  items,
  emptyText,
  actionText,
  onPress,
  index,
  highlight,
}) {
  return (
    <AnimatedCard index={index}>
      <View style={[styles.smartCard, highlight && styles.smartHighlight]}>
        <View style={styles.smartHeader}>
          <Text style={styles.smartTitle}>{title}</Text>
          <AnimatedPressable style={styles.smartAction} onPress={onPress}>
            <Text style={styles.smartActionText}>{actionText}</Text>
          </AnimatedPressable>
        </View>

        {items.length === 0 ? (
          <Text style={styles.emptyInline}>{emptyText}</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.smartItem}>
              <View style={styles.smartIcon}>
                <Feather name={item.icon} size={17} color={colors.accent} />
              </View>
              <View style={styles.smartItemText}>
                <Text style={styles.smartItemTitle}>{item.title}</Text>
                <Text style={styles.smartItemSub}>{item.subtitle}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </AnimatedCard>
  );
}

function AnimatedCard({ children, index = 0, style }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 55, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(index * 55, withSpring(0));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
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

  heroCard: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryBright,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.glow,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  heroValue: {
    color: "white",
    fontSize: 42,
    fontWeight: "900",
  },
  heroSub: {
    color: "rgba(255,255,255,0.82)",
    marginTop: 6,
    fontWeight: "700",
  },

  grid: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statWrapper: {
    width: "48%",
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    ...shadows.card,
  },
  statHighlight: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
  },
  statLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },

  smartCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  smartHighlight: {
    borderColor: colors.accent,
  },
  smartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smartTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
  },
  smartAction: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  smartActionText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 12,
  },
  smartItem: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smartIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  smartItemText: {
    flex: 1,
  },
  smartItemTitle: {
    color: colors.text,
    fontWeight: "900",
  },
  smartItemSub: {
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: "700",
    fontSize: 12,
  },
  emptyInline: {
    color: colors.textMuted,
    marginTop: spacing.md,
    fontWeight: "700",
  },

  rewardCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadows.card,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardText: {
    flex: 1,
  },
  rewardTitle: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  rewardName: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 17,
    marginTop: 2,
  },
  rewardSub: {
    color: colors.textMuted,
    fontWeight: "700",
    marginTop: 2,
  },
  rewardButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
  },
  rewardButtonText: {
    color: colors.textDark,
    fontWeight: "900",
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
});