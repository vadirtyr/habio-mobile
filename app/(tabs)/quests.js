import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { BrandHeader } from "../../components/BrandMark";
import ThemedCard from "../../components/ThemedCard";
import ThemedText from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";

export default function QuestsScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();

  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function fetchQuests() {
    if (!token) return;

    try {
      const data = await api.get("/quests", token);
      setQuests(data.items || []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function claimQuest(quest) {
    if (!token) return;

    try {
      const data = await api.post(`/quests/${quest.id}/claim`, {}, token);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      setMessage(`+${data.coins_earned} coins claimed`);
      fetchQuests();

      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  useEffect(() => {
    fetchQuests();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchQuests();
    }, [token])
  );

  if (loading) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <ThemedText muted style={styles.loadingText}>
          Loading quests...
        </ThemedText>
      </View>
    );
  }

  const claimableCount = quests.filter((q) => q.claimable && !q.claimed).length;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchQuests}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Daily & Weekly" title="Quests" />

            <ThemedCard style={styles.summaryCard}>
              <ThemedText muted style={styles.summaryLabel}>
                Ready to Claim
              </ThemedText>
              <ThemedText style={styles.summaryValue}>
                {claimableCount}
              </ThemedText>
              <ThemedText muted style={styles.summarySub}>
                Complete quests to boost your coins.
              </ThemedText>
            </ThemedCard>

            <RewardToast message={message} theme={theme} />
          </View>
        }
        ListEmptyComponent={
          <ThemedCard style={styles.emptyCard}>
            <Feather name="flag" size={36} color={theme.colors.primary} />
            <ThemedText variant="section" style={styles.emptyTitle}>
              No quests available
            </ThemedText>
            <ThemedText muted style={styles.emptyText}>
              Complete habits and tasks to make progress.
            </ThemedText>
          </ThemedCard>
        }
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <ThemedCard
              style={[
                styles.card,
                item.claimable &&
                  !item.claimed && {
                    borderColor: theme.colors.success,
                  },
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        item.completed || item.claimable
                          ? theme.colors.surfaceAlt
                          : theme.colors.surfaceAlt,
                      borderColor:
                        item.completed || item.claimable
                          ? theme.colors.success
                          : theme.colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={
                      item.claimed
                        ? "check-circle"
                        : item.claimable
                        ? "target"
                        : "flag"
                    }
                    size={22}
                    color={
                      item.claimed || item.claimable
                        ? theme.colors.success
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
                      backgroundColor: item.completed
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
                    <Feather
                      name="trending-up"
                      size={14}
                      color={theme.colors.muted}
                    />
                  }
                  text={`${item.progress || 0} / ${item.target}`}
                />

                <MetaPill
                  theme={theme}
                  icon={
                    <Feather
                      name="gift"
                      size={14}
                      color={theme.colors.muted}
                    />
                  }
                  text={`${item.reward} coins`}
                />

                <MetaPill
                  theme={theme}
                  icon={
                    <Feather
                      name="calendar"
                      size={14}
                      color={theme.colors.muted}
                    />
                  }
                  text={item.period === "daily" ? "Daily" : "Weekly"}
                />
              </View>

              <AnimatedPressable
                style={[
                  styles.claimButton,
                  {
                    backgroundColor:
                      item.claimable && !item.claimed
                        ? theme.colors.success
                        : theme.colors.surfaceAlt,
                    borderColor:
                      item.claimable && !item.claimed
                        ? theme.colors.success
                        : theme.colors.border,
                    opacity: !item.claimable || item.claimed ? 0.75 : 1,
                  },
                ]}
                disabled={!item.claimable || item.claimed}
                onPress={() => claimQuest(item)}
              >
                <Feather
                  name={
                    item.claimed
                      ? "check-circle"
                      : item.claimable
                      ? "gift"
                      : "clock"
                  }
                  size={17}
                  color={
                    item.claimable && !item.claimed
                      ? theme.colors.primaryText
                      : theme.colors.muted
                  }
                />
                <ThemedText
                  style={[
                    styles.claimButtonText,
                    {
                      color:
                        item.claimable && !item.claimed
                          ? theme.colors.primaryText
                          : theme.colors.muted,
                    },
                  ]}
                >
                  {item.claimed
                    ? "Claimed"
                    : item.claimable
                    ? "Claim Reward"
                    : "In Progress"}
                </ThemedText>
              </AnimatedPressable>
            </ThemedCard>
          </AnimatedCard>
        )}
      />
    </View>
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
    opacity.value = withDelay(index * 55, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(index * 55, withTiming(0, { duration: 260 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

function RewardToast({ message, theme }) {
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
    <Animated.View
      style={[
        styles.toast,
        animatedStyle,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.success,
        },
      ]}
    >
      <ThemedText style={[styles.toastText, { color: theme.colors.success }]}>
        {message}
      </ThemedText>
    </Animated.View>
  );
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
  toast: {
    marginTop: 12,
    borderWidth: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
  },
  toastText: {
    fontWeight: "900",
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
  claimButton: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
  },
  claimButtonText: {
    fontWeight: "900",
  },
});