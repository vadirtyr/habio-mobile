import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { api } from "../../lib/api";

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchAchievements() {
    try {
      const data = await api.get("/achievements");

      setAchievements(data.items || []);
      setEarnedCount(data.earned_count || 0);
      setTotal(data.total || 0);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAchievements();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAchievements();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchAchievements}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Progress</Text>
            <Text style={styles.title}>Achievements</Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Earned badges</Text>
              <Text style={styles.summaryValue}>
                {earnedCount} / {total}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No achievements yet</Text>
            <Text style={styles.emptyText}>
              Complete habits, tasks, and rewards to unlock badges.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.earned && styles.earnedCard]}>
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.iconCircle,
                  item.earned && styles.iconCircleEarned,
                ]}
              >
                <Text style={styles.iconText}>{item.earned ? "🏆" : "🔒"}</Text>
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
                  item.earned && styles.progressEarned,
                ]}
              />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaPill}>
                {item.raw_progress || 0} / {item.target}
              </Text>

              <Text style={[styles.statusPill, item.earned && styles.statusDone]}>
                {item.earned ? "Unlocked" : `${item.percent || 0}%`}
              </Text>
            </View>
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
  summaryCard: {
    marginTop: 18,
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 18,
  },
  summaryLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  summaryValue: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
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
  earnedCard: {
    borderColor: "#FACC15",
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
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleEarned: {
    backgroundColor: "#FEF3C7",
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
  progressEarned: {
    backgroundColor: "#FACC15",
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
  statusPill: {
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "900",
    fontSize: 12,
  },
  statusDone: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },
});