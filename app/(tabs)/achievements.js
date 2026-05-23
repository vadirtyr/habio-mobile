import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  View
} from "react-native";


import { AnimatedScreen } from "../../components/AnimatedScreen";
import { AppCard } from "../../components/AppCard";
import { BrandHeader } from "../../components/BrandMark";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { OrbitProgressBar } from "../../components/OrbitProgressBar";
import { SkeletonCard } from "../../components/SkeletonCard";
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

const CATEGORY_ICONS = {
  Habits: "repeat",
  Tasks: "clipboard-check-outline",
  Streaks: "fire",
  Coins: "circle-multiple",
  Rewards: "gift-outline",
  Quests: "map-marker-path",
};

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

  const c = theme.colors;

  const [achievements, setAchievements] =
    useState([]);

  const [earnedCount, setEarnedCount] =
    useState(0);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
  useState(true);

const [refreshing, setRefreshing] =
  useState(false);

const [error, setError] =
  useState(null);

const [
  celebrationTarget,
  setCelebrationTarget,
] = useState(null);

  async function fetchAchievements() {
  if (!token) return;

  setError(null);

  try {
    const data = await api.get("/achievements", token);

    setAchievements(data.items || []);
    setEarnedCount(data.earned_count || 0);
    setTotal(data.total || 0);
  } catch (error) {
    setError(error?.message || "Unable to load achievements.");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}


  useFocusEffect(
    useCallback(() => {
      fetchAchievements();
    }, [token])
  );

  useEffect(() => {
    if (celebrationTarget) return;

    const newest =
      achievements.find(
        (a) => a.newly_earned
      );

    if (newest) {
      setCelebrationTarget(
        newest
      );
    }
  }, [achievements]);

  const completionPercent =
    total > 0
      ? Math.round(
          (earnedCount / total) *
            100
        )
      : 0;

  const progressMessage =
    completionPercent >= 90
      ? "You're becoming unstoppable."
      : completionPercent >= 70
      ? "Momentum is compounding."
      : completionPercent >= 40
      ? "Your orbit is expanding."
      : "Every small win matters.";

  const listData = useMemo(() => {
    const grouped = {};

    achievements.forEach(
      (item) => {
        const category =
          item.category ||
          "Other";

        if (
          !grouped[category]
        ) {
          grouped[category] =
            [];
        }

        grouped[
          category
        ].push(item);
      }
    );

    const orderedCategories = [
      ...CATEGORY_ORDER.filter(
        (category) =>
          grouped[category]
      ),

      ...Object.keys(
        grouped
      ).filter(
        (category) =>
          !CATEGORY_ORDER.includes(
            category
          )
      ),
    ];

    const rows = [];

    orderedCategories.forEach(
      (category) => {
        rows.push({
          type: "header",
          id: `header-${category}`,
          category,
        });

        grouped[
          category
        ].forEach(
          (achievement) => {
            rows.push({
              type: "achievement",
              id:
                achievement.id,
              item:
                achievement,
            });
          }
        );
      }
    );

    return rows;
  }, [achievements]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              c.background,
          },
        ]}
      >
        <BrandHeader
          eyebrow="OurOrbit"
          title="Achievements"
          subtitle="Loading milestones..."
          compact
        />

        <SkeletonCard lines={2} />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard compact />
      </View>
    );
  }

  if (error) {
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <BrandHeader
        eyebrow="OurOrbit"
        title="Achievements"
        subtitle="Track milestones and unlock exclusive rewards."
        compact
      />

      <ErrorState
        title="Achievements unavailable"
        description={error}
        onRetry={fetchAchievements}
      />
    </View>
  );
}

return (
  <View
    style={[
      styles.container,
      {
        backgroundColor: c.background,
      },
    ]}
  >
    <AchievementCelebrationModal
      visible={!!celebrationTarget}
      achievement={celebrationTarget}
      onClose={() =>
        setCelebrationTarget(null)
      }
    />

    <FlatList
        data={listData}
        keyExtractor={(row) =>
          row.id
        }
        refreshing={refreshing}
        onRefresh={async () => {
        setRefreshing(true);
        await fetchAchievements();
        }}
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={
          false
        }
        ListHeaderComponent={
          <View>
            <AnimatedScreen delay={40}>
              <BrandHeader
                eyebrow="OurOrbit"
                title="Achievements"
                subtitle="Track milestones and unlock exclusive rewards."
                compact
              />
            </AnimatedScreen>

            <AnimatedScreen delay={80}>
              <AppCard
                style={
                  styles.summaryCard
                }
              >
                <View
                  style={[
                    styles.summaryGlowGold,
                    {
                      backgroundColor:
                        `${
                          c.gold ||
                          c.primary
                        }18`,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.summaryGlowCyan,
                    {
                      backgroundColor:
                        c.surfaceGlow ||
                        `${
                          c.cyan ||
                          c.primary
                        }10`,
                    },
                  ]}
                />

                <View
                  style={
                    styles.summaryTop
                  }
                >
                  <View
                    style={
                      styles.summaryCopy
                    }
                  >
                    <Text
                      style={[
                        styles.summaryLabel,
                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      Achievement
                      Progress
                    </Text>

                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color:
                            c.text,
                        },
                      ]}
                    >
                      {
                        earnedCount
                      }{" "}
                      / {total}
                    </Text>

                    <Text
                      style={[
                        styles.summarySub,
                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      {
                        progressMessage
                      }
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.summaryIcon,
                      {
                        borderColor:
                          c.border,

                        backgroundColor:
                          `${
                            c.gold ||
                            c.primary
                          }18`,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="trophy-award"
                      size={36}
                      color={
                        c.gold ||
                        c.primary
                      }
                    />
                  </View>
                </View>

                <OrbitProgressBar
                  percent={
                    completionPercent
                  }
                  style={
                    styles.progressBar
                  }
                  color={
                    c.gold ||
                    c.primary
                  }
                  glow
                />
              </AppCard>
            </AnimatedScreen>
          </View>
        }
        ListEmptyComponent={
          <AnimatedScreen delay={120}>
            <AppCard
              style={
                styles.emptyCard
              }
            >
              <EmptyState
                title="No achievements yet"
                description="Complete habits, tasks, and rewards to unlock badges."
                icon={
                  <Feather
                    name="award"
                    size={42}
                    color={
                      c.gold ||
                      c.primary
                    }
                  />
                }
              />
            </AppCard>
          </AnimatedScreen>
        }
        renderItem={({
          item,
          index,
        }) => {
          if (
            item.type ===
            "header"
          ) {
            return (
              <AnimatedScreen delay={120}>
                <CategoryHeader
                  category={
                    item.category
                  }
                />
              </AnimatedScreen>
            );
          }

          return (
            <AnimatedCard
              index={index}
            >
              <AchievementCard
                achievement={
                  item.item
                }
              />
            </AnimatedCard>
          );
        }}
    />
  </View>
);
}
function CategoryHeader({
  category,
}) {
  const { theme } =
    useTheme();

  const c = theme.colors;

  const icon =
    CATEGORY_ICONS[
      category
    ] || "sparkles";

  return (
    <View
      style={
        styles.categoryHeader
      }
    >
      <View
        style={[
          styles.categoryIconWrap,
          {
            backgroundColor:
              `${
                c.cyan ||
                c.primary
              }12`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={
            c.cyan ||
            c.primary
          }
        />
      </View>

      <Text
        style={[
          styles.categoryTitle,
          {
            color: c.text,
          },
        ]}
      >
        {category}
      </Text>

      <View
        style={[
          styles.categoryLine,
          {
            backgroundColor:
              c.divider ||
              c.border,
          },
        ]}
      />
    </View>
  );
}

function AchievementCard({
  achievement,
}) {
  const { theme } =
    useTheme();

  const c = theme.colors;

  const themeReward =
    THEME_REWARDS[
      achievement.id
    ];

  const earned =
    !!achievement.earned;

  const newlyEarned =
    !!achievement.newly_earned;

  const locked =
    !earned;

  const rarity = earned
    ? c.success
    : c.cyan || c.primary;

  return (
    <AppCard
      style={[
        styles.card,

        locked && {
          opacity: 0.82,
        },

        earned && {
          borderColor:
            c.success,
        },

        newlyEarned && {
          borderColor:
            c.cyan ||
            c.primary,
        },
      ]}
    >
      <View
        style={[
          styles.cardGlow,
          {
            backgroundColor:
              earned
                ? `${c.success}14`
                : `${
                    c.cyan ||
                    c.primary
                  }10`,
          },
        ]}
      />

      <View
        style={
          styles.cardTop
        }
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor:
                earned
                  ? `${c.success}16`
                  : c.surfaceAlt,

              borderColor:
                earned
                  ? c.success
                  : c.border,
            },
          ]}
        >
          <Feather
            name={
              earned
                ? "award"
                : "lock"
            }
            size={24}
            color={
              earned
                ? c.success
                : c.textMuted ||
                  c.muted
            }
          />
        </View>

        <View
          style={
            styles.cardText
          }
        >
          <View
            style={
              styles.nameRow
            }
          >
            <Text
              style={[
                styles.name,
                {
                  color:
                    c.text,
                },
              ]}
            >
              {
                achievement.name
              }
            </Text>

            {newlyEarned ? (
              <View
                style={[
                  styles.newBadge,
                  {
                    borderColor:
                      c.cyan ||
                      c.primary,

                    backgroundColor:
                      c.cyan ||
                      c.primary,
                  },
                ]}
              >
                <Text
                  style={
                    styles.newBadgeText
                  }
                >
                  New
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              styles.description,
              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            {
              achievement.description
            }
          </Text>
        </View>
      </View>

      <View
        style={
          styles.progressSection
        }
      >
        <View
          style={
            styles.progressTop
          }
        >
          <Text
            style={[
              styles.progressLabel,
              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            {
              achievement.raw_progress
            }{" "}
            /{" "}
            {
              achievement.target
            }
          </Text>

          <Text
            style={[
              styles.progressLabel,
              {
                color:
                  rarity,
              },
            ]}
          >
            {earned
              ? "Unlocked"
              : `${
                  achievement.percent ||
                  0
                }%`}
          </Text>
        </View>

        <OrbitProgressBar
          percent={
            achievement.percent ||
            0
          }
          color={rarity}
        />
      </View>

      <View
        style={
          styles.metaRow
        }
      >
        <MetaPill
          icon="trending-up"
          text={`${
            achievement.raw_progress ||
            0
          } progress`}
        />

        <MetaPill
          icon={
            earned
              ? "check-circle"
              : "clock"
          }
          text={
            earned
              ? "Completed"
              : "In Progress"
          }
          highlight
          color={rarity}
        />

        {themeReward ? (
          <MetaPill
            icon="palette"
            text={`Unlocks ${themeReward}`}
            highlight
            color={
              c.gold ||
              c.primary
            }
          />
        ) : null}
      </View>
    </AppCard>
  );
}