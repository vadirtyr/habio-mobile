import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AnimatedScreen } from "../components/AnimatedScreen";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { BrandHeader } from "../components/BrandMark";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { SkeletonCard } from "../components/SkeletonCard";

import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function ActivityScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function loadActivity() {
    setError(null);

    try {
      const data = await api.get("/activity");
      setItems(data?.items || []);
    } catch (error) {
      setError(error?.message || "Unable to load activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadActivity();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadActivity();
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View style={styles.container}>
          <BrandHeader
            eyebrow="OurOrbit"
            title="Activity"
            subtitle="Loading your recent momentum..."
            compact
          />

          <SkeletonCard lines={2} />
          <SkeletonCard />
          <SkeletonCard />
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
            title="Activity"
            subtitle="Your recent orbit history."
            compact
          />

          <ErrorState
            title="Activity unavailable"
            description={error}
            onRetry={loadActivity}
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
            title="Activity"
            subtitle="Your recent orbit history."
            compact
          />

          {items.length === 0 ? (
            <AppCard style={styles.emptyCard}>
              <EmptyState
                title="No activity yet"
                description="Complete habits, tasks, quests, or unlock achievements to start building your activity history."
                icon={
                  <MaterialCommunityIcons
                    name="timeline-clock-outline"
                    size={42}
                    color={c.cyan || c.primary}
                  />
                }
              />

              <AppButton
                title="Go to Dashboard"
                onPress={() => router.push("/(tabs)/dashboard")}
              />
            </AppCard>
          ) : (
            <View style={styles.feed}>
              {items.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </View>
          )}
        </ScrollView>
      </AnimatedScreen>
    </View>
  );
}

function ActivityItem({ item }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const meta = getActivityMeta(item, c);

  return (
    <AppCard style={styles.itemCard}>
      <View style={styles.itemRow}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: `${meta.color}14`,
              borderColor: `${meta.color}40`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={meta.icon}
            size={24}
            color={meta.color}
          />
        </View>

        <View style={styles.itemCopy}>
          <Text style={[styles.itemTitle, { color: c.text }]}>
            {meta.title}
          </Text>

          <Text style={[styles.itemText, { color: c.textSecondary }]}>
            {meta.description}
          </Text>

          <Text style={[styles.itemTime, { color: c.textMuted || c.muted }]}>
            {formatActivityTime(item.created_at)}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

function getActivityMeta(item, c) {
  switch (item.type) {
    case "habit_complete":
      return {
        icon: "repeat",
        color: c.cyan || c.primary,
        title: "Habit completed",
        description: `${item.habit_name || "A habit"} completed${
          item.streak ? ` • ${item.streak} day streak` : ""
        }${item.coins ? ` • +${item.coins} coins` : ""}`,
      };

    case "task_complete":
      return {
        icon: "checkbox-marked-circle-outline",
        color: c.success || c.primary,
        title: "Task completed",
        description: `${item.task_name || "A task"} completed${
          item.coins ? ` • +${item.coins} coins` : ""
        }`,
      };

    case "quest_complete":
      return {
        icon: "flag-checkered",
        color: c.gold || c.primary,
        title: "Quest completed",
        description: `${item.quest_name || "A quest"} claimed${
          item.coins ? ` • +${item.coins} coins` : ""
        }`,
      };

    case "achievement_unlock":
      return {
        icon: "trophy-outline",
        color: c.gold || c.primary,
        title: "Achievement unlocked",
        description: item.achievement_name || "New achievement earned",
      };

    case "avatar_unlock":
      return {
        icon: "account-star-outline",
        color: c.coral || c.primary,
        title: "Avatar unlocked",
        description: item.avatar_name || "New avatar available",
      };

    case "level_up":
      return {
        icon: "star-four-points",
        color: c.cyan || c.primary,
        title: "Level up",
        description: `Reached Level ${item.level || "?"}`,
      };

    default:
      return {
        icon: "orbit",
        color: c.primary,
        title: "Activity",
        description: item.type || "Orbit activity",
      };
  }
}

function formatActivityTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  feed: {
    gap: spacing.md,
  },

  itemCard: {
    padding: spacing.lg,
  },

  itemRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  itemCopy: {
    flex: 1,
  },

  itemTitle: {
    ...typography.bodyBold,
  },

  itemText: {
    ...typography.body,
    marginTop: spacing.xs,
    lineHeight: 20,
  },

  itemTime: {
    ...typography.caption,
    marginTop: spacing.sm,
    fontWeight: "800",
  },

  emptyCard: {
    alignItems: "center",
  },
});