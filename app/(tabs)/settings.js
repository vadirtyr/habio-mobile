import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AnimatedScreen } from "../../components/AnimatedScreen";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { BrandHeader } from "../../components/BrandMark";
import { SectionTitle } from "../../components/SectionTitle";
import { UserAvatar } from "../../components/UserAvatar";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

import { api, resetAccountData } from "../../lib/api";

import {
  radii,
  shadows,
  spacing,
  typography,
} from "../../lib/theme";

const QUICK_THEMES = ["light", "dark", "nature", "focus"];

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { themeName, themes, setThemeName } = useTheme();

  const [profile, setProfile] = useState(null);

  const activeTheme = themes[themeName] || themes.light;
  const c = activeTheme.colors;

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest?.version ||
    "1.0";

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    try {
      const data = await api.get("/profile/me");
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }

  function confirmLogout() {
    Alert.alert(
      "Log out?",
      "You’ll need to sign in again to access your orbit.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  }

  async function handleThemeChange(key) {
    await Haptics.selectionAsync();
    await setThemeName(key);
  }

  async function handleResetData() {
    Alert.alert(
      "Reset App Data?",
      "This will permanently delete your habits, tasks, rewards, coins, streaks, quests, achievements, and history. Your account will remain active.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Data",
          style: "destructive",
          onPress: async () => {
            try {
              await resetAccountData();
              Alert.alert(
                "Data Reset",
                "Your app data has been reset.",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/onboarding"),
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                "Reset Failed",
                error?.message || "Unable to reset account data."
              );
            }
          },
        },
      ]
    );
  }

  const level = profile?.level_data?.level || 1;
  const xp =
    profile?.level_data?.progress ||
    profile?.level_data?.current_xp ||
    0;

  return (
    <AnimatedScreen style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        style={[styles.screen, { backgroundColor: c.background }]}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <BrandHeader
          eyebrow="OurOrbit"
          title="Settings"
          subtitle="Customize your themes, account, and experience."
          compact
        />

        <AnimatedScreen delay={40}>
          <AppCard style={styles.profileSummaryCard}>
            <View style={styles.profileSummaryRow}>
              <UserAvatar user={profile} size={58} icon={getAvatarIcon(profile)} color={c.cyan || c.primary} backgroundColor={`${c.cyan || c.primary}14`} borderColor={c.border} style={styles.profileAvatar} />

              <View style={styles.profileSummaryCopy}>
                <Text style={[styles.profileLabel, { color: c.textSecondary }]}>
                  Your Orbit
                </Text>

                <Text style={[styles.profileName, { color: c.text }]}>
                  {profile?.display_name || "Explorer"}
                </Text>

                <Text style={[styles.profileUsername, { color: c.textSecondary }]}>
                  {profile?.username ? `@${profile.username}` : "Profile ready"}
                </Text>
              </View>

              <Pressable
                onPress={() => router.push("/profile")}
                style={({ pressed }) => [
                  styles.profileButton,
                  {
                    backgroundColor: `${c.cyan || c.primary}14`,
                    borderColor: c.border,
                  },
                  pressed && styles.rowPressed,
                ]}
              >
                <Feather
                  name="chevron-right"
                  size={20}
                  color={c.cyan || c.primary}
                />
              </Pressable>
            </View>

            <View style={styles.summaryStats}>
              <MiniStat label="Level" value={level} icon="orbit" />
              <MiniStat label="Streak" value={profile?.streak_days || 0} icon="fire" />
              <MiniStat label="XP" value={xp} icon="star-four-points" />
              <MiniStat label="Coins" value={profile?.coin_balance || 0} icon="cash" />
            </View>
          </AppCard>
        </AnimatedScreen>

        <AnimatedScreen delay={70}>
          <AppCard style={styles.currentThemeCard}>
            <View style={styles.currentThemeRow}>
              <View
                style={[
                  styles.currentThemeIcon,
                  {
                    backgroundColor: `${c.cyan || c.primary}14`,
                    borderColor: c.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="palette-outline"
                  size={28}
                  color={c.cyan || c.primary}
                />
              </View>

              <View style={styles.currentThemeCopy}>
                <Text
                  style={[
                    styles.currentThemeLabel,
                    { color: c.textSecondary },
                  ]}
                >
                  Current Theme
                </Text>

                <Text style={[styles.currentThemeName, { color: c.text }]}>
                  {activeTheme?.name || themeName}
                </Text>

                <Text
                  style={[
                    styles.currentThemeSubtitle,
                    { color: c.textSecondary },
                  ]}
                >
                  {activeTheme?.tagline || "Personalize your experience"}
                </Text>
              </View>
            </View>

            <View style={styles.quickThemes}>
              {QUICK_THEMES.map((key) => {
                const item = themes[key];

                if (!item) return null;

                return (
                  <ThemeChip
                    key={key}
                    label={item.name || key}
                    active={themeName === key}
                    onPress={() => handleThemeChange(key)}
                  />
                );
              })}
            </View>

            <AppButton
              style={styles.storeButton}
              title="Open Theme Store"
              onPress={() => router.push("/theme-store")}
            />
          </AppCard>
        </AnimatedScreen>

        <AnimatedScreen delay={110}>
          <SectionTitle title="Personalization" />

          <AppCard>
            <SettingsRow
              icon="account-circle-outline"
              label="Profile"
              subtitle="View and customize your public profile"
              onPress={() => router.push("/profile")}
            />

            <SettingsRow
              icon="timeline-clock-outline"
              label="Activity"
              subtitle="View your recent orbit history"
              onPress={() => router.push("/activity")}
            />

            <SettingsRow
              icon="palette-outline"
              label="Theme Store"
              subtitle="Unlock and equip new themes"
              onPress={() => router.push("/theme-store")}
            />

            <SettingsRow
              icon="refresh"
              label="Restart Onboarding"
              subtitle="Go through the setup flow again"
              onPress={() => router.push("/onboarding")}
              last
            />
          </AppCard>
        </AnimatedScreen>

        <AnimatedScreen delay={150}>
          <SectionTitle title="Account" />

          <AppCard>
            <SettingsRow
              icon="lock-reset"
              label="Change Password"
              subtitle="Update your account password"
              onPress={() => router.push("/change-password")}
            />

            <SettingsRow
              icon="watch-variant"
              label="Wear OS Pairing"
              subtitle="Generate a short-lived code for your watch"
              onPress={() => router.push("/wear-os-pairing")}
            />

            <SettingsRow
              icon="shield-lock-outline"
              label="Privacy Policy"
              subtitle="View privacy and data handling"
              onPress={() => router.push("/privacy")}
              last
            />
          </AppCard>
        </AnimatedScreen>

        <AnimatedScreen delay={190}>
          <SectionTitle
            title="Danger Zone"
            subtitle="Permanent account actions."
          />

          <AppCard>
            <SettingsRow
              icon="refresh"
              label="Reset App Data"
              subtitle="Clear habits, tasks, rewards, coins, streaks, quests, achievements, and history"
              onPress={handleResetData}
            />

            <SettingsRow
              icon="delete-outline"
              label="Delete Account"
              subtitle="Permanently remove your account"
              danger
              last
              onPress={() => router.push("/delete-account")}
            />
          </AppCard>
        </AnimatedScreen>

        <AnimatedScreen delay={230}>
          <AppButton
            variant="secondary"
            style={styles.logoutButton}
            title="Log Out"
            onPress={confirmLogout}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textMuted || c.muted }]}>
              Built with momentum in mind.
            </Text>

            <Text
              style={[styles.versionText, { color: c.textMuted || c.muted }]}
            >
              OurOrbit v{appVersion}
            </Text>
          </View>
        </AnimatedScreen>
      </ScrollView>
    </AnimatedScreen>
  );
}

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  danger = false,
  last = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const accentColor = danger ? c.danger : c.cyan || c.primary;

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
            styles.rowIcon,
            {
              backgroundColor: `${accentColor}12`,
              borderColor: `${accentColor}30`,
            },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
        </View>

        <View style={styles.rowCopy}>
          <Text
            style={[
              styles.rowLabel,
              {
                color: danger ? c.danger : c.text,
              },
            ]}
          >
            {label}
          </Text>

          <Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Feather name="chevron-right" size={20} color={c.textMuted || c.muted} />
    </Pressable>
  );
}

function ThemeChip({ label, active, onPress }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const accentColor = c.cyan || c.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeChip,
        {
          borderColor: active ? accentColor : c.border,
          backgroundColor: active ? accentColor : c.surfaceAlt,
        },
        active && {
          shadowColor: accentColor,
        },
      ]}
    >
      {active ? <Feather name="check" size={14} color="#FFFFFF" /> : null}

      <Text
        style={[
          styles.themeChipText,
          {
            color: active ? "#FFFFFF" : c.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MiniStat({ icon, label, value }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.miniStat}>
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={c.cyan || c.primary}
      />

      <Text style={[styles.miniStatValue, { color: c.text }]}>
        {value}
      </Text>

      <Text style={[styles.miniStatLabel, { color: c.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function getAvatarIcon(profile) {
  const avatarId = profile?.avatar || "explorer";
  const avatarStore = profile?.avatar_store || [];
  const avatar = avatarStore.find((item) => item.id === avatarId);

  return avatar?.icon || "compass-outline";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  profileSummaryCard: {
    marginTop: spacing.sm,
  },

  profileSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  profileSummaryCopy: {
    flex: 1,
  },

  profileLabel: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  profileName: {
    ...typography.h3,
    marginTop: spacing.xs,
  },

  profileUsername: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontWeight: "700",
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryStats: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
  },

  miniStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },

  miniStatValue: {
    ...typography.bodyBold,
  },

  miniStatLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "800",
  },

  currentThemeCard: {
    marginTop: spacing.lg,
  },

  currentThemeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  currentThemeIcon: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  currentThemeCopy: {
    flex: 1,
  },

  currentThemeLabel: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  currentThemeName: {
    ...typography.h3,
    marginTop: spacing.xs,
  },

  currentThemeSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  quickThemes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  themeChip: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    ...shadows.soft,
  },

  themeChipText: {
    ...typography.caption,
    fontWeight: "900",
  },

  storeButton: {
    marginTop: spacing.lg,
  },

  row: {
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowPressed: {
    opacity: 0.72,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },

  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  rowCopy: {
    flex: 1,
  },

  rowLabel: {
    ...typography.bodyBold,
  },

  rowSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  logoutButton: {
    marginTop: spacing.lg,
  },

  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },

  footerText: {
    ...typography.caption,
    fontWeight: "700",
  },

  versionText: {
    ...typography.caption,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
});
