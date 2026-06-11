import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function PublicActivityScreen() {
  const { userId, username } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reactingId, setReactingId] = useState(null);

  useEffect(() => {
    loadActivity();
  }, [userId]);

  async function loadActivity() {
    if (!userId) return;

    setLoading(true);

    try {
      const data = await api.get(`/users/${userId}/activity`);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      Alert.alert("Activity error", error.message);
    } finally {
      setLoading(false);
    }
  }

  function getActivityMeta(item) {
    switch (item.type) {
      case "habit_complete":
        return {
          icon: "check-circle",
          title: `Completed ${item.habit_name || "a habit"}`,
        };
      case "streak_milestone":
       return {
        icon: "zap",
        title: `${item.habit_name || "Habit"} reached a ${item.streak}-day streak`,
        };
      case "task_complete":
        return {
          icon: "check-square",
          title: `Completed ${item.task_name || "a task"}`,
        };

      case "quest_complete":
        return {
          icon: "map",
          title: `Completed ${item.quest_name || "a quest"}`,
        };

      case "achievement_unlock":
        return {
          icon: "award",
          title: `Unlocked achievement: ${item.achievement_name || ""}`,
        };

      case "avatar_unlock":
        return {
          icon: "user",
          title: `Unlocked avatar: ${item.avatar_name || ""}`,
        };

      case "level_up":
        return {
          icon: "star",
          title: `Reached level ${item.level || "?"}`,
        };

      case "follow_user":
        return {
          icon: "users",
          title: `Started following ${
            item.target_display_name || item.target_username || "a user"
          }`,
        };

      default:
        return {
          icon: "activity",
          title: item.type || "Activity",
        };
    }
  }

  function formatDate(value) {
    if (!value) return "";

    try {
      return new Date(value).toLocaleString();
    } catch {
      return "";
    }
  }

  function hasReaction(item, reaction) {
    return item?.reactions?.viewer_reactions?.includes(reaction);
  }

  function updateLocalReaction(activityId, reaction, active) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== activityId) return item;

        const reactions = item.reactions || {
          like: 0,
          cheer: 0,
          viewer_reactions: [],
        };

        const viewerReactions = Array.isArray(reactions.viewer_reactions)
          ? reactions.viewer_reactions
          : [];

        const alreadyActive = viewerReactions.includes(reaction);

        if (active && alreadyActive) return item;
        if (!active && !alreadyActive) return item;

        return {
          ...item,
          reactions: {
            ...reactions,
            [reaction]: Math.max(
              0,
              (reactions[reaction] || 0) + (active ? 1 : -1)
            ),
            viewer_reactions: active
              ? [...viewerReactions, reaction]
              : viewerReactions.filter((item) => item !== reaction),
          },
        };
      })
    );
  }

  async function toggleReaction(item, reaction) {
    if (!item?.id || reactingId) return;

    const active = hasReaction(item, reaction);
    const nextActive = !active;

    setReactingId(`${item.id}-${reaction}`);
    updateLocalReaction(item.id, reaction, nextActive);

    try {
      if (nextActive) {
        await api.post(`/activity/${item.id}/react`, {
          reaction,
        });
      } else {
        await api.delete(`/activity/${item.id}/react/${reaction}`);
      }
    } catch (error) {
      updateLocalReaction(item.id, reaction, active);
      Alert.alert("Reaction failed", error.message);
    } finally {
      setReactingId(null);
    }
  }

  function ReactionButton({ item, reaction, icon, label }) {
    const active = hasReaction(item, reaction);
    const count = item?.reactions?.[reaction] || 0;

    return (
      <Pressable
        onPress={() => toggleReaction(item, reaction)}
        disabled={Boolean(reactingId)}
        style={[
          styles.reactionButton,
          {
            backgroundColor: active ? `${c.primary}16` : c.surfaceAlt,
            borderColor: active ? c.primary : c.border,
            opacity: reactingId ? 0.7 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={active ? c.primary : c.textSecondary}
        />

        <Text
          style={[
            styles.reactionText,
            {
              color: active ? c.primary : c.textSecondary,
            },
          ]}
        >
          {label} {count}
        </Text>
      </Pressable>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: c.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Activity"
        subtitle={username ? `@${username}` : "Recent activity"}
      />

      {loading ? (
        <Text style={[styles.statusText, { color: c.textSecondary }]}>
          Loading activity...
        </Text>
      ) : items.length === 0 ? (
        <AppCard style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="timeline-outline"
            size={42}
            color={c.textMuted}
          />

          <Text style={[styles.emptyTitle, { color: c.text }]}>
            No activity yet
          </Text>

          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Activity will appear here as progress is made.
          </Text>
        </AppCard>
      ) : (
        <View style={styles.timeline}>
          {items.map((item, index) => {
            const meta = getActivityMeta(item);

            return (
              <AppCard key={item.id || `${item.type}-${index}`}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: `${c.primary}12`,
                      },
                    ]}
                  >
                    <Feather name={meta.icon} size={18} color={c.primary} />
                  </View>

                  <View style={styles.copy}>
                    <Text style={[styles.title, { color: c.text }]}>
                      {meta.title}
                    </Text>

                    <Text style={[styles.date, { color: c.textSecondary }]}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                </View>

                <View style={styles.reactionsRow}>
                  <ReactionButton
                    item={item}
                    reaction="like"
                    icon="heart-outline"
                    label="Like"
                  />

                  <ReactionButton
                    item={item}
                    reaction="cheer"
                    icon="hand-clap"
                    label="Cheer"
                  />
                </View>
              </AppCard>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 90,
  },

  timeline: {
    gap: spacing.md,
  },

  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  copy: {
    flex: 1,
  },

  title: {
    ...typography.bodyBold,
  },

  date: {
    ...typography.caption,
    marginTop: 4,
  },

  reactionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  reactionButton: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  reactionText: {
    ...typography.caption,
    fontWeight: "800",
  },

  emptyCard: {
    alignItems: "center",
    gap: spacing.sm,
  },

  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
  },

  emptyText: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 22,
  },

  statusText: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});