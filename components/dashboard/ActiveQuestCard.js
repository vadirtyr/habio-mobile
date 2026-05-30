import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { radii, spacing, typography } from "../../lib/theme";
import { AppButton } from "../AppButton";
import { AppCard } from "../AppCard";

export function ActiveQuestCard({ quest }) {
  const { theme } = useTheme();
  const c = theme.colors;

  if (!quest) {
    return (
      <AppCard style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: c.primary }]}>
              Active Quest
            </Text>

            <Text style={[styles.title, { color: c.text }]}>
              No active quest yet
            </Text>

            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Complete habits and tasks to start building quest progress.
            </Text>
          </View>

          <QuestIcon />
        </View>

        <AppButton
          title="View Quests"
          variant="secondary"
          onPress={() => router.push("/(tabs)/quests")}
        />
      </AppCard>
    );
  }

  const progress = quest.progress || 0;
  const target = quest.target || 1;
  const percent = Math.min(progress / target, 1);
  const reward = quest.reward || quest.coins || 0;

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: c.primary }]}>
            Active Quest
          </Text>

          <Text style={[styles.title, { color: c.text }]}>
            {quest.name || quest.title || "Daily Quest"}
          </Text>

          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {quest.description || "Complete this quest to earn bonus rewards."}
          </Text>
        </View>

        <QuestIcon />
      </View>

      <View style={styles.progressHeader}>
        <Text style={[styles.progressText, { color: c.textSecondary }]}>
          {progress} / {target}
        </Text>

        <Text style={[styles.rewardText, { color: c.primary }]}>
          +{reward} coins
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}>
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

      <AppButton
        title={quest.claimable ? "Claim Quest" : "View Quests"}
        onPress={() => router.push("/(tabs)/quests")}
        style={styles.button}
      />
    </AppCard>
  );
}

function QuestIcon() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
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
        name="flag-checkered"
        size={26}
        color={c.primary}
      />
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
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  copy: {
    flex: 1,
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

  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    lineHeight: 20,
  },

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  progressText: {
    ...typography.caption,
    fontWeight: "900",
  },

  rewardText: {
    ...typography.caption,
    fontWeight: "900",
  },

  track: {
    height: 10,
    borderRadius: radii.pill,
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },

  button: {
    marginTop: spacing.lg,
  },
});