import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppCard } from "../../components/AppCard";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionTitle } from "../../components/SectionTitle";
import { useTheme } from "../../hooks/useTheme";
import { radii, spacing, typography } from "../../lib/theme";

export default function MoreScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: c.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="More"
        subtitle="Manage progress, preferences, and your orbit."
      />

      <SectionTitle title="Community" />

      <AppCard>
        <MoreRow
          icon="account-group-outline"
          label="Friend Feed"
          description="See progress from people in your orbit."
          onPress={() => router.push("/activity-feed")}
        />

        <MoreRow
          icon="timeline-outline"
          label="My Activity"
          description="View your recent OurOrbit progress."
          onPress={() => router.push("/activity-feed")}
        />

        <MoreRow
          icon="account-search-outline"
          label="Find People"
          description="Search public OurOrbit profiles."
          onPress={() => router.push("/user-search")}
          last
        />
      </AppCard>

      <SectionTitle title="Progress" />

      <AppCard>
        <MoreRow
          icon="map-marker-path"
          label="Quests"
          description="Take on guided challenges."
          onPress={() => router.push("/quests")}
        />

        <MoreRow
            icon="trophy-outline"
            label="Achievements"
            description="View the milestones you’ve unlocked."
            onPress={() => router.push("/achievements")}
        />

        <MoreRow
            icon="chart-line"
            label="Weekly Recap"
            description="See how your orbit grew this week."
            onPress={() => router.push("/weekly-recap")}
            last
        />
      </AppCard>

      <SectionTitle title="App" />

      <AppCard>
        <MoreRow
          icon="cog-outline"
          label="Settings"
          description="Onboarding, privacy, and account options."
          onPress={() => router.push("/settings")}
        />

        <MoreRow
          icon="palette-outline"
          label="Theme Store"
          description="Browse and switch OurOrbit themes."
          onPress={() => router.push("/theme-store")}
          last
        />
      </AppCard>
    </ScrollView>
  );
}

function MoreRow({ icon, label, description, onPress, last = false }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const accentColor = c.cyan || c.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: c.divider || c.border,
        },
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: `${accentColor}12`,
            },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={22} color={accentColor} />
        </View>

        <View style={styles.rowCopy}>
          <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>

          <Text style={[styles.rowDescription, { color: c.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={c.textMuted || c.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  row: {
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowPressed: {
    opacity: 0.72,
  },

  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  rowCopy: {
    flex: 1,
  },

  rowLabel: {
    ...typography.bodyBold,
  },

  rowDescription: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});