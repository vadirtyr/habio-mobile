import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { AppCard } from "../../components/AppCard";
import { BrandHeader } from "../../components/BrandMark";
import { EmptyState } from "../../components/EmptyState";
import { OrbitProgressBar } from "../../components/OrbitProgressBar";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";
import { radii, spacing, typography } from "../../lib/theme";

export default function QuestsScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);
  const [claimedQuest, setClaimedQuest] = useState(null);

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

  async function handleRefresh() {
    setRefreshing(true);
    await fetchQuests();
    setRefreshing(false);
  }

  async function claimQuest(quest) {
    if (!token) return;

    try {
      const data = await api.post(`/quests/${quest.id}/claim`, {}, token);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      setClaimedQuest({
        ...quest,
        coins_earned: data.coins_earned,
      });

      setMessage(`+${data.coins_earned} coins claimed`);

      await fetchQuests();

      setTimeout(() => setMessage(null), 2200);
      setTimeout(() => setClaimedQuest(null), 2200);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchQuests();
    }, [token])
  );

  const sortedQuests = useMemo(() => {
    return [...quests].sort((a, b) => {
      const aClaimable = a.claimable && !a.claimed;
      const bClaimable = b.claimable && !b.claimed;

      if (aClaimable === bClaimable) {
        return (b.percent || 0) - (a.percent || 0);
      }

      return aClaimable ? -1 : 1;
    });
  }, [quests]);

  const claimableCount = useMemo(
    () => quests.filter((q) => q.claimable && !q.claimed).length,
    [quests]
  );

  const completedCount = useMemo(
    () => quests.filter((q) => q.completed || q.claimed).length,
    [quests]
  );

  const questMessage =
    claimableCount > 0
      ? `${claimableCount} reward${claimableCount === 1 ? "" : "s"} ready`
      : quests.length > 0 && completedCount === quests.length
      ? "All quests completed"
      : "Keep building momentum";

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <BrandHeader
          eyebrow="OurOrbit"
          title="Quests"
          subtitle="Loading quests..."
          compact
        />

        <SkeletonCard lines={2} />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard compact />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <QuestCelebrationModal quest={claimedQuest} />

      <FlatList
        data={sortedQuests}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <AnimatedScreen delay={40}>
              <BrandHeader
                eyebrow="OurOrbit"
                title="Quests"
                subtitle="Complete challenges and earn bonus rewards."
                compact
              />
            </AnimatedScreen>

            <AnimatedScreen delay={80}>
              <AppCard style={styles.summaryCard}>
                <View
                  style={[
                    styles.summaryGlowPrimary,
                    {
                      backgroundColor:
                        c.surfaceGlow || `${c.cyan || c.primary}16`,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.summaryGlowSecondary,
                    {
                      backgroundColor: `${c.success || c.primary}10`,
                    },
                  ]}
                />

                <View style={styles.summaryTop}>
                  <View style={styles.summaryCopy}>
                    <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
                      Quest Momentum
                    </Text>

                    <Text style={[styles.summaryValue, { color: c.text }]}>
                      {claimableCount}
                    </Text>

                    <Text style={[styles.summarySub, { color: c.textSecondary }]}>
                      {questMessage}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.summaryIcon,
                      {
                        backgroundColor: `${c.cyan || c.primary}16`,
                        borderColor: c.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="sword-cross"
                      size={34}
                      color={c.cyan || c.primary}
                    />
                  </View>
                </View>

                <View
                  style={[
                    styles.summaryStats,
                    {
                      borderTopColor: c.divider || c.border,
                    },
                  ]}
                >
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: c.text }]}>
                      {completedCount}
                    </Text>

                    <Text
                      style={[
                        styles.summaryStatLabel,
                        { color: c.textMuted || c.muted },
                      ]}
                    >
                      Completed
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.summaryDivider,
                      {
                        backgroundColor: c.divider || c.border,
                      },
                    ]}
                  />

                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: c.text }]}>
                      {quests.length}
                    </Text>

                    <Text
                      style={[
                        styles.summaryStatLabel,
                        { color: c.textMuted || c.muted },
                      ]}
                    >
                      Total Quests
                    </Text>
                  </View>
                </View>
              </AppCard>
            </AnimatedScreen>

            <RewardToast message={message} />

            {quests.length > 0 ? (
              <AnimatedScreen delay={120}>
                <SectionTitle
                  title="Active Quests"
                  action={
                    <Text
                      style={[
                        styles.sectionHint,
                        { color: c.textMuted || c.muted },
                      ]}
                    >
                      Daily & Weekly
                    </Text>
                  }
                />
              </AnimatedScreen>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <AnimatedScreen delay={120}>
            <AppCard style={styles.emptyCard}>
              <EmptyState
                title="No quests available"
                description="Complete habits and tasks to unlock challenges."
                icon={
                  <Feather
                    name="flag"
                    size={42}
                    color={c.cyan || c.primary}
                  />
                }
              />
            </AppCard>
          </AnimatedScreen>
        }
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <QuestCard item={item} onClaim={() => claimQuest(item)} />
          </AnimatedCard>
        )}
      />
    </View>
  );
}

function QuestCard({ item, onClaim }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const completed = item.completed || item.claimed;
  const claimable = item.claimable && !item.claimed;
  const rarity = getQuestTier(item.reward, c);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (claimable) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 900 }),
          withTiming(1, { duration: 900 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 180 });
    }
  }, [claimable]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[pulseStyle, completed && styles.completedQuestWrap]}>
      <AppCard
        style={[
          styles.card,
          claimable && {
            borderColor: rarity.color,
          },
        ]}
      >
        <View
          style={[
            styles.cardGlow,
            {
              backgroundColor: claimable
                ? `${rarity.color}18`
                : `${rarity.color}12`,
            },
          ]}
        />

        <View style={styles.cardTop}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: completed
                  ? `${c.success}16`
                  : `${rarity.color}14`,
                borderColor: completed ? c.success : rarity.color,
              },
            ]}
          >
            <Feather
              name={item.claimed ? "check-circle" : claimable ? "target" : "flag"}
              size={22}
              color={completed ? c.success : rarity.color}
            />
          </View>

          <View style={styles.cardText}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: c.text }]}>{item.name}</Text>

              <QuestTierPill rarity={rarity} />
            </View>

            <Text style={[styles.description, { color: c.textSecondary }]}>
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.progressTop}>
          <Text style={[styles.progressLabel, { color: c.textSecondary }]}>
            {item.progress || 0} / {item.target}
          </Text>

          <Text
            style={[
              styles.progressLabel,
              {
                color: completed ? c.success : rarity.color,
              },
            ]}
          >
            {completed ? "Completed" : `${item.percent || 0}%`}
          </Text>
        </View>

        <OrbitProgressBar percent={item.percent || 0} color={rarity.color} />

        <View style={styles.metaRow}>
          <MetaPill
            icon="gift"
            text={`${item.reward} coins`}
            highlight
            color={rarity.color}
          />

          <MetaPill
            icon="calendar"
            text={item.period === "daily" ? "Daily" : "Weekly"}
          />

          <MetaPill
            icon="zap"
            text={claimable ? "Ready" : item.claimed ? "Claimed" : "Progress"}
            highlight={claimable}
            color={claimable ? c.success : c.textMuted || c.muted}
          />
        </View>

        <AnimatedPressable
          style={[
            styles.claimButton,
            {
              backgroundColor: claimable ? rarity.color : c.surfaceAlt,
              borderColor: claimable ? rarity.color : c.border,
              opacity: !claimable || item.claimed ? 0.78 : 1,
            },
          ]}
          disabled={!claimable || item.claimed}
          onPress={onClaim}
        >
          <Feather
            name={item.claimed ? "check-circle" : claimable ? "gift" : "clock"}
            size={17}
            color={claimable ? "#FFFFFF" : c.textMuted || c.muted}
          />

          <Text
            style={[
              styles.claimButtonText,
              {
                color: claimable ? "#FFFFFF" : c.textMuted || c.muted,
              },
            ]}
          >
            {item.claimed
              ? "Claimed"
              : claimable
              ? "Claim Reward"
              : "In Progress"}
          </Text>
        </AnimatedPressable>
      </AppCard>
    </Animated.View>
  );
}

function QuestTierPill({ rarity }) {
  return (
    <View
      style={[
        styles.tierPill,
        {
          backgroundColor: `${rarity.color}12`,
          borderColor: rarity.color,
        },
      ]}
    >
      <Text style={[styles.tierPillText, { color: rarity.color }]}>
        {rarity.label}
      </Text>
    </View>
  );
}

function MetaPill({ icon, text, highlight = false, color = null }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const pillColor = color || c.textMuted || c.muted;

  return (
    <View
      style={[
        styles.metaPill,
        {
          backgroundColor: highlight ? `${pillColor}12` : c.surfaceAlt,
          borderColor: highlight ? pillColor : c.border,
        },
      ]}
    >
      <Feather
        name={icon}
        size={13}
        color={highlight ? pillColor : c.textMuted || c.muted}
      />

      <Text
        style={[
          styles.metaText,
          {
            color: highlight ? pillColor : c.textSecondary,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function QuestCelebrationModal({ quest }) {
  const { theme } = useTheme();
  const c = theme.colors;

  if (!quest) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              borderColor: c.success,
              backgroundColor: c.surface,
            },
          ]}
        >
          <View
            style={[
              styles.modalGlow,
              {
                backgroundColor: `${c.success}14`,
              },
            ]}
          />

          <View
            style={[
              styles.modalIconCircle,
              {
                backgroundColor: c.success,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="sword-cross"
              size={40}
              color="#FFFFFF"
            />
          </View>

          <Text style={[styles.modalEyebrow, { color: c.success }]}>
            Quest Complete
          </Text>

          <Text style={[styles.modalTitle, { color: c.text }]}>
            {quest.name}
          </Text>

          <Text style={[styles.modalText, { color: c.textSecondary }]}>
            +{quest.coins_earned} coins earned
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getQuestTier(reward = 0, c) {
  if (reward >= 250) {
    return {
      label: "Legendary",
      color: c.gold,
    };
  }

  if (reward >= 100) {
    return {
      label: "Epic",
      color: c.coral || c.warning,
    };
  }

  if (reward >= 50) {
    return {
      label: "Rare",
      color: c.cyan || c.primary,
    };
  }

  return {
    label: "Common",
    color: c.textMuted || c.muted,
  };
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
  const { theme } = useTheme();
  const c = theme.colors;

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
        {
          backgroundColor: `${c.success}12`,
          borderColor: c.success,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.toastText, { color: c.success }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  listContent: {
    paddingBottom: 120,
  },

  summaryCard: {
    overflow: "hidden",
  },

  summaryGlowPrimary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    top: -130,
    right: -90,
  },

  summaryGlowSecondary: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryCopy: {
    flex: 1,
  },

  summaryLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  summaryValue: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: spacing.xs,
  },

  summarySub: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
  },

  summaryStats: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },

  summaryStat: {
    alignItems: "center",
  },

  summaryStatValue: {
    fontSize: 22,
    fontWeight: "900",
  },

  summaryStatLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },

  summaryDivider: {
    width: 1,
    height: 36,
  },

  summaryIcon: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  sectionHint: {
    ...typography.caption,
  },

  toast: {
    marginTop: spacing.md,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
  },

  toastText: {
    ...typography.bodyBold,
  },

  emptyCard: {
    marginTop: spacing.xl,
    alignItems: "center",
  },

  completedQuestWrap: {
    opacity: 0.82,
  },

  card: {
    marginBottom: spacing.md,
    overflow: "hidden",
  },

  cardGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: radii.pill,
    top: -100,
    right: -70,
  },

  cardTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  cardText: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  name: {
    flex: 1,
    ...typography.h3,
  },

  description: {
    ...typography.body,
    marginTop: spacing.xs,
  },

  tierPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
  },

  tierPillText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  progressLabel: {
    ...typography.caption,
    fontWeight: "900",
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
  },

  metaText: {
    fontWeight: "900",
    fontSize: 12,
  },

  claimButton: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
  },

  claimButtonText: {
    ...typography.bodyBold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.76)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },

  modalCard: {
    width: "100%",
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    overflow: "hidden",
  },

  modalGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    top: -140,
  },

  modalIconCircle: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  modalEyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  modalTitle: {
    ...typography.h1,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  modalText: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
  },
});