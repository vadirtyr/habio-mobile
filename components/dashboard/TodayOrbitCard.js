import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { radii, spacing, typography } from "../../lib/theme";
import { AppButton } from "../AppButton";
import { AppCard } from "../AppCard";

export function TodayOrbitCard({
  habitsCompleted = 0,
  habitsTotal = 0,
  tasksCompleted = 0,
  tasksTotal = 0,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const totalCompleted = habitsCompleted + tasksCompleted;
  const totalItems = habitsTotal + tasksTotal;
  const remaining = Math.max(totalItems - totalCompleted, 0);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: c.cyan || c.primary }]}>
            Today&apos;s Orbit
          </Text>

          <Text style={[styles.title, { color: c.text }]}>
            {remaining > 0
              ? `${remaining} actions left today`
              : "Your orbit is complete"}
          </Text>
        </View>

        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: `${c.cyan || c.primary}14`,
              borderColor: c.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="orbit"
            size={26}
            color={c.cyan || c.primary}
          />
        </View>
      </View>

      <View style={styles.rows}>
        <OrbitRow
          icon="fire"
          label="Habits"
          completed={habitsCompleted}
          total={habitsTotal}
        />

        <OrbitRow
          icon="checkbox-marked-circle-outline"
          label="Tasks"
          completed={tasksCompleted}
          total={tasksTotal}
        />
      </View>

      <View style={styles.actions}>
        <AppButton
          title="View Habits"
          variant="secondary"
          onPress={() => router.push("/(tabs)/habits")}
          style={styles.actionButton}
        />

        <AppButton
          title="View Tasks"
          onPress={() => router.push("/(tabs)/tasks")}
          style={styles.actionButton}
        />
      </View>
    </AppCard>
  );
}

function OrbitRow({ icon, label, completed, total }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const percent = total > 0 ? Math.min(completed / total, 1) : 0;

  return (
    <View style={styles.orbitRow}>
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: `${c.primary}12`,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={22} color={c.primary} />
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>

          <Text style={[styles.rowCount, { color: c.textSecondary }]}>
            {completed}/{total}
          </Text>
        </View>

        <View
          style={[
            styles.track,
            {
              backgroundColor: c.surfaceAlt,
            },
          ]}
        >
          <View
            style={[
              styles.fill,
              {
                width: `${percent * 100}%`,
                backgroundColor: c.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  eyebrow: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },

  title: {
    ...typography.h2,
    fontWeight: "900",
  },

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  rows: {
    gap: spacing.md,
  },

  orbitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  rowContent: {
    flex: 1,
  },

  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  rowLabel: {
    ...typography.bodyBold,
  },

  rowCount: {
    ...typography.caption,
    fontWeight: "800",
  },

  track: {
    height: 9,
    borderRadius: radii.pill,
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },

  actionButton: {
    flex: 1,
  },
});