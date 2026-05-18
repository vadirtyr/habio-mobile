import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SkeletonCard } from "../../components/SkeletonCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors, radii, spacing, typography } from "../../lib/theme";

const CATEGORY_ORDER = [
  "Habits",
  "Tasks",
  "Streaks",
  "Coins",
  "Rewards",
  "Quests",
];

const THEME_REWARDS = {
  "streak-7": "Forest Night",
  "coins-500": "Aurora",
  "tasks-50": "Sunset",
  "streak-30": "Midnight Gold",
  "habits-25": "Ocean Breeze",
  "quests-10": "Rose Garden",
};

export default function AchievementsScreen() {
  const { token } = useAuth();

  const [achievements, setAchievements] = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [celebrationTarget, setCelebrationTarget] = useState(null);

  async function fetchAchievements() {
    if (!token) return;

    try {
      const data = await api.get("/achievements", token);

      setAchievements(data.items || []);
      setEarnedCount(data.earned_count || 0);
      setTotal(data.total || 0);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAchievements();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchAchievements();
    }, [token])
  );

  useEffect(() => {
    const newest = achievements.find((a) => a.newly_earned);

    if (newest) {
      setCelebrationTarget(newest);
    }
  }, [achievements]);

  function dismissCelebration() {
    setCelebrationTarget(null);
  }

  const listData = useMemo(() => {
    const grouped = {};

    achievements.forEach((item) => {
      const category = item.category || "Other";

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push(item);
    });

    const orderedCategories = [
      ...CATEGORY_ORDER.filter((category) => grouped[category]),
      ...Object.keys(grouped).filter(
        (category) => !CATEGORY_ORDER.includes(category)
      ),
    ];

    const rows = [];

    orderedCategories.forEach((category) => {
      rows.push({
        type: "header",
        id: `header-${category}`,
        category,
      });

      grouped[category].forEach((achievement) => {
        rows.push({
          type: "achievement",
          id: achievement.id,
          item: achievement,
        });
      });
    });

    return rows;
  }, [achievements]);

  if (loading) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Achievements"
        subtitle="Loading achievements..."
      />

      <SkeletonCard lines={2} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard compact />
    </View>
  );
}

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(row) => row.id}
        refreshing={loading}
        onRefresh={fetchAchievements}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title="Achievements"
              subtitle="Track milestones and unlock rewards."
            />

            <AppCard style={styles.summaryCard}>
              <View style={styles.summaryGlowGold} />
              <View style={styles.summaryGlowCyan} />

              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.summaryLabel}>Earned Badges</Text>

                  <Text style={styles.summaryValue}>
                    {earnedCount} / {total}
                  </Text>
                </View>

                <View style={styles.summaryIcon}>
                  <MaterialCommunityIcons
                    name="trophy-outline"
                    size={34}
                    color={colors.gold}
                  />
                </View>
              </View>

              <Text style={styles.summarySub}>
                Complete goals to unlock badges and exclusive themes.
              </Text>
            </AppCard>
          </View>
        }
        ListEmptyComponent={
          <AppCard style={styles.emptyCard}>
            <EmptyState
              title="No achievements yet"
              description="Complete habits, tasks, and rewards to unlock badges."
              icon={<Feather name="award" size={42} color={colors.gold} />}
            />
          </AppCard>
        }
        renderItem={({ item, index }) => {
          if (item.type === "header") {
            return <CategoryHeader category={item.category} />;
          }

          return (
            <AnimatedCard index={index}>
              <AchievementCard achievement={item.item} />
            </AnimatedCard>
          );
        }}
      />

      <AchievementCelebrationModal
        visible={!!celebrationTarget}
        achievement={celebrationTarget}
        onClose={dismissCelebration}
      />
    </View>
  );
}

function CategoryHeader({ category }) {
  return (
    <View style={styles.categoryHeader}>
      <Text style={styles.categoryTitle}>{category}</Text>
      <View style={styles.categoryLine} />
    </View>
  );
}

function AchievementCard({ achievement }) {
  const themeReward = THEME_REWARDS[achievement.id];
  const earned = !!achievement.earned;
  const newlyEarned = !!achievement.newly_earned;

  return (
    <AppCard
      style={[
        styles.card,
        earned && { borderColor: colors.success },
        newlyEarned && { borderColor: colors.cyan },
      ]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: earned
                ? `${colors.success}16`
                : colors.surfaceAlt,
              borderColor: earned ? colors.success : colors.border,
            },
          ]}
        >
          <Feather
            name={earned ? "award" : "lock"}
            size={22}
            color={earned ? colors.success : colors.textMuted}
          />
        </View>

        <View style={styles.cardText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{achievement.name}</Text>

            {newlyEarned ? (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.description}>{achievement.description}</Text>
        </View>
      </View>

      <View style={styles.progressOuter}>
        <View
          style={[
            styles.progressInner,
            {
              width: `${achievement.percent || 0}%`,
              backgroundColor: earned ? colors.success : colors.cyan,
            },
          ]}
        />
      </View>

      <View style={styles.metaRow}>
        <MetaPill
          icon={<Feather name="trending-up" size={14} color={colors.textMuted} />}
          text={`${achievement.raw_progress || 0} / ${achievement.target}`}
        />

        <View
          style={[
            styles.statusPill,
            {
              borderColor: earned ? colors.success : colors.border,
              backgroundColor: earned ? `${colors.success}12` : colors.surfaceAlt,
            },
          ]}
        >
          <Feather
            name={earned ? "check-circle" : "clock"}
            size={14}
            color={earned ? colors.success : colors.cyan}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: earned ? colors.success : colors.cyan,
              },
            ]}
          >
            {earned ? "Unlocked" : `${achievement.percent || 0}%`}
          </Text>
        </View>

        {themeReward ? (
          <View style={styles.themeRewardPill}>
            <MaterialCommunityIcons
              name="palette-outline"
              size={14}
              color={colors.gold}
            />

            <Text style={styles.themeRewardText}>Unlocks {themeReward}</Text>
          </View>
        ) : null}
      </View>
    </AppCard>
  );
}

function AchievementCelebrationModal({ visible, achievement, onClose }) {
  if (!achievement) return null;

  const themeReward = THEME_REWARDS[achievement.id];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.celebrationIcon}>
            <MaterialCommunityIcons
              name="trophy-award"
              size={42}
              color={colors.success}
            />
          </View>

          <Text style={styles.modalEyebrow}>Achievement Unlocked</Text>

          <Text style={styles.modalTitle}>{achievement.name}</Text>

          <Text style={styles.modalDescription}>{achievement.description}</Text>

          {themeReward ? (
            <View style={styles.modalRewardBox}>
              <MaterialCommunityIcons
                name="palette-outline"
                size={22}
                color={colors.gold}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.modalRewardTitle}>Theme Reward</Text>

                <Text style={styles.modalRewardText}>
                  {themeReward} is now available in the Theme Store.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            {themeReward ? (
              <AppButton
                variant="secondary"
                style={styles.modalButton}
                title="Theme Store"
                onPress={() => {
                  onClose();
                  router.push("/theme-store");
                }}
              />
            ) : null}

            <AppButton style={styles.modalButton} title="Nice" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MetaPill({ icon, text }) {
  return (
    <View style={styles.metaPill}>
      {icon}
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function AnimatedCard({ children, index = 0 }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 240 }));
    translateY.value = withDelay(index * 45, withTiming(0, { duration: 240 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  listContent: {
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  summaryCard: {
    overflow: "hidden",
  },

  summaryGlowGold: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    top: -130,
    right: -90,
    backgroundColor: `${colors.gold}18`,
  },

  summaryGlowCyan: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
    backgroundColor: `${colors.cyan}10`,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  summaryValue: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.text,
    marginTop: spacing.xs,
  },

  summarySub: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  summaryIcon: {
    width: 66,
    height: 66,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: `${colors.gold}18`,
  },

  emptyCard: {
    marginTop: spacing.xl,
    alignItems: "center",
  },

  categoryHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  categoryTitle: {
    ...typography.h3,
    color: colors.text,
  },

  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },

  card: {
    marginBottom: spacing.md,
  },

  cardTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  cardText: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  name: {
    flex: 1,
    ...typography.h3,
    color: colors.text,
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  newBadge: {
    borderWidth: 1,
    borderColor: colors.cyan,
    backgroundColor: colors.cyan,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  newBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.white,
  },

  progressOuter: {
    marginTop: spacing.lg,
    height: 10,
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
  },

  progressInner: {
    height: "100%",
    borderRadius: radii.pill,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  metaPill: {
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },

  metaText: {
    fontWeight: "900",
    fontSize: 12,
    color: colors.textSecondary,
  },

  statusPill: {
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
  },

  statusText: {
    fontWeight: "900",
    fontSize: 12,
  },

  themeRewardPill: {
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    backgroundColor: `${colors.gold}12`,
    borderColor: colors.gold,
  },

  themeRewardText: {
    fontWeight: "900",
    fontSize: 12,
    color: colors.gold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },

  modalCard: {
    width: "100%",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: "center",
  },

  celebrationIcon: {
    width: 86,
    height: 86,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: `${colors.success}12`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  modalEyebrow: {
    ...typography.caption,
    color: colors.success,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  modalTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center",
  },

  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  modalRewardBox: {
    width: "100%",
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}12`,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  modalRewardTitle: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  modalRewardText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  modalActions: {
    width: "100%",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },

  modalButton: {
    flex: 1,
  },
});