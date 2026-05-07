import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BrandHeader } from "../../components/BrandMark";
import { api } from "../../lib/api";
import { colors, radii, shadows, spacing } from "../../lib/theme";

export default function QuestsScreen() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function fetchQuests() {
    try {
      const data = await api.get("/quests");
      setQuests(data.items || []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function claimQuest(quest) {
    try {
      const data = await api.post(`/quests/${quest.id}/claim`);

      setMessage(`+${data.coins_earned} coins claimed`);
      fetchQuests();

      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  useEffect(() => {
    fetchQuests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchQuests();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading quests...</Text>
      </View>
    );
  }

  const claimableCount = quests.filter((q) => q.claimable && !q.claimed).length;

  return (
    <View style={styles.container}>
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchQuests}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Daily & Weekly" title="Quests" />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Ready to Claim</Text>
              <Text style={styles.summaryValue}>{claimableCount}</Text>
              <Text style={styles.summarySub}>
                Complete quests to boost your coins.
              </Text>
            </View>

            <RewardToast message={message} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No quests available</Text>
            <Text style={styles.emptyText}>
              Complete habits and tasks to make progress.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <View
              style={[
                styles.card,
                item.completed && styles.completedCard,
                item.claimable && !item.claimed && styles.claimableCard,
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconCircle,
                    item.completed && styles.iconCircleComplete,
                  ]}
                >
                  <Text style={styles.iconText}>
                    {item.claimed ? "✅" : item.claimable ? "🎯" : "🚩"}
                  </Text>
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
                    item.completed && styles.progressComplete,
                  ]}
                />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaPill}>
                  {item.progress || 0} / {item.target}
                </Text>
                <Text style={styles.metaPill}>🪙 {item.reward}</Text>
                <Text style={styles.metaPill}>
                  {item.period === "daily" ? "Daily" : "Weekly"}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.claimButton,
                  item.claimable && !item.claimed && styles.claimButtonReady,
                  (!item.claimable || item.claimed) && styles.claimButtonDisabled,
                ]}
                disabled={!item.claimable || item.claimed}
                onPress={() => claimQuest(item)}
              >
                <Text
                  style={[
                    styles.claimButtonText,
                    item.claimable && !item.claimed && styles.claimButtonTextReady,
                  ]}
                >
                  {item.claimed
                    ? "Claimed"
                    : item.claimable
                    ? "Claim Reward"
                    : "In Progress"}
                </Text>
              </Pressable>
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

function RewardToast({ message }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (message) {
      opacity.value = withTiming(1, { duration: 180 });
      scale.value = withSequence(withSpring(1.08), withSpring(1));
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [message]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, animatedStyle]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
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

  toast: {
    marginTop: 12,
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderColor: colors.accent,
    borderWidth: 1,
    padding: 12,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  toastText: {
    color: colors.accent,
    fontWeight: "900",
  },

  emptyCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
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
  completedCard: {
    backgroundColor: colors.surfaceElevated,
  },
  claimableCard: {
    borderColor: colors.accent,
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
  iconCircleComplete: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderColor: colors.accent,
  },
  iconText: {
    fontSize: 23,
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
  progressComplete: {
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
    color: colors.textMuted,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    fontWeight: "900",
    fontSize: 12,
  },

  claimButton: {
    marginTop: 14,
    backgroundColor: colors.surfaceElevated,
    padding: 14,
    borderRadius: radii.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  claimButtonReady: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  claimButtonDisabled: {
    opacity: 0.75,
  },
  claimButtonText: {
    color: colors.textMuted,
    fontWeight: "900",
  },
  claimButtonTextReady: {
    color: colors.textDark,
  },
});