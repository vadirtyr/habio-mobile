import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { BrandHeader } from "../../components/BrandMark";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import ThemedScreen from "../../components/ThemedScreen";
import ThemedText from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";

export default function DashboardScreen() {
  const { token, logout } = useAuth();
  const { theme, themeName, setThemeName } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    coin_balance: 0,
    completed_today: 0,
    streak_days: 0,
    total_habits: 0,
    total_tasks: 0,
  });

  async function loadDashboard() {
    if (!token) return;

    try {
      const data = await api.get("/stats", token);

      setStats({
        coin_balance: data.coin_balance || 0,
        completed_today: data.completed_today || 0,
        streak_days: data.streak_days || 0,
        total_habits: data.total_habits || 0,
        total_tasks: data.total_tasks || 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [token])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ThemedScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <BrandHeader eyebrow="Overview" title="Dashboard" />

        <ThemedText muted style={styles.subtitle}>
          Track your progress, build streaks, and earn rewards.
        </ThemedText>

        <ThemedCard style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <ThemedText muted style={styles.heroLabel}>
                Coin Balance
              </ThemedText>

              <ThemedText style={styles.heroBalance}>
                {stats.coin_balance}
              </ThemedText>
            </View>

            <View
              style={[
                styles.coinIconWrap,
                { backgroundColor: theme.colors.surfaceAlt },
              ]}
            >
              <MaterialCommunityIcons
                name="circle-multiple"
                size={34}
                color={theme.colors.primary}
              />
            </View>
          </View>

          <View style={styles.heroStats}>
            <MiniStat
              label="Today"
              value={stats.completed_today}
              icon="check-circle-outline"
              theme={theme}
            />

            <MiniStat
              label="Streak"
              value={stats.streak_days}
              icon="fire"
              theme={theme}
            />

            <MiniStat
              label="Habits"
              value={stats.total_habits}
              icon="repeat"
              theme={theme}
            />
          </View>
        </ThemedCard>

        <View style={styles.sectionHeader}>
          <ThemedText variant="section">Quick Actions</ThemedText>
        </View>

        <View style={styles.actionGrid}>
          <ActionButton
            theme={theme}
            icon="plus-circle-outline"
            label="New Habit"
            onPress={() => router.push("/create-habit")}
          />

          <ActionButton
            theme={theme}
            icon="clipboard-plus-outline"
            label="New Task"
            onPress={() => router.push("/create-task")}
          />

          <ActionButton
            theme={theme}
            icon="gift-outline"
            label="New Reward"
            onPress={() => router.push("/create-reward")}
          />

          <ActionButton
            theme={theme}
            icon="palette-outline"
            label="Theme Store"
            onPress={() => router.push("/theme-store")}
          />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText variant="section">Theme Preview</ThemedText>
        </View>

        <ThemedCard>
          <ThemedText muted style={styles.themeLabel}>
            Current Theme
          </ThemedText>

          <ThemedText style={styles.themeName}>
            {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
          </ThemedText>

          <View style={styles.themeButtons}>
            <ThemePill
              label="Light"
              active={themeName === "light"}
              onPress={() => setThemeName("light")}
              theme={theme}
            />

            <ThemePill
              label="Dark"
              active={themeName === "dark"}
              onPress={() => setThemeName("dark")}
              theme={theme}
            />

            <ThemePill
              label="Nature"
              active={themeName === "nature"}
              onPress={() => setThemeName("nature")}
              theme={theme}
            />

            <ThemePill
              label="Focus"
              active={themeName === "focus"}
              onPress={() => setThemeName("focus")}
              theme={theme}
            />
          </View>
        </ThemedCard>

        <View style={styles.sectionHeader}>
          <ThemedText variant="section">Account</ThemedText>
        </View>

        <ThemedButton
          variant="secondary"
          style={styles.fullButton}
          onPress={() => router.push("/onboarding")}
        >
          Restart Onboarding
        </ThemedButton>

        <ThemedButton
          variant="secondary"
          style={styles.logoutButton}
          onPress={logout}
        >
          Log Out
        </ThemedButton>
      </ScrollView>
    </ThemedScreen>
  );
}

function MiniStat({ label, value, icon, theme }) {
  return (
    <View
      style={[
        styles.miniStat,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={theme.colors.primary}
      />

      <ThemedText style={styles.miniStatValue}>{value}</ThemedText>

      <ThemedText muted style={styles.miniStatLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function ActionButton({ icon, label, onPress, theme }) {
  return (
    <ThemedButton
      variant="secondary"
      style={styles.actionButton}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={theme.colors.primary}
      />

      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </ThemedButton>
  );
}

function ThemePill({ label, active, onPress, theme }) {
  return (
    <ThemedButton
      variant={active ? "primary" : "secondary"}
      style={[
        styles.themePill,
        !active && {
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      {label}
    </ThemedButton>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  subtitle: {
    marginTop: 8,
    lineHeight: 20,
  },

  heroCard: {
    marginTop: 18,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  heroBalance: {
    fontSize: 44,
    fontWeight: "900",
    marginTop: 4,
  },

  coinIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  miniStat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  miniStatValue: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },

  miniStatLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },

  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  actionButton: {
    width: "47%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },

  actionLabel: {
    fontWeight: "800",
    textAlign: "center",
  },

  themeLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  themeName: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },

  themeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },

  themePill: {
    minWidth: 90,
  },

  fullButton: {
    marginBottom: 12,
  },

  logoutButton: {
    marginBottom: 40,
  },
});