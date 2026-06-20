import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { radii, spacing, typography } from "../../lib/theme";
import { AppButton } from "../AppButton";
import { AppCard } from "../AppCard";

export function AchievementStrip({ achievements = [] }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const earned = achievements
    .filter((item) => item.earned)
    .slice(0, 6);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: c.primary }]}>
            Recent Wins
          </Text>

          <Text style={[styles.title, { color: c.text }]}>
            Achievements
          </Text>
        </View>

        <AppButton
          title="View"
          variant="secondary"
          onPress={() => router.push("/(tabs)/achievements")}
          fullWidth={false}
          style={styles.viewButton}
        />
      </View>

      {earned.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {earned.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.item,
                {
                  backgroundColor: c.surfaceAlt,
                  borderColor: c.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: `${c.gold || c.primary}18`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={achievement.icon || "trophy-outline"}
                  size={24}
                  color={c.gold || c.primary}
                />
              </View>

              <Text
                numberOfLines={1}
                style={[styles.itemTitle, { color: c.text }]}
              >
                {achievement.name}
              </Text>

              <Text
                numberOfLines={2}
                style={[
                  styles.itemText,
                  {
                    color: c.textSecondary,
                  },
                ]}
              >
                {achievement.description || "Unlocked achievement"}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.emptyBox,
            {
              backgroundColor: c.surfaceAlt,
              borderColor: c.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="trophy-outline"
            size={30}
            color={c.textMuted || c.textSecondary}
          />

          <Text style={[styles.emptyTitle, { color: c.text }]}>
            No achievements unlocked yet
          </Text>

          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Complete habits, tasks, and quests to start earning wins.
          </Text>
        </View>
      )}
    </AppCard>
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

  headerCopy: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
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

  viewButton: {
    flexShrink: 0,
    minHeight: 44,
    minWidth: 78,
    paddingHorizontal: spacing.lg,
  },

  strip: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },

  item: {
    width: 150,
    minHeight: 150,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },

  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  itemTitle: {
    ...typography.bodyBold,
  },

  itemText: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 17,
  },

  emptyBox: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
  },

  emptyTitle: {
    ...typography.bodyBold,
    marginTop: spacing.md,
    textAlign: "center",
  },

  emptyText: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: "center",
    lineHeight: 18,
  },
});
