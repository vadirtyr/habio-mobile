import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { BrandHeader } from "../../components/BrandMark";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors, radii, shadows, spacing } from "../../lib/theme";

export default function AchievementsScreen() {
  const { token } = useAuth();

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
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchAchievements}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Progress" title="Achievements" />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Earned Badges</Text>
              <Text style={styles.summaryValue}>
                {earnedCount} / {total}
              </Text>
              <Text style={styles.summarySub}>Keep stacking wins.</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Feather name="award" size={36} color={colors.accent} />
            <Text style={styles.emptyTitle}>No achievements yet</Text>
            <Text style={styles.emptyText}>
              Complete habits, tasks, and rewards to unlock badges.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <View style={[styles.card, item.earned && styles.earnedCard]}>
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconCircle,
                    item.earned && styles.iconCircleEarned,
                  ]}
                >
                  <Feather
                    name={item.earned ? "award" : "lock"}
                    size={22}
                    color={item.earned ? colors.textDark : colors.textMuted}
                  />
                </View>

                <View style={styles.cardText}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              </View>

              <View style={styles.progressOuter}>
                <View
                  style={[
                    styles.progressInner,
                    { width: `${item.percent || 0}%` },
                    item.earned && styles.progressEarned,
                  ]}
                />
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Feather
                    name="trending-up"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>
                    {item.raw_progress || 0} / {item.target}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    item.earned && styles.statusDone,
                  ]}
                >
                  <Feather
                    name={item.earned ? "check-circle" : "clock"}
                    size={14}
                    color={item.earned ? colors.accent : colors.primaryBright}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      item.earned && styles.statusDoneText,
                    ]}
                  >
                    {item.earned ? "Unlocked" : `${item.percent || 0}%`}
                  </Text>
                </View>
              </View>
            </View>
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
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
    color: colors.textMuted,
    marginTop: 10,
    fontWeight: "700",
  },

  summaryCard: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryBright,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.glow,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "white",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 4,
  },
  summarySub: {
    color: "rgba(255,255,255,0.78)",
    marginTop: 4,
    fontWeight: "700",
  },

  emptyCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },

  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.xl,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  earnedCard: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
  },

  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircleEarned: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  cardText: {
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  description: {
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
    fontWeight: "600",
  },

  progressOuter: {
    marginTop: 14,
    height: 10,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    backgroundColor: colors.primaryBright,
    borderRadius: radii.pill,
  },
  progressEarned: {
    backgroundColor: colors.accent,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  metaPill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: colors.textMuted,
    fontWeight: "900",
    fontSize: 12,
  },

  statusPill: {
    backgroundColor: "rgba(37, 99, 235, 0.18)",
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDone: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
  },
  statusText: {
    color: colors.primaryBright,
    fontWeight: "900",
    fontSize: 12,
  },
  statusDoneText: {
    color: colors.accent,
  },
});