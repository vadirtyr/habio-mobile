import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import ThemedText from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";

export default function RewardsScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();

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
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator color={theme.colors.primary} />

        <ThemedText muted style={styles.loadingText}>
          Loading rewards...
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <RedeemCelebration reward={redeemedReward} theme={theme} />

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchRewards}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Reward Yourself" title="Rewards" />

            <ThemedCard style={styles.heroCard}>
              <View
                style={[
                  styles.heroGlow,
                  { backgroundColor: `${theme.colors.primary}18` },
                ]}
              />

              <View style={styles.heroTop}>
                <View style={styles.heroCopy}>
                  <ThemedText muted style={styles.heroEyebrow}>
                    Available Coins
                  </ThemedText>

                  <ThemedText style={styles.heroValue}>
                    {balance}
                  </ThemedText>

                  <ThemedText muted style={styles.heroSubtitle}>
                    {redeemableCount > 0
                      ? `${redeemableCount} reward${
                          redeemableCount === 1 ? "" : "s"
                        } ready to redeem`
                      : "Keep building momentum"}
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.coinCircle,
                    { backgroundColor: theme.colors.surfaceAlt },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="gift-outline"
                    size={34}
                    color={theme.colors.primary}
                  />
                </View>
              </View>

              <View style={styles.heroActions}>
                <ThemedButton
                  style={styles.heroButton}
                  onPress={() => router.push("/create-reward")}
                >
                  Add Reward
                </ThemedButton>
              </View>
            </ThemedCard>

            <RewardToast message={message} theme={theme} />

            {rewards.length > 0 && (
              <View style={styles.sectionHeader}>
                <ThemedText variant="section">
                  Reward Shop
                </ThemedText>

                <ThemedText muted style={styles.sectionHint}>
                  Spend your coins on things worth earning.
                </ThemedText>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <ThemedCard style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="gift-outline"
              size={40}
              color={theme.colors.primary}
            />

            <ThemedText variant="section" style={styles.emptyTitle}>
              No rewards yet
            </ThemedText>

            <ThemedText muted style={styles.emptyText}>
              Add rewards that genuinely motivate you.
            </ThemedText>

            <ThemedButton onPress={() => router.push("/create-reward")}>
              Create Reward
            </ThemedButton>
          </ThemedCard>
        }
        renderItem={({ item, index }) => {
          const canRedeem = balance >= item.cost;
          const rarity = getRewardTier(item.cost);

          return (
            <AnimatedCard index={index}>
              <ThemedCard
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
                          : theme.colors.surfaceAlt,
                        borderColor: canRedeem
                          ? rarity.color
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={canRedeem ? "gift" : "lock"}
                      size={22}
                      color={canRedeem ? rarity.color : theme.colors.textMuted}
                    />
                  </View>

                  <View style={styles.cardCopy}>
                    <View style={styles.nameRow}>
                      <ThemedText style={styles.name}>
                        {item.name}
                      </ThemedText>

                      <CompactPill
                        theme={theme}
                        text={rarity.label}
                        color={rarity.color}
                        highlight
                      />
                    </View>

                    {!!item.description && (
                      <ThemedText muted style={styles.description}>
                        {item.description}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <CompactPill
                    theme={theme}
                    icon="circle"
                    text={`${item.cost} coins`}
                    highlight
                    color={rarity.color}
                  />

                  <CompactPill
                    theme={theme}
                    icon="repeat"
                    text={`${item.times_redeemed || 0} redeemed`}
                  />
                </View>

                <AnimatedPressable
                  style={[
                    styles.redeemButton,
                    {
                      backgroundColor: canRedeem
                        ? rarity.color
                        : theme.colors.surfaceAlt,
                      borderColor: canRedeem
                        ? rarity.color
                        : theme.colors.border,
                    },
                  ]}
                  disabled={!canRedeem}
                  onPress={() => redeemReward(item)}
                >
                  <Feather
                    name={canRedeem ? "shopping-bag" : "lock"}
                    size={17}
                    color={
                      canRedeem
                        ? theme.colors.primaryText
                        : theme.colors.textMuted
                    }
                  />

                  <ThemedText
                    style={[
                      styles.redeemButtonText,
                      {
                        color: canRedeem
                          ? theme.colors.primaryText
                          : theme.colors.textMuted,
                      },
                    ]}
                  >
                    {canRedeem
                      ? "Redeem Reward"
                      : `${item.cost - balance} coins short`}
                  </ThemedText>
                </AnimatedPressable>

                <View style={styles.bottomRow}>
                  <AnimatedPressable
                    style={[
                      styles.smallButton,
                      {
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() =>
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
                  >
                    <Feather
                      name="edit-3"
                      size={15}
                      color={theme.colors.text}
                    />
                  </AnimatedPressable>

                  <AnimatedPressable
                    style={[
                      styles.smallButton,
                      {
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.danger,
                      },
                    ]}
                    onPress={() => confirmDeleteReward(item)}
                  >
                    <Feather
                      name="trash-2"
                      size={15}
                      color={theme.colors.danger}
                    />
                  </AnimatedPressable>
                </View>
              </ThemedCard>
            </AnimatedCard>
          );
        }}
      />
    </View>
  );
}

function CompactPill({
  theme,
  icon = null,
  text,
  color = null,
  highlight = false,
}) {
  const pillColor = color || theme.colors.textMuted;

  return (
    <View
      style={[
        styles.compactPill,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: highlight ? pillColor : theme.colors.border,
        },
      ]}
    >
      {icon && <Feather name={icon} size={13} color={pillColor} />}

      <ThemedText
        muted={!highlight}
        style={[styles.compactPillText, highlight && { color: pillColor }]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

function getRewardTier(cost = 0) {
  if (cost >= 500) {
    return {
      label: "Legendary",
      color: "#F59E0B",
    };
  }

  if (cost >= 250) {
    return {
      label: "Epic",
      color: "#8B5CF6",
    };
  }

  if (cost >= 100) {
    return {
      label: "Rare",
      color: "#10B981",
    };
  }

  return {
    label: "Common",
    color: "#94A3B8",
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

function RedeemCelebration({ reward, theme }) {
  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    if (reward) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withSpring(0);
      scale.value = withSequence(withSpring(1.15), withSpring(1));
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(30, { duration: 180 });
      scale.value = withTiming(0.55, { duration: 180 });
    }
  }, [reward]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!reward) return null;

  return (
    <Modal visible transparent animationType="none">
      <View style={styles.celebrationOverlay}>
        <Animated.View
          style={[
            styles.celebrationCard,
            animatedStyle,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.success,
            },
          ]}
        >
          <View
            style={[
              styles.celebrationIconCircle,
              { backgroundColor: theme.colors.success },
            ]}
          >
            <Feather name="gift" size={38} color={theme.colors.primaryText} />
          </View>

          <ThemedText
            style={[styles.celebrationEyebrow, { color: theme.colors.success }]}
          >
            Reward Redeemed
          </ThemedText>

          <ThemedText style={styles.celebrationTitle}>
            {reward.name}
          </ThemedText>

          <ThemedText muted style={styles.celebrationText}>
            Nice work. You earned this.
          </ThemedText>
        </Animated.View>
      </View>
    </Modal>
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

  heroCard: {
    marginTop: 16,
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -130,
    right: -90,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },

  heroCopy: {
    flex: 1,
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  heroValue: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: 4,
  },

  heroSubtitle: {
    marginTop: 6,
    lineHeight: 20,
    fontWeight: "700",
  },

  coinCircle: {
    width: 86,
    height: 86,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  heroActions: {
    marginTop: 20,
  },

  heroButton: {
    alignSelf: "flex-start",
    minWidth: 150,
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

  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
  },

  sectionHint: {
    marginTop: 4,
    lineHeight: 18,
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
    marginBottom: 16,
    lineHeight: 20,
  },

  card: {
    marginBottom: 14,
    overflow: "hidden",
  },

  rarityGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -110,
    right: -70,
  },

  lockedCard: {
    opacity: 0.7,
  },

  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 999,
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
    gap: 10,
  },

  name: {
    flex: 1,
    fontSize: 19,
    fontWeight: "900",
  },

  description: {
    marginTop: 6,
    lineHeight: 20,
    fontWeight: "600",
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  compactPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },

  compactPillText: {
    fontWeight: "900",
    fontSize: 12,
  },

  redeemButton: {
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
  },

  redeemButtonText: {
    fontWeight: "900",
    fontSize: 15,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },

  smallButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  celebrationCard: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },

  celebrationIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  celebrationEyebrow: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  celebrationTitle: {
    fontSize: 30,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },

  celebrationText: {
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
});