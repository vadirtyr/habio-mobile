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
import { api } from "../../lib/api";

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

      setTimeout(() => setMessage(null), 2200);
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
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading quests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchQuests}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Daily & weekly</Text>
            <Text style={styles.title}>Quests</Text>

            {message && <Text style={styles.message}>{message}</Text>}
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🚩</Text>
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
              <Text style={styles.metaPill}>🪙 {item.reward} reward</Text>
              <Text style={styles.metaPill}>
                {item.period === "daily" ? "Daily" : "Weekly"}
              </Text>
            </View>

            <Pressable
              style={[
                styles.claimButton,
                (!item.claimable || item.claimed) && styles.claimButtonDisabled,
              ]}
              disabled={!item.claimable || item.claimed}
              onPress={() => claimQuest(item)}
            >
              <Text style={styles.claimButtonText}>
                {item.claimed
                  ? "Claimed"
                  : item.claimable
                  ? "Claim Reward"
                  : "In Progress"}
              </Text>
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
    marginBottom: 8,
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
    backgroundColor: "#E0F2FE",
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
  progressOuter: {
    marginTop: 14,
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    backgroundColor: "#60A5FA",
    borderRadius: 999,
  },
  progressComplete: {
    backgroundColor: "#16A34A",
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
  claimButton: {
    marginTop: 14,
    backgroundColor: "#2563EB",
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  claimButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  claimButtonText: {
    color: "white",
    fontWeight: "900",
  },
});