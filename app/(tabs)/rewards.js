import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

export default function RewardsScreen() {
  const [rewards, setRewards] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [redeemedReward, setRedeemedReward] = useState(null);

  async function fetchRewards() {
    try {
      const statsData = await api.get("/stats");
      setBalance(statsData.coin_balance);

      const data = await api.get("/rewards");
      setRewards(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function redeemReward(reward) {
    if (balance < reward.cost) {
      Alert.alert("Not enough coins", `You need ${reward.cost - balance} more coins.`);
      return;
    }

    try {
      const data = await api.post(`/rewards/${reward.id}/redeem`);

      setBalance(data.new_balance);
      setRedeemedReward(reward);
      setMessage(`Redeemed: ${reward.name}`);

      fetchRewards();

      setTimeout(() => setMessage(null), 2000);
      setTimeout(() => setRedeemedReward(null), 1800);
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
    const previous = rewards;
    setRewards((current) => current.filter((r) => r.id !== reward.id));

    try {
      await api.delete(`/rewards/${reward.id}`);
      setMessage("Reward deleted");
      setTimeout(() => setMessage(null), 1600);
    } catch (error) {
      setRewards(previous);
      Alert.alert("Error", error.message);
    }
  }

  useEffect(() => {
    fetchRewards();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRewards();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading rewards...</Text>
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
        ListHeaderComponent={
          <View>
            <BrandHeader eyebrow="Spend" title="Rewards" />

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Coins</Text>
              <Text style={styles.balanceValue}>{balance}</Text>
              <Text style={styles.balanceSub}>Earn it. Spend it well.</Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/create-reward")}
            >
              <Text style={styles.addButtonText}>+ Add Reward</Text>
            </Pressable>

            <RewardToast message={message} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No rewards yet</Text>
            <Text style={styles.emptyText}>
              Add something worth working toward.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/create-reward")}
            >
              <Text style={styles.emptyButtonText}>Create Reward</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const canRedeem = balance >= item.cost;

          return (
            <AnimatedCard index={index}>
              <View style={[styles.card, !canRedeem && styles.lockedCard]}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconCircle, canRedeem && styles.iconReady]}>
                    <Text style={styles.iconText}>🎁</Text>
                  </View>

                  <View style={styles.cardText}>
                    <Text style={styles.name}>{item.name}</Text>
                    {!!item.description && (
                      <Text style={styles.description}>{item.description}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaPill}>🪙 {item.cost}</Text>
                  <Text style={styles.metaPill}>
                    {item.times_redeemed || 0} redeemed
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.redeemButton,
                    !canRedeem && styles.redeemButtonDisabled,
                  ]}
                  disabled={!canRedeem}
                  onPress={() => redeemReward(item)}
                >
                  <Text
                    style={[
                      styles.redeemButtonText,
                      !canRedeem && styles.redeemButtonTextDisabled,
                    ]}
                  >
                    {canRedeem ? "Redeem Reward" : `${item.cost - balance} coins short`}
                  </Text>
                </Pressable>

                <View style={styles.secondaryRow}>
                  <Pressable
                    style={styles.secondaryButton}
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
                    <Text style={styles.secondaryText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => confirmDeleteReward(item)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </AnimatedCard>
          );
        }}
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

function RedeemCelebration({ reward }) {
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
        <Animated.View style={[styles.celebrationCard, animatedStyle]}>
          <Text style={styles.celebrationIcon}>🎉</Text>
          <Text style={styles.celebrationTitle}>Reward Redeemed</Text>
          <Text style={styles.celebrationName}>{reward.name}</Text>
          <Text style={styles.celebrationText}>Nice work. You earned this.</Text>
        </Animated.View>
      </View>
    </Modal>
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

  balanceCard: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryBright,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.glow,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  balanceValue: {
    color: "white",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 4,
  },
  balanceSub: {
    color: "rgba(255,255,255,0.78)",
    marginTop: 4,
    fontWeight: "700",
  },

  addButton: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.textDark,
    fontWeight: "900",
    fontSize: 16,
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
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radii.md,
  },
  emptyButtonText: {
    color: colors.textDark,
    fontWeight: "900",
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
  lockedCard: {
    opacity: 0.72,
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
  iconReady: {
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

  redeemButton: {
    marginTop: 14,
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  redeemButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  redeemButtonText: {
    color: colors.textDark,
    fontWeight: "900",
    fontSize: 15,
  },
  redeemButtonTextDisabled: {
    color: colors.textMuted,
  },

  secondaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: radii.md,
    alignItems: "center",
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "900",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    padding: 12,
    borderRadius: radii.md,
    alignItems: "center",
  },
  deleteText: {
    color: colors.danger || "#EF4444",
    fontWeight: "900",
  },

  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  celebrationCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    ...shadows.glow,
  },
  celebrationIcon: {
    fontSize: 54,
    marginBottom: spacing.sm,
  },
  celebrationTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  celebrationName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  celebrationText: {
    color: colors.textMuted,
    fontWeight: "700",
    marginTop: spacing.sm,
    textAlign: "center",
  },
});