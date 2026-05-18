import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppCard } from "../../components/AppCard";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionTitle } from "../../components/SectionTitle";
import { colors, radii, spacing, typography } from "../../lib/theme";

export default function MoreScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="More"
        subtitle="Manage progress, preferences, and your orbit."
      />

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.cyan} />
        </View>

        <View style={styles.rowCopy}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowDescription}>{description}</Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
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
    backgroundColor: `${colors.cyan}12`,
    alignItems: "center",
    justifyContent: "center",
  },

  rowCopy: {
    flex: 1,
  },

  rowLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },

  rowDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});