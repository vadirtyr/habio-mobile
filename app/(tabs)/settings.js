import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionTitle } from "../../components/SectionTitle";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../../lib/theme";

const QUICK_THEMES = [
  "light",
  "dark",
  "nature",
  "focus",
];

export default function SettingsScreen() {
  const { logout } = useAuth();

  const {
    themeName,
    themes,
    ownedThemes,
    setThemeName,
  } = useTheme();

  const activeTheme = themes[themeName];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Settings"
        subtitle="Customize your orbit and account experience."
      />

      <AppCard padded={false} style={styles.heroCard}>
        <LinearGradient
          colors={
            activeTheme?.gradient || [
              colors.background,
              colors.cyan,
            ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroGlow} />

          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>
                Current Theme
              </Text>

              <Text style={styles.heroTitle}>
                {activeTheme?.name ||
                  themeName}
              </Text>

              <Text style={styles.heroSubtitle}>
                {activeTheme?.tagline ||
                  "Personalize your experience"}
              </Text>
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
            const active =
              themeName === key;

            return (
              <ThemeChip
                key={key}
                label={item.name}
                active={active}
                onPress={() =>
                  setThemeName(key)
                }
              />
            );
          })}
        </View>

        <AppButton
          style={styles.storeButton}
          title="Open Theme Store"
          onPress={() =>
            router.push("/theme-store")
          }
        />
      </AppCard>

      <SectionTitle
        title="Personalization"
      />

      <AppCard>
        <SettingsRow
          icon="palette-outline"
          label="Theme Store"
          subtitle="Unlock and equip new themes"
          onPress={() =>
            router.push("/theme-store")
          }
        />

        <SettingsRow
          icon="refresh"
          label="Restart Onboarding"
          subtitle="Go through the setup flow again"
          onPress={() =>
            router.push("/onboarding")
          }
          last
        />
      </AppCard>

      <SectionTitle title="Account" />

      <AppCard>
        <SettingsRow
          icon="lock-reset"
          label="Change Password"
          subtitle="Update your account password"
          onPress={() =>
            router.push(
              "/change-password"
            )
          }
        />

        <SettingsRow
          icon="shield-lock-outline"
          label="Privacy Policy"
          subtitle="View privacy and data handling"
          onPress={() =>
            router.push(
              "/privacy-policy"
            )
          }
        />

        <SettingsRow
          icon="delete-outline"
          label="Delete Account"
          subtitle="Permanently remove your account"
          danger
          last
          onPress={() =>
            router.push(
              "/delete-account"
            )
          }
        />
      </AppCard>

      <AppButton
        variant="secondary"
        style={styles.logoutButton}
        title="Log Out"
        onPress={logout}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          OurOrbit • Small actions shape
          your orbit
        </Text>
      </View>
    </ScrollView>
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
        <View
          style={[
            styles.rowIcon,
            {
              backgroundColor: danger
                ? `${colors.danger}12`
                : `${colors.cyan}12`,

              borderColor: danger
                ? `${colors.danger}30`
                : `${colors.cyan}25`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={
              danger
                ? colors.danger
                : colors.cyan
            }
          />
        </View>

        <View style={styles.rowCopy}>
          <Text
            style={[
              styles.rowLabel,
              danger && {
                color: colors.danger,
              },
            ]}
          >
            {label}
          </Text>

          <Text
            style={styles.rowSubtitle}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <Feather
        name="chevron-right"
        size={20}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

function ThemeChip({
  label,
  active,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeChip,
        active && styles.themeChipActive,
      ]}
    >
      <Text
        style={[
          styles.themeChipText,
          active &&
            styles.themeChipTextActive,
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
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  heroCard: {
    overflow: "hidden",
  },

  heroGradient: {
    minHeight: 180,
    padding: spacing.xl,
    justifyContent: "space-between",
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    backgroundColor:
      "rgba(255,255,255,0.08)",
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
    color: colors.white,
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

  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    backgroundColor:
      "rgba(255,255,255,0.14)",
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },

  themeChipActive: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
    ...shadows.soft,
  },

  themeChipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "900",
  },

  themeChipTextActive: {
    color: colors.white,
  },

  storeButton: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  row: {
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
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
    color: colors.text,
  },

  rowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
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
    color: colors.textMuted,
    fontWeight: "700",
  },
});