import { router, useFocusEffect } from "expo-router";
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
import { api } from "../../lib/api";

export default function RewardsScreen() {
  const [rewards, setRewards] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

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
      setMessage(`Redeemed: ${reward.name}`);
      fetchRewards();

      setTimeout(() => setMessage(null), 2200);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  function confirmDeleteReward(reward) {
    Alert.alert(
      "Delete reward?",
      `Delete “${reward.name}”?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteReward(reward),
        },
      ]
    );
  }

  async function deleteReward(reward) {
    const previous = rewards;

    setRewards((current) => current.filter((r) => r.id !== reward.id));

    try {
      await api.delete(`/rewards/${reward.id}`);

      setMessage("Reward deleted");
      setTimeout(() => setMessage(null), 1800);
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
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchRewards}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Spend</Text>
            <Text style={styles.title}>Rewards</Text>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Coin balance</Text>
              <Text style={styles.balanceValue}>{balance}</Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/create-reward")}
            >
              <Text style={styles.addButtonText}>+ Add Reward</Text>
            </Pressable>

            {message && <Text style={styles.message}>{message}</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No rewards yet</Text>
            <Text style={styles.emptyText}>Add something worth earning.</Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/create-reward")}
            >
              <Text style={styles.emptyButtonText}>Create Reward</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconCircle}>
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
              <Text style={styles.metaPill}>🪙 {item.cost} coins</Text>
              <Text style={styles.metaPill}>
                Redeemed {item.times_redeemed || 0}x
              </Text>
            </View>

            <Pressable
              style={[
                styles.redeemButton,
                balance < item.cost && styles.redeemButtonDisabled,
              ]}
              disabled={balance < item.cost}
              onPress={() => redeemReward(item)}
            >
              <Text style={styles.redeemButtonText}>
                {balance >= item.cost ? "Redeem" : "Not enough coins"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.editButton}
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
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={() => confirmDeleteReward(item)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
    paddingHorizontal: 20,
    backgroundColor: "#F6F7FB",
  },
  listContent: {
    paddingBottom: 110,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F6F7FB",
  },
  loadingText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  header: {
    marginBottom: 6,
  },
  eyebrow: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#111827",
    marginTop: 2,
  },
  balanceCard: {
    marginTop: 18,
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 18,
  },
  balanceLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  balanceValue: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },
  addButton: {
    marginTop: 14,
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  message: {
    marginTop: 12,
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: 12,
    borderRadius: 14,
    textAlign: "center",
    fontWeight: "900",
  },
  emptyCard: {
    marginTop: 16,
    backgroundColor: "white",
    padding: 22,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "900",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#FCE7F3",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 22,
  },
  cardText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  description: {
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  metaPill: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "800",
    fontSize: 12,
  },
  redeemButton: {
    marginTop: 14,
    backgroundColor: "#111827",
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  redeemButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  redeemButtonText: {
    color: "white",
    fontWeight: "900",
  },
  editButton: {
    marginTop: 12,
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  editButtonText: {
    color: "#111827",
    fontWeight: "900",
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#B91C1C",
    fontWeight: "900",
  },
});