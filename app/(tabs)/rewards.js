import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

  async function fetchRewards() {
    if (!token) return;

    try {
      const statsData = await api.get("/stats", token);
      setBalance(statsData.coin_balance);

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
            <BrandHeader eyebrow="Spend" title="Rewards" />

            <ThemedCard style={styles.balanceCard}>
              <ThemedText muted style={styles.balanceLabel}>
                Available Coins
              </ThemedText>
              <ThemedText style={styles.balanceValue}>{balance}</ThemedText>
              <ThemedText muted style={styles.balanceSub}>
                Earn it. Spend it well.
              </ThemedText>
            </ThemedCard>

            <ThemedButton
              style={styles.addButton}
              onPress={() => router.push("/create-reward")}
            >
              Add Reward
            </ThemedButton>

            <RewardToast message={message} theme={theme} />
          </View>
        }
        ListEmptyComponent={
          <ThemedCard style={styles.emptyCard}>
            <Feather name="gift" size={36} color={theme.colors.primary} />

            <ThemedText variant="section" style={styles.emptyTitle}>
              No rewards yet
            </ThemedText>

            <ThemedText muted style={styles.emptyText}>
              Add something worth working toward.
            </ThemedText>

            <ThemedButton onPress={() => router.push("/create-reward")}>
              Create Reward
            </ThemedButton>
          </ThemedCard>
        }
        renderItem={({ item, index }) => {
          const canRedeem = balance >= item.cost;

          return (
            <AnimatedCard index={index}>
              <ThemedCard
                style={[
                  styles.card,
                  !canRedeem && styles.lockedCard,
                  canRedeem && { borderColor: theme.colors.success },
                ]}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: canRedeem
                          ? theme.colors.surfaceAlt
                          : theme.colors.surfaceAlt,
                        borderColor: canRedeem
                          ? theme.colors.success
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={canRedeem ? "gift" : "lock"}
                      size={22}
                      color={
                        canRedeem ? theme.colors.success : theme.colors.muted
                      }
                    />
                  </View>

                  <View style={styles.cardText}>
                    <ThemedText style={styles.name}>{item.name}</ThemedText>
                    {!!item.description && (
                      <ThemedText muted style={styles.description}>
                        {item.description}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <MetaPill
                    theme={theme}
                    icon={
                      <MaterialCommunityIcons
                        name="circle-multiple"
                        size={15}
                        color={theme.colors.muted}
                      />
                    }
                    text={`${item.cost} coins`}
                  />

                  <MetaPill
                    theme={theme}
                    icon={
                      <Feather
                        name="repeat"
                        size={14}
                        color={theme.colors.muted}
                      />
                    }
                    text={`${item.times_redeemed || 0} redeemed`}
                  />
                </View>

                <AnimatedPressable
                  style={[
                    styles.redeemButton,
                    {
                      backgroundColor: canRedeem
                        ? theme.colors.success
                        : theme.colors.surfaceAlt,
                      borderColor: canRedeem
                        ? theme.colors.success
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
                      canRedeem ? theme.colors.primaryText : theme.colors.muted
                    }
                  />
                  <ThemedText
                    style={[
                      styles.redeemButtonText,
                      {
                        color: canRedeem
                          ? theme.colors.primaryText
                          : theme.colors.muted,
                      },
                    ]}
                  >
                    {canRedeem
                      ? "Redeem Reward"
                      : `${item.cost - balance} coins short`}
                  </ThemedText>
                </AnimatedPressable>

                <View style={styles.secondaryRow}>
                  <AnimatedPressable
                    style={[
                      styles.secondaryButton,
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
                    <Feather name="edit-3" size={16} color={theme.colors.text} />
                    <ThemedText style={styles.secondaryText}>Edit</ThemedText>
                  </AnimatedPressable>

                  <AnimatedPressable
                    style={[
                      styles.deleteButton,
                      {
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.danger,
                      },
                    ]}
                    onPress={() => confirmDeleteReward(item)}
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={theme.colors.danger}
                    />
                    <ThemedText
                      style={[
                        styles.deleteText,
                        { color: theme.colors.danger },
                      ]}
                    >
                      Delete
                    </ThemedText>
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
            style={[styles.celebrationTitle, { color: theme.colors.success }]}
          >
            Reward Redeemed
          </ThemedText>
          <ThemedText style={styles.celebrationName}>{reward.name}</ThemedText>
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
  balanceCard: {
    marginTop: 14,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: 4,
  },
  balanceSub: {
    marginTop: 4,
    fontWeight: "700",
  },
  addButton: {
    marginTop: 14,
    marginBottom: 12,
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
    marginBottom: 16,
  },
  card: {
    marginBottom: 14,
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
  redeemButton: {
    marginTop: 14,
    padding: 14,
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
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    borderWidth: 1,
  },
  secondaryText: {
    fontWeight: "900",
  },
  deleteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    borderWidth: 1,
  },
  deleteText: {
    fontWeight: "900",
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
  celebrationTitle: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  celebrationName: {
    fontSize: 28,
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