import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { BrandHeader } from "../../components/BrandMark";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import ThemedScreen from "../../components/ThemedScreen";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../hooks/useTheme";

export default function MoreScreen() {
  const { theme } = useTheme();

  return (
    <ThemedScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <BrandHeader eyebrow="Explore" title="More" />

        <ThemedText muted style={styles.subtitle}>
          Manage your progress, achievements, quests, and preferences.
        </ThemedText>

        <View style={styles.section}>
          <ThemedText variant="section">Progress</ThemedText>

          <ThemedCard style={styles.card}>
            <MoreRow
              icon="map-marker-path"
              label="Quests"
              description="Take on guided challenges."
              theme={theme}
              onPress={() => router.push("/quests")}
            />

            <MoreRow
              icon="trophy-outline"
              label="Achievements"
              description="View milestones you have unlocked."
              theme={theme}
              onPress={() => router.push("/achievements")}
            />
          </ThemedCard>
        </View>

        <View style={styles.section}>
          <ThemedText variant="section">App</ThemedText>

          <ThemedCard style={styles.card}>
            <MoreRow
              icon="cog-outline"
              label="Settings"
              description="Themes, onboarding, privacy, and account options."
              theme={theme}
              onPress={() => router.push("/settings")}
            />

            <MoreRow
              icon="palette-outline"
              label="Theme Store"
              description="Browse and switch Habio themes."
              theme={theme}
              onPress={() => router.push("/theme-store")}
            />
          </ThemedCard>
        </View>
      </ScrollView>
    </ThemedScreen>
  );
}

function MoreRow({ icon, label, description, onPress, theme }) {
  return (
    <ThemedButton
      variant="ghost"
      style={[
        styles.rowButton,
        {
          borderBottomColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.colors.surfaceAlt },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.rowCopy}>
          <ThemedText style={styles.rowLabel}>{label}</ThemedText>
          <ThemedText muted style={styles.rowDescription}>
            {description}
          </ThemedText>
        </View>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={theme.colors.textMuted}
      />
    </ThemedButton>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
  },

  subtitle: {
    marginTop: 8,
    lineHeight: 20,
  },

  section: {
    marginTop: 28,
  },

  card: {
    marginTop: 12,
  },

  rowButton: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  rowCopy: {
    flex: 1,
  },

  rowLabel: {
    fontSize: 16,
    fontWeight: "900",
  },

  rowDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
  },
});