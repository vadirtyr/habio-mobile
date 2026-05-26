import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { BrandBadge, BrandHeader } from "../../components/BrandMark";
import { SectionTitle } from "../../components/SectionTitle";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { radii, shadows, spacing, typography } from "../../lib/theme";

const QUICK_THEMES = ["light", "dark", "nature", "focus"];

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { themeName, themes, setThemeName } = useTheme();

  const activeTheme = themes[themeName];
  const c = activeTheme.colors;

  function confirmLogout() {
    Alert.alert(
      "Log out?",
      "You’ll need to sign in again to access your orbit.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
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
          <AppCard padded={false} style={styles.heroCard}>
            <LinearGradient
              colors={activeTheme?.gradient || [c.background, c.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroGlow} />

              <View style={styles.heroTop}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>Current Theme</Text>

                  <Text style={styles.heroTitle}>
                    {activeTheme?.name || themeName}
                  </Text>

                  <Text style={styles.heroSubtitle}>
                    {activeTheme?.tagline || "Personalize your experience"}
                  </Text>

                  <View style={styles.heroBadgeRow}>
                    <BrandBadge label="Theme Active" />
                  </View>
                </View>

                <View style={styles.heroIcon}>
                  <MaterialCommunityIcons
                    name="palette-outline"
                    size={34}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </LinearGradient>

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

        <AnimatedScreen delay={80}>
          <AppCard style={styles.identityCard}>
            <View
              style={[
                styles.identityGlow,
                {
                  backgroundColor: `${c.cyan || c.primary}10`,
                },
              ]}
            />

            <View style={styles.identityTop}>
              <View
                style={[
                  styles.identityIcon,
                  {
                    backgroundColor: `${c.cyan || c.primary}14`,
                    borderColor: c.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="orbit"
                  size={28}
                  color={c.cyan || c.primary}
                />
              </View>

              <View style={styles.identityCopy}>
                <Text style={[styles.identityTitle, { color: c.text }]}>
                  Your Orbit
                </Text>

                <Text style={[styles.identityText, { color: c.textSecondary }]}>
                  Small daily actions create long-term momentum.
                </Text>
              </View>
            </View>
          </AppCard>
        </AnimatedScreen>

        <AnimatedScreen delay={120}>
          <SectionTitle title="Personalization" />

          <AppCard>
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

        <AnimatedScreen delay={160}>
          <SectionTitle title="Account" />

          <AppCard>
            <SettingsRow
              icon="lock-reset"
              label="Change Password"
              subtitle="Update your account password"
              onPress={() => router.push("/change-password")}
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
              label="Reset App Data"
              subtitle="Clear habits, tasks, rewards, coins, streaks, quests, achievements, and history"
              onPress={handleResetData}
              destructive
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
              OurOrbit v1.0
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
            await api.resetAccountData();

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  heroCard: {
    overflow: "hidden",
  },

  heroGradient: {
    minHeight: 190,
    padding: spacing.xl,
    justifyContent: "space-between",
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -120,
    right: -90,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  heroCopy: {
    flex: 1,
  },

  heroEyebrow: {
    color: "rgba(255,255,255,0.78)",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: spacing.xs,
  },

  heroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    marginTop: spacing.sm,
    lineHeight: 20,
    fontWeight: "700",
  },

  heroBadgeRow: {
    marginTop: spacing.lg,
  },

  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  quickThemes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.xl,
    paddingTop: spacing.lg,
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
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  identityCard: {
    marginTop: spacing.lg,
    overflow: "hidden",
  },

  identityGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: radii.pill,
    top: -110,
    right: -80,
  },

  identityTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  identityIcon: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  identityCopy: {
    flex: 1,
  },

  identityTitle: {
    ...typography.h3,
  },

  identityText: {
    ...typography.body,
    marginTop: spacing.xs,
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