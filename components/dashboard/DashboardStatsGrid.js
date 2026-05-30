import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { radii, spacing, typography } from "../../lib/theme";
import { AppCard } from "../AppCard";

export function DashboardStatsGrid({
  coins = 0,
  xp = 0,
  streak = 0,
  completedToday = 0,
}) {
  return (
    <View style={styles.grid}>
      <StatCard
        icon="cash"
        label="Coins"
        value={coins}
      />

      <StatCard
        icon="star-four-points-outline"
        label="XP"
        value={xp}
      />

      <StatCard
        icon="fire"
        label="Streak"
        value={streak}
      />

      <StatCard
        icon="check-circle-outline"
        label="Today"
        value={completedToday}
      />
    </View>
  );
}

function StatCard({ icon, label, value }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <AppCard style={styles.card}>
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: `${c.primary}14`,
            borderColor: c.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={c.primary}
        />
      </View>

      <Text style={[styles.value, { color: c.text }]}>
        {value}
      </Text>

      <Text
        style={[
          styles.label,
          {
            color: c.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  card: {
    width: "47%",
    minHeight: 132,
    justifyContent: "space-between",
  },

  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  value: {
    ...typography.h1,
    fontWeight: "900",
    marginTop: spacing.md,
  },

  label: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});