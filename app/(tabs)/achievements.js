import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import ThemedCard from "../../components/ThemedCard";
import ThemedText from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";

export default function AchievementsScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();

  const [achievements, setAchievements] = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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
        data={achievements}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchAchievements}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Progress" title="Achievements" />

            <ThemedCard style={styles.summaryCard}>
              <ThemedText muted style={styles.summaryLabel}>
                Earned Badges
              </ThemedText>
              <ThemedText style={styles.summaryValue}>
                {earnedCount} / {total}
              </ThemedText>
              <ThemedText muted style={styles.summarySub}>
                Keep stacking wins.
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
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <ThemedCard
              style={[
                styles.card,
                item.earned && { borderColor: theme.colors.success },
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: item.earned
                        ? theme.colors.success
                        : theme.colors.surfaceAlt,
                      borderColor: item.earned
                        ? theme.colors.success
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={item.earned ? "award" : "lock"}
                    size={22}
                    color={
                      item.earned
                        ? theme.colors.primaryText
                        : theme.colors.muted
                    }
                  />
                </View>

                <View style={styles.cardText}>
                  <ThemedText style={styles.name}>{item.name}</ThemedText>
                  <ThemedText muted style={styles.description}>
                    {item.description}
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
                      width: `${item.percent || 0}%`,
                      backgroundColor: item.earned
                        ? theme.colors.success
                        : theme.colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.metaPill,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Feather
                    name="trending-up"
                    size={14}
                    color={theme.colors.muted}
                  />
                  <ThemedText muted style={styles.metaText}>
                    {item.raw_progress || 0} / {item.target}
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: item.earned
                        ? theme.colors.success
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={item.earned ? "check-circle" : "clock"}
                    size={14}
                    color={
                      item.earned ? theme.colors.success : theme.colors.primary
                    }
                  />
                  <ThemedText
                    style={[
                      styles.statusText,
                      {
                        color: item.earned
                          ? theme.colors.success
                          : theme.colors.primary,
                      },
                    ]}
                  >
                    {item.earned ? "Unlocked" : `${item.percent || 0}%`}
                  </ThemedText>
                </View>
              </View>
            </ThemedCard>
          </AnimatedCard>
        )}
      />
    </View>
  );
}

function AnimatedCard({ children, index = 0 }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(index * 55, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(index * 55, withTiming(0, { duration: 260 }));
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
    marginTop: 4,
    fontWeight: "700",
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
  name: {
    fontSize: 18,
    fontWeight: "900",
  },
  description: {
    marginTop: 4,
    lineHeight: 20,
    fontWeight: "600",
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
});