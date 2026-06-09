import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppCard } from "../components/AppCard";
import { EmptyState } from "../components/EmptyState";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function WeeklyRecapScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [recaps, setRecaps] = useState([]);
  const [latestRecap, setLatestRecap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadRecaps() {
    try {
      const data = await api.getWeeklyRecaps();
      const items = data.items || [];

      setRecaps(items);
      setLatestRecap(items[0] || null);
    } catch (error) {
      Alert.alert(
        "Weekly recap unavailable",
        error.message || "Unable to load your weekly recap."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  
   useFocusEffect(
  useCallback(() => {
    async function load() {
      try {
        await api.generateWeeklyRecap();
      } catch (error) {
        // ignore duplicate recap errors
        console.log(error);
      }

      await loadRecaps();
    }

    load();
  }, [])
);

    async function refresh() {
        setRefreshing(true);

        try {
            await api.generateWeeklyRecap();
        } catch (error) {
          console.log(error);
        }

        await loadRecaps();
    }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.primary}
          />
        }
      >
        <Text style={[styles.eyebrow, { color: c.primary }]}>
          OurOrbit
        </Text>

        <Text style={[styles.title, { color: c.text }]}>
          Weekly Recap
        </Text>

        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          See how your orbit grew over the last week.
        </Text>


        {loading ? (
          <AppCard>
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>
              Loading your recap...
            </Text>
          </AppCard>
        ) : latestRecap ? (
          <>
            <AppCard>
              <View style={styles.recapHeader}>
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: `${c.primary}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="chart-line"
                    size={28}
                    color={c.primary}
                  />
                </View>

                <View style={styles.recapHeaderText}>
                  <Text style={[styles.cardTitle, { color: c.text }]}>
                    {latestRecap.week_start} → {latestRecap.week_end}
                  </Text>

                  <Text style={[styles.cardCopy, { color: c.textSecondary }]}>
                    Your latest progress snapshot.
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <StatTile
                  label="Habits"
                  value={latestRecap.habits_completed}
                  icon="repeat"
                  color={c.cyan || c.primary}
                  themeColors={c}
                />

                <StatTile
                  label="Tasks"
                  value={latestRecap.tasks_completed}
                  icon="checkbox-marked-circle-outline"
                  color={c.coral || c.primary}
                  themeColors={c}
                />

                <StatTile
                  label="Quests"
                  value={latestRecap.quests_completed}
                  icon="flag-checkered"
                  color={c.primary}
                  themeColors={c}
                />

                <StatTile
                  label="Coins"
                  value={latestRecap.coins_earned}
                  icon="circle-multiple-outline"
                  color={c.gold || c.primary}
                  themeColors={c}
                />

                <StatTile
                  label="XP"
                  value={latestRecap.xp_earned}
                  icon="star-four-points-outline"
                  color={c.primary}
                  themeColors={c}
                />

                <StatTile
                  label="Achievements"
                  value={latestRecap.achievements_unlocked}
                  icon="trophy-outline"
                  color={c.success || c.primary}
                  themeColors={c}
                />
              </View>

              {latestRecap.level_ups > 0 && (
                <View
                  style={[
                    styles.levelUpBanner,
                    {
                      backgroundColor: `${c.primary}15`,
                      borderColor: c.primary,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="rocket-launch-outline"
                    size={22}
                    color={c.primary}
                  />

                  <Text style={[styles.levelUpText, { color: c.text }]}>
                    You leveled up {latestRecap.level_ups} time
                    {latestRecap.level_ups === 1 ? "" : "s"} this week.
                  </Text>
                </View>
              )}
            </AppCard>

            {recaps.length > 1 && (
              <View style={styles.historySection}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>
                  Past Recaps
                </Text>

                {recaps.slice(1).map((recap) => (
                  <AppCard key={recap.id} style={styles.historyCard}>
                    <Text style={[styles.historyTitle, { color: c.text }]}>
                      {recap.week_start} → {recap.week_end}
                    </Text>

                    <Text style={[styles.historyCopy, { color: c.textSecondary }]}>
                      {recap.habits_completed} habits · {recap.tasks_completed} tasks ·{" "}
                      {recap.coins_earned} coins
                    </Text>
                  </AppCard>
                ))}
              </View>
            )}
          </>
        ) : (
          <AppCard>
            <EmptyState
              title="No weekly recap yet."
              description="Generate your first recap to see this week's progress."
              icon={
                <MaterialCommunityIcons
                  name="chart-timeline-variant"
                  size={42}
                  color={c.primary}
                />
              }
            />
          </AppCard>
        )}
      </ScrollView>
    </View>
  );
}

function StatTile({ label, value, icon, color, themeColors }) {
  const c = themeColors;

  return (
    <View
      style={[
        styles.statTile,
        {
          backgroundColor: c.surfaceAlt,
          borderColor: c.border,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />

      <Text style={[styles.statValue, { color: c.text }]}>
        {value || 0}
      </Text>

      <Text style={[styles.statLabel, { color: c.textSecondary }]}>
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

  eyebrow: {
    ...typography.label,
    marginBottom: spacing.xs,
  },

  title: {
    ...typography.h1,
  },

  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  generateButton: {
    marginBottom: spacing.lg,
  },

  loadingText: {
    ...typography.body,
  },

  recapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  recapHeaderText: {
    flex: 1,
  },

  cardTitle: {
    ...typography.h3,
  },

  cardCopy: {
    ...typography.body,
    marginTop: spacing.xs,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  statTile: {
    width: "47%",
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },

  statValue: {
    ...typography.h2,
    marginTop: spacing.sm,
  },

  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },

  levelUpBanner: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  levelUpText: {
    flex: 1,
    ...typography.bodyBold,
  },

  historySection: {
    marginTop: spacing.xl,
  },

  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },

  historyCard: {
    marginBottom: spacing.md,
  },

  historyTitle: {
    ...typography.bodyBold,
  },

  historyCopy: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});