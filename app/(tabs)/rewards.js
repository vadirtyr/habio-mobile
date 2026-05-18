import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors, radii, spacing, typography } from "../../lib/theme";

export default function RewardsScreen() {
  const { token } = useAuth();

  const [rewards, setRewards] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [redeemedReward, setRedeemedReward] = useState(null);

  const redeemableCount = useMemo(
    () => rewards.filter((reward) => balance >= reward.cost).length,
    [rewards, balance]
  );

  async function fetchRewards() {
    if (!token) return;

    try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance || 0);

      const data = await api.get("/rewards", token);
      setRewards(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
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
      setTimeout(() => setRedeemedReward(null), 2000);
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

  useEffect(() => {
    fetchRewards();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchRewards();
    }, [token])
  );

  if (loading) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Rewards"
        subtitle="Loading rewards..."
      />

      <SkeletonCard lines={2} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard compact />
    </View>
  );
}

  return (
    <View style={styles.container}>
      <RedeemCelebration reward={redeemedReward} />

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchRewards}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title="Rewards"
              subtitle="Spend coins on things worth earning."
            />

            <AppCard style={styles.heroCard}>
              <View style={styles.heroGlowGold} />
              <View style={styles.heroGlowCoral} />

              <View style={styles.heroTop}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>Available Coins</Text>

                  <Text style={styles.heroValue}>{balance}</Text>

                  <Text style={styles.heroSubtitle}>
                    {redeemableCount > 0
                      ? `${redeemableCount} reward${
                          redeemableCount === 1 ? "" : "s"
                        } ready to redeem`
                      : "Keep building momentum"}
                  </Text>
                </View>

                <View style={styles.coinCircle}>
                  <MaterialCommunityIcons
                    name="gift-outline"
                    size={34}
                    color={colors.gold}
                  />
                </View>
              </View>

              <View style={styles.heroActions}>
                <AppButton
                  title="Add Reward"
                  style={styles.heroButton}
                  onPress={() => router.push("/create-reward")}
                />
              </View>
            </AppCard>

            <RewardToast message={message} />

            {rewards.length > 0 ? (
              <SectionTitle
                title="Reward Shop"
                action={
                  <Text style={styles.sectionHint}>
                    Earn it. Redeem it.
                  </Text>
                }
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <AppCard style={styles.emptyCard}>
            <EmptyState
              title="No rewards yet"
              description="Add rewards that genuinely motivate you."
              icon={
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={42}
                  color={colors.gold}
                />
              }
            />

            <AppButton
              title="Create Reward"
              onPress={() => router.push("/create-reward")}
            />
          </AppCard>
        }
        renderItem={({ item, index }) => {
          const canRedeem = balance >= item.cost;
          const rarity = getRewardTier(item.cost);

          return (
            <AnimatedCard index={index}>
              <RewardCard
                item={item}
                canRedeem={canRedeem}
                rarity={rarity}
                balance={balance}
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
  onRedeem,
  onEdit,
  onDelete,
}) {
  return (
    <AppCard
      style={[
        styles.card,
        !canRedeem && styles.lockedCard,
        canRedeem && { borderColor: rarity.color },
      ]}
    >
      <View
        style={[
          styles.rarityGlow,
          {
            backgroundColor: `${rarity.color}15`,
          },
        ]}
      />

      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: canRedeem
                ? `${rarity.color}18`
                : colors.surfaceAlt,
              borderColor: canRedeem ? rarity.color : colors.border,
            },
          ]}
        >
          <Feather
            name={canRedeem ? "gift" : "lock"}
            size={22}
            color={canRedeem ? rarity.color : colors.textMuted}
          />
        </View>

        <View style={styles.cardCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>

            <CompactPill text={rarity.label} color={rarity.color} highlight />
          </View>

          {!!item.description && (
            <Text style={styles.description}>{item.description}</Text>
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

      <AnimatedPressable
        style={[
          styles.redeemButton,
          {
            backgroundColor: canRedeem ? rarity.color : colors.surfaceAlt,
            borderColor: canRedeem ? rarity.color : colors.border,
          },
        ]}
        disabled={!canRedeem}
        onPress={onRedeem}
      >
        <Feather
          name={canRedeem ? "shopping-bag" : "lock"}
          size={17}
          color={canRedeem ? colors.white : colors.textMuted}
        />

        <Text
          style={[
            styles.redeemButtonText,
            {
              color: canRedeem ? colors.white : colors.textMuted,
            },
          ]}
        >
          {canRedeem ? "Redeem Reward" : `${item.cost - balance} coins short`}
        </Text>
      </AnimatedPressable>

      <View style={styles.bottomRow}>
        <AnimatedPressable style={styles.smallButton} onPress={onEdit}>
          <Feather name="edit-3" size={15} color={colors.text} />
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.smallButton, styles.dangerSmallButton]}
          onPress={onDelete}
        >
          <Feather name="trash-2" size={15} color={colors.danger} />
        </AnimatedPressable>
      </View>
    </AppCard>
  );
}

function CompactPill({ icon = null, text, color = null, highlight = false }) {
  const pillColor = color || colors.textMuted;

  return (
    <View
      style={[
        styles.compactPill,
        {
          backgroundColor: highlight ? `${pillColor}12` : colors.surfaceAlt,
          borderColor: highlight ? pillColor : colors.border,
        },
      ]}
    >
      {icon ? <Feather name={icon} size={13} color={pillColor} /> : null}

      <Text
        style={[
          styles.compactPillText,
          {
            color: highlight ? pillColor : colors.textSecondary,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function getRewardTier(cost = 0) {
  if (cost >= 500) {
    return {
      label: "Legendary",
      color: colors.gold,
    };
  }

  if (cost >= 250) {
    return {
      label: "Epic",
      color: colors.blue,
    };
  }

  if (cost >= 100) {
    return {
      label: "Rare",
      color: colors.success,
    };
  }

  return {
    label: "Common",
    color: colors.textMuted,
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
  if (!message) return null;

  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

function RedeemCelebration({ reward }) {
  if (!reward) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.celebrationOverlay}>
        <View style={styles.celebrationCard}>
          <View style={styles.celebrationIconCircle}>
            <Feather name="gift" size={38} color={colors.white} />
          </View>

          <Text style={styles.celebrationEyebrow}>Reward Redeemed</Text>

          <Text style={styles.celebrationTitle}>{reward.name}</Text>

          <Text style={styles.celebrationText}>
            Nice work. You earned this.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
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
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
    backgroundColor: `${colors.gold}18`,
  },

  heroGlowCoral: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: radii.pill,
    bottom: -100,
    left: -70,
    backgroundColor: `${colors.coral}10`,
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
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  heroValue: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.text,
    marginTop: spacing.xs,
  },

  heroSubtitle: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  coinCircle: {
    width: 86,
    height: 86,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.gold}18`,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: `${colors.success}12`,
    borderColor: colors.success,
  },

  toastText: {
    ...typography.bodyBold,
    color: colors.success,
  },

  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },

  emptyCard: {
    marginTop: spacing.xl,
    alignItems: "center",
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

  lockedCard: {
    opacity: 0.72,
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
    color: colors.text,
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
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
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },

  dangerSmallButton: {
    borderColor: `${colors.danger}30`,
    backgroundColor: `${colors.danger}10`,
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
    borderColor: colors.success,
    backgroundColor: colors.surface,
    alignItems: "center",
  },

  celebrationIconCircle: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    backgroundColor: colors.success,
  },

  celebrationEyebrow: {
    ...typography.caption,
    color: colors.success,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  celebrationTitle: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  celebrationText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});