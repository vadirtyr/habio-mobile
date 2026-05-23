import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { BrandHeader } from "../../components/BrandMark";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { OrbitProgressBar } from "../../components/OrbitProgressBar";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";
import { radii, spacing, typography } from "../../lib/theme";

export default function RewardsScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [rewards, setRewards] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [redeemedReward, setRedeemedReward] = useState(null);

  const firstBalanceLoad = useRef(true);
  const coinScale = useSharedValue(1);

  const coinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinScale.value }],
  }));

  useEffect(() => {
    if (firstBalanceLoad.current) {
      firstBalanceLoad.current = false;
      return;
    }

    coinScale.value = withSequence(
      withSpring(1.1, { damping: 12, stiffness: 260 }),
      withSpring(1, { damping: 14, stiffness: 240 })
    );
  }, [balance]);

  const sortedRewards = useMemo(() => {
    return [...rewards].sort((a, b) => {
      const aRedeemable = balance >= a.cost;
      const bRedeemable = balance >= b.cost;

      if (aRedeemable === bRedeemable) {
        return a.cost - b.cost;
      }

      return aRedeemable ? -1 : 1;
    });
  }, [rewards, balance]);

  const redeemableCount = useMemo(
    () => rewards.filter((reward) => balance >= reward.cost).length,
    [rewards, balance]
  );

  async function fetchRewards() {
  if (!token) return;

  setError(null);

  try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance || 0);

      const data = await api.get("/rewards", token);
      setRewards(Array.isArray(data) ? data : []);
    } catch (error) {
  setError(error?.message || "Unable to load rewards.");
} finally {
  setLoading(false);
  setRefreshing(false);
}
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchRewards();
    setRefreshing(false);
  }

  async function redeemReward(reward) {
    if (!token) return;

    if (balance < reward.cost) {
      Alert.alert(
        "Not enough coins",
        `You need ${reward.cost - balance} more coins.`
      );
      return;
    }

    try {
      const data = await api.post(`/rewards/${reward.id}/redeem`, {}, token);

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      setBalance(data.new_balance);
      setRedeemedReward(reward);
      setMessage(`Redeemed: ${reward.name}`);

      fetchRewards();

      setTimeout(() => setMessage(null), 2200);
      setTimeout(() => setRedeemedReward(null), 2200);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  function confirmDeleteReward(reward) {
    Alert.alert("Delete reward?", `Delete “${reward.name}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteReward(reward),
      },
    ]);
  }

  async function deleteReward(reward) {
    if (!token) return;

    const previous = rewards;
    setRewards((current) => current.filter((r) => r.id !== reward.id));

    try {
      await api.delete(`/rewards/${reward.id}`, token);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

      setMessage("Reward deleted");
      setTimeout(() => setMessage(null), 1600);
    } catch (error) {
      setRewards(previous);
      Alert.alert("Error", error.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchRewards();
    }, [token])
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <BrandHeader
          eyebrow="OurOrbit"
          title="Rewards"
          subtitle="Loading rewards..."
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
        title="Rewards"
        subtitle="Spend coins on things worth earning."
        compact
      />

      <ErrorState
        title="Rewards unavailable"
        description={error}
        onRetry={fetchRewards}
      />
    </View>
  );
}
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <RedeemCelebration reward={redeemedReward} />

      <FlatList
        data={sortedRewards}
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
                title="Rewards"
                subtitle="Spend coins on things worth earning."
                compact
              />
            </AnimatedScreen>

            <AnimatedScreen delay={80}>
              <AppCard style={styles.heroCard}>
                <View
                  style={[
                    styles.heroGlowGold,
                    { backgroundColor: `${c.gold || c.primary}18` },
                  ]}
                />
                <View
                  style={[
                    styles.heroGlowCoral,
                    { backgroundColor: `${c.coral || c.primary}10` },
                  ]}
                />

                <View style={styles.heroTop}>
                  <View style={styles.heroCopy}>
                    <Text style={[styles.heroEyebrow, { color: c.textSecondary }]}>
                      Available Coins
                    </Text>

                    <Text style={[styles.heroValue, { color: c.text }]}>
                      {balance}
                    </Text>

                    <Text style={[styles.heroSubtitle, { color: c.textSecondary }]}>
                      {redeemableCount > 0
                        ? `${redeemableCount} reward${
                            redeemableCount === 1 ? "" : "s"
                          } ready to redeem`
                        : "Keep building momentum"}
                    </Text>
                  </View>

                  <Animated.View
                    style={[
                      styles.coinCircle,
                      {
                        backgroundColor: `${c.gold || c.primary}18`,
                        borderColor: c.border,
                      },
                      coinAnimatedStyle,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="gift-outline"
                      size={34}
                      color={c.gold || c.primary}
                    />
                  </Animated.View>
                </View>

                <View style={styles.heroActions}>
                  <AppButton
                    title="Add Reward"
                    style={styles.heroButton}
                    onPress={() => router.push("/create-reward")}
                  />
                </View>
              </AppCard>
            </AnimatedScreen>

            <RewardToast message={message} />

            {rewards.length > 0 ? (
              <AnimatedScreen delay={120}>
                <SectionTitle
                  title="Reward Shop"
                  subtitle="Earn it. Redeem it."
                />
              </AnimatedScreen>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <AnimatedScreen delay={120}>
            <AppCard style={styles.emptyCard}>
              <EmptyState
                title="No rewards yet"
                description="Add rewards that genuinely motivate you."
                icon={
                  <MaterialCommunityIcons
                    name="gift-outline"
                    size={42}
                    color={c.gold || c.primary}
                  />
                }
              />

              <AppButton
                title="Create Reward"
                onPress={() => router.push("/create-reward")}
              />
            </AppCard>
          </AnimatedScreen>
        }
        renderItem={({ item, index }) => {
          const canRedeem = balance >= item.cost;
          const rarity = getRewardTier(item.cost, c);
          const shortBy = Math.max(0, item.cost - balance);
          const progress =
            item.cost > 0
              ? Math.min(100, Math.round((balance / item.cost) * 100))
              : 100;

          return (
            <AnimatedCard index={index}>
              <RewardCard
                item={item}
                canRedeem={canRedeem}
                rarity={rarity}
                balance={balance}
                shortBy={shortBy}
                progress={progress}
                onRedeem={() => redeemReward(item)}
                onDelete={() => confirmDeleteReward(item)}
                onEdit={() =>
                  router.push({
                    pathname: "/edit-reward",
                    params: {
                      id: item.id,
                      name: item.name,
                      description: item.description || "",
                      cost: String(item.cost),
                      icon: item.icon || "gift",
                    },
                  })
                }
              />
            </AnimatedCard>
          );
        }}
      />
    </View>
  );
}

function RewardCard({
  item,
  canRedeem,
  rarity,
  balance,
  shortBy,
  progress,
  onRedeem,
  onEdit,
  onDelete,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const cardScale = useSharedValue(1);
  const glowScale = useSharedValue(0.95);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const lockedLabel =
    shortBy <= 25 ? "Almost there" : `${shortBy} coins short`;

  function handleRedeem() {
    if (!canRedeem) return;

    cardScale.value = withSequence(
      withSpring(1.025, { damping: 12, stiffness: 260 }),
      withSpring(1, { damping: 15, stiffness: 240 })
    );

    glowScale.value = withSequence(
      withTiming(1.12, { duration: 160 }),
      withTiming(0.95, { duration: 260 })
    );

    onRedeem();
  }

  return (
    <Animated.View
      style={[
        cardAnimatedStyle,
        !canRedeem && styles.lockedRewardWrap,
      ]}
    >
      <AppCard
        style={[
          styles.card,
          !canRedeem && {
            borderColor: c.border,
            backgroundColor: c.surfaceAlt,
          },
          canRedeem && { borderColor: rarity.color },
        ]}
      >
        <Animated.View
          style={[
            styles.rarityGlow,
            {
              backgroundColor: `${rarity.color}15`,
            },
            glowAnimatedStyle,
          ]}
        />

        <View style={styles.cardTop}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: canRedeem
                  ? `${rarity.color}18`
                  : c.surfaceAlt,
                borderColor: canRedeem ? rarity.color : c.border,
              },
            ]}
          >
            <Feather
              name={canRedeem ? "gift" : "lock"}
              size={22}
              color={canRedeem ? rarity.color : c.textMuted || c.muted}
            />
          </View>

          <View style={styles.cardCopy}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: c.text }]}>{item.name}</Text>

              <CompactPill text={rarity.label} color={rarity.color} highlight />
            </View>

            {!!item.description && (
              <Text style={[styles.description, { color: c.textSecondary }]}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.metaRow}>
          <CompactPill
            icon="circle"
            text={`${item.cost} coins`}
            highlight
            color={rarity.color}
          />

          <CompactPill
            icon="repeat"
            text={`${item.times_redeemed || 0} redeemed`}
          />
        </View>

        {!canRedeem ? (
          <View style={styles.unlockProgress}>
            <View style={styles.unlockProgressTop}>
              <Text style={[styles.unlockText, { color: c.textSecondary }]}>
                {balance} / {item.cost} coins
              </Text>

              <Text style={[styles.unlockText, { color: c.textSecondary }]}>
                {lockedLabel}
              </Text>
            </View>

            <OrbitProgressBar percent={progress} />
          </View>
        ) : null}

        <AnimatedPressable
          style={[
            styles.redeemButton,
            {
              backgroundColor: canRedeem ? rarity.color : c.surfaceAlt,
              borderColor: canRedeem ? rarity.color : c.border,
            },
          ]}
          disabled={!canRedeem}
          onPress={handleRedeem}
          scaleTo={0.965}
        >
          <Feather
            name={canRedeem ? "shopping-bag" : "lock"}
            size={17}
            color={canRedeem ? "#FFFFFF" : c.textMuted || c.muted}
          />

          <Text
            style={[
              styles.redeemButtonText,
              {
                color: canRedeem ? "#FFFFFF" : c.textMuted || c.muted,
              },
            ]}
          >
            {canRedeem ? "Redeem Reward" : lockedLabel}
          </Text>
        </AnimatedPressable>

        <View style={styles.bottomRow}>
          <AnimatedPressable
            style={[
              styles.smallButton,
              {
                backgroundColor: c.surfaceAlt,
                borderColor: c.border,
              },
            ]}
            onPress={onEdit}
          >
            <Feather name="edit-3" size={15} color={c.text} />
          </AnimatedPressable>

          <AnimatedPressable
            style={[
              styles.smallButton,
              {
                borderColor: `${c.danger}30`,
                backgroundColor: `${c.danger}10`,
              },
            ]}
            onPress={onDelete}
          >
            <Feather name="trash-2" size={15} color={c.danger} />
          </AnimatedPressable>
        </View>
      </AppCard>
    </Animated.View>
  );
}

function CompactPill({ icon = null, text, color = null, highlight = false }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const pillColor = color || c.textMuted || c.muted;

  return (
    <View
      style={[
        styles.compactPill,
        {
          backgroundColor: highlight ? `${pillColor}12` : c.surfaceAlt,
          borderColor: highlight ? pillColor : c.border,
        },
      ]}
    >
      {icon ? <Feather name={icon} size={13} color={pillColor} /> : null}

      <Text
        style={[
          styles.compactPillText,
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

function getRewardTier(cost = 0, c) {
  if (cost >= 500) {
    return {
      label: "Legendary",
      color: c.gold,
    };
  }

  if (cost >= 250) {
    return {
      label: "Epic",
      color: c.blue || c.primary,
    };
  }

  if (cost >= 100) {
    return {
      label: "Rare",
      color: c.success,
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

function RedeemCelebration({ reward }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);
  const glowScale = useSharedValue(0.8);

  useEffect(() => {
    if (reward) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withSpring(0);
      scale.value = withSequence(withSpring(1.12), withSpring(1));
      glowScale.value = withSequence(
        withTiming(1.08, { duration: 260 }),
        withTiming(1, { duration: 260 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 160 });
      translateY.value = withTiming(28, { duration: 160 });
      scale.value = withTiming(0.55, { duration: 160 });
      glowScale.value = withTiming(0.8, { duration: 160 });
    }
  }, [reward]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  if (!reward) return null;

  return (
    <Modal visible transparent animationType="none">
      <View style={styles.celebrationOverlay}>
        <Animated.View
          style={[
            styles.celebrationCard,
            {
              borderColor: c.success,
              backgroundColor: c.surface,
            },
            animatedStyle,
          ]}
        >
          <Animated.View
            style={[
              styles.celebrationGlow,
              { backgroundColor: `${c.success}16` },
              glowAnimatedStyle,
            ]}
          />

          <View
            style={[
              styles.celebrationIconCircle,
              { backgroundColor: c.success },
            ]}
          >
            <Feather name="gift" size={38} color="#FFFFFF" />
          </View>

          <Text style={[styles.celebrationEyebrow, { color: c.success }]}>
            Reward Redeemed
          </Text>

          <Text style={[styles.celebrationTitle, { color: c.text }]}>
            {reward.name}
          </Text>

          <Text style={[styles.celebrationText, { color: c.textSecondary }]}>
            Nice work. You earned this.
          </Text>
        </Animated.View>
      </View>
    </Modal>
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

  heroCard: {
    overflow: "hidden",
  },

  heroGlowGold: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    top: -130,
    right: -90,
  },

  heroGlowCoral: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  heroCopy: {
    flex: 1,
  },

  heroEyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  heroValue: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: spacing.xs,
  },

  heroSubtitle: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
  },

  coinCircle: {
    width: 86,
    height: 86,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  heroActions: {
    marginTop: spacing.xl,
  },

  heroButton: {
    alignSelf: "flex-start",
    minWidth: 150,
  },

  toast: {
    marginTop: spacing.md,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },

  toastText: {
    ...typography.bodyBold,
    textAlign: "center",
  },

  emptyCard: {
    marginTop: spacing.xl,
    alignItems: "center",
  },

  lockedRewardWrap: {
    opacity: 0.84,
  },

  card: {
    marginBottom: spacing.md,
    overflow: "hidden",
  },

  rarityGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: radii.pill,
    top: -110,
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

  cardCopy: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  name: {
    flex: 1,
    ...typography.h3,
  },

  description: {
    ...typography.body,
    marginTop: spacing.sm,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  unlockProgress: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  unlockProgressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  unlockText: {
    ...typography.caption,
    fontWeight: "800",
  },

  compactPill: {
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
  },

  compactPillText: {
    fontWeight: "900",
    fontSize: 12,
  },

  redeemButton: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 1,
  },

  redeemButtonText: {
    ...typography.bodyBold,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  smallButton: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },

  celebrationCard: {
    width: "100%",
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    alignItems: "center",
    overflow: "hidden",
  },

  celebrationGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -150,
  },

  celebrationIconCircle: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  celebrationEyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  celebrationTitle: {
    ...typography.h1,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  celebrationText: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});