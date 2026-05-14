import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { BrandHeader } from "../../components/BrandMark";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import ThemedText from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";

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
  const { theme } = useTheme();

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
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <ThemedText muted style={styles.loadingText}>
          Loading achievements...
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={listData}
        keyExtractor={(row) => row.id}
        refreshing={loading}
        onRefresh={fetchAchievements}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Progress" title="Achievements" />

            <ThemedCard style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <ThemedText muted style={styles.summaryLabel}>
                    Earned Badges
                  </ThemedText>

                  <ThemedText style={styles.summaryValue}>
                    {earnedCount} / {total}
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.summaryIcon,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="trophy-outline"
                    size={34}
                    color={theme.colors.primary}
                  />
                </View>
              </View>

              <ThemedText muted style={styles.summarySub}>
                Complete goals to unlock badges and exclusive themes.
              </ThemedText>
            </ThemedCard>
          </View>
        }
        ListEmptyComponent={
          <ThemedCard style={styles.emptyCard}>
            <Feather name="award" size={36} color={theme.colors.primary} />
            <ThemedText variant="section" style={styles.emptyTitle}>
              No achievements yet
            </ThemedText>
            <ThemedText muted style={styles.emptyText}>
              Complete habits, tasks, and rewards to unlock badges.
            </ThemedText>
          </ThemedCard>
        }
        renderItem={({ item, index }) => {
          if (item.type === "header") {
            return <CategoryHeader category={item.category} theme={theme} />;
          }

          return (
            <AnimatedCard index={index}>
              <AchievementCard achievement={item.item} theme={theme} />
            </AnimatedCard>
          );
        }}
      />

      <AchievementCelebrationModal
        visible={!!celebrationTarget}
        achievement={celebrationTarget}
        theme={theme}
        onClose={dismissCelebration}
      />
    </View>
  );
}

function CategoryHeader({ category, theme }) {
  return (
    <View style={styles.categoryHeader}>
      <ThemedText style={styles.categoryTitle}>{category}</ThemedText>

      <View
        style={[styles.categoryLine, { backgroundColor: theme.colors.border }]}
      />
    </View>
  );
}

function AchievementCard({ achievement, theme }) {
  const themeReward = THEME_REWARDS[achievement.id];
  const earned = !!achievement.earned;
  const newlyEarned = !!achievement.newly_earned;

  return (
    <ThemedCard
      style={[
        styles.card,
        earned && { borderColor: theme.colors.success },
        newlyEarned && { borderColor: theme.colors.primary },
      ]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: earned
                ? theme.colors.success
                : theme.colors.surfaceAlt,
              borderColor: earned ? theme.colors.success : theme.colors.border,
            },
          ]}
        >
          <Feather
            name={earned ? "award" : "lock"}
            size={22}
            color={earned ? theme.colors.primaryText : theme.colors.muted}
          />
        </View>

        <View style={styles.cardText}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.name}>{achievement.name}</ThemedText>

            {newlyEarned && (
              <View
                style={[
                  styles.newBadge,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.newBadgeText,
                    { color: theme.colors.primaryText },
                  ]}
                >
                  New
                </ThemedText>
              </View>
            )}
          </View>

          <ThemedText muted style={styles.description}>
            {achievement.description}
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
              width: `${achievement.percent || 0}%`,
              backgroundColor: earned
                ? theme.colors.success
                : theme.colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.metaRow}>
        <MetaPill
          theme={theme}
          icon={
            <Feather name="trending-up" size={14} color={theme.colors.muted} />
          }
          text={`${achievement.raw_progress || 0} / ${achievement.target}`}
        />

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: earned ? theme.colors.success : theme.colors.border,
            },
          ]}
        >
          <Feather
            name={earned ? "check-circle" : "clock"}
            size={14}
            color={earned ? theme.colors.success : theme.colors.primary}
          />
          <ThemedText
            style={[
              styles.statusText,
              {
                color: earned ? theme.colors.success : theme.colors.primary,
              },
            ]}
          >
            {earned ? "Unlocked" : `${achievement.percent || 0}%`}
          </ThemedText>
        </View>

        {themeReward && (
          <View
            style={[
              styles.themeRewardPill,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.warning || "#EAB308",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="palette-outline"
              size={14}
              color={theme.colors.warning || "#EAB308"}
            />
            <ThemedText
              style={[
                styles.themeRewardText,
                { color: theme.colors.warning || "#EAB308" },
              ]}
            >
              Unlocks {themeReward}
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedCard>
  );
}

function AchievementCelebrationModal({ visible, achievement, theme, onClose }) {
  if (!achievement) return null;

  const themeReward = THEME_REWARDS[achievement.id];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.success,
            },
          ]}
        >
          <View
            style={[
              styles.celebrationIcon,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.success,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="trophy-award"
              size={42}
              color={theme.colors.success}
            />
          </View>

          <ThemedText
            style={[styles.modalEyebrow, { color: theme.colors.success }]}
          >
            Achievement Unlocked
          </ThemedText>

          <ThemedText style={styles.modalTitle}>{achievement.name}</ThemedText>

          <ThemedText muted style={styles.modalDescription}>
            {achievement.description}
          </ThemedText>

          {themeReward && (
            <View
              style={[
                styles.modalRewardBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.warning || "#EAB308",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="palette-outline"
                size={22}
                color={theme.colors.warning || "#EAB308"}
              />

              <View style={{ flex: 1 }}>
                <ThemedText
                  style={[
                    styles.modalRewardTitle,
                    { color: theme.colors.warning || "#EAB308" },
                  ]}
                >
                  Theme Reward
                </ThemedText>

                <ThemedText muted style={styles.modalRewardText}>
                  {themeReward} is now available in the Theme Store.
                </ThemedText>
              </View>
            </View>
          )}

          <View style={styles.modalActions}>
            {themeReward && (
              <ThemedButton
                variant="secondary"
                style={styles.modalButton}
                onPress={() => {
                  onClose();
                  router.push("/theme-store");
                }}
              >
                Theme Store
              </ThemedButton>
            )}

            <ThemedButton style={styles.modalButton} onPress={onClose}>
              Nice
            </ThemedButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MetaPill({ theme, icon, text }) {
  return (
    <View
      style={[
        styles.metaPill,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {icon}
      <ThemedText muted style={styles.metaText}>
        {text}
      </ThemedText>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContent: {
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontWeight: "700",
  },
  summaryCard: {
    marginTop: 14,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: 4,
  },
  summarySub: {
    marginTop: 10,
    fontWeight: "700",
  },
  summaryIcon: {
    width: 66,
    height: 66,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emptyCard: {
    marginTop: 20,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 6,
  },
  categoryHeader: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  categoryLine: {
    flex: 1,
    height: 1,
  },
  card: {
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
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
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  description: {
    marginTop: 4,
    lineHeight: 20,
    fontWeight: "600",
  },
  newBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  progressOuter: {
    marginTop: 14,
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  metaPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  metaText: {
    fontWeight: "900",
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: "900",
    fontSize: 12,
  },
  themeRewardPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  themeRewardText: {
    fontWeight: "900",
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 30,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  celebrationIcon: {
    width: 86,
    height: 86,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  modalEyebrow: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  modalDescription: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
  },
  modalRewardBox: {
    width: "100%",
    marginTop: 18,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalRewardTitle: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  modalRewardText: {
    marginTop: 3,
    fontWeight: "700",
    lineHeight: 19,
  },
  modalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});