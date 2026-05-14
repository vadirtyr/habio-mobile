import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { BrandHeader } from "../../components/BrandMark";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import ThemedScreen from "../../components/ThemedScreen";
import ThemedText from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

const QUICK_THEMES = ["light", "dark", "nature", "focus"];

export default function SettingsScreen() {
  const { logout } = useAuth();

  const {
    theme,
    themeName,
    themes,
    ownedThemes,
    setThemeName,
  } = useTheme();

  const activeTheme = themes[themeName];

  return (
    <ThemedScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <BrandHeader eyebrow="Preferences" title="Settings" />

        <ThemedText muted style={styles.subtitle}>
          Customize your Habio experience.
        </ThemedText>

        <ThemedCard style={styles.heroCard}>
          <LinearGradient
            colors={
              activeTheme?.gradient || [
                theme.colors.background,
                theme.colors.primary,
              ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroTop}>
                <View style={styles.heroCopy}>
                  <ThemedText style={styles.heroEyebrow}>
                    Current Theme
                  </ThemedText>

                  <ThemedText style={styles.heroTitle}>
                    {activeTheme?.name || themeName}
                  </ThemedText>

                  <ThemedText style={styles.heroSubtitle}>
                    {activeTheme?.tagline || "Personalize your experience"}
                  </ThemedText>
                </View>

                <View style={styles.heroIcon}>
                  <MaterialCommunityIcons
                    name="palette-outline"
                    size={34}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.quickThemes}>
            {QUICK_THEMES.map((key) => {
              const item = themes[key];
              const active = themeName === key;

              return (
                <ThemeChip
                  key={key}
                  label={item.name}
                  active={active}
                  theme={theme}
                  onPress={() => setThemeName(key)}
                />
              );
            })}
          </View>

          <ThemedButton
            style={styles.storeButton}
            onPress={() => router.push("/theme-store")}
          >
            Open Theme Store
          </ThemedButton>
        </ThemedCard>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="section">Personalization</ThemedText>

            <View
              style={[
                styles.sectionBadge,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <ThemedText muted style={styles.sectionBadgeText}>
                {ownedThemes.length} owned
              </ThemedText>
            </View>
          </View>

          <ThemedCard style={styles.card}>
            <SettingsRow
              icon="palette-outline"
              label="Theme Store"
              subtitle="Unlock and equip new themes"
              theme={theme}
              onPress={() => router.push("/theme-store")}
            />

            <SettingsRow
              icon="refresh"
              label="Restart Onboarding"
              subtitle="Go through the setup flow again"
              theme={theme}
              onPress={() => router.push("/onboarding")}
            />
          </ThemedCard>
        </View>

        <View style={styles.section}>
          <ThemedText variant="section">Account</ThemedText>

          <ThemedCard style={styles.card}>
            <SettingsRow
              icon="lock-reset"
              label="Change Password"
              subtitle="Update your account password"
              theme={theme}
              onPress={() => router.push("/change-password")}
            />

            <SettingsRow
              icon="shield-lock-outline"
              label="Privacy Policy"
              subtitle="View privacy and data handling"
              theme={theme}
              onPress={() => router.push("/privacy-policy")}
            />

            <SettingsRow
              icon="delete-outline"
              label="Delete Account"
              subtitle="Permanently remove your account"
              theme={theme}
              onPress={() => router.push("/delete-account")}
              danger
            />
          </ThemedCard>
        </View>

        <View style={styles.section}>
          <ThemedButton
            variant="secondary"
            style={styles.logoutButton}
            onPress={logout}
          >
            Log Out
          </ThemedButton>
        </View>

        <View style={styles.footer}>
          <ThemedText muted style={styles.footerText}>
            Habio • Build better days
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedScreen>
  );
}

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  theme,
  danger = false,
}) {
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
            styles.rowIcon,
            {
              backgroundColor: danger
                ? `${theme.colors.danger}15`
                : `${theme.colors.primary}14`,
              borderColor: danger
                ? `${theme.colors.danger}30`
                : `${theme.colors.primary}25`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={danger ? theme.colors.danger : theme.colors.primary}
          />
        </View>

        <View style={styles.rowCopy}>
          <ThemedText
            style={[
              styles.rowLabel,
              danger && {
                color: theme.colors.danger,
              },
            ]}
          >
            {label}
          </ThemedText>

          <ThemedText muted style={styles.rowSubtitle}>
            {subtitle}
          </ThemedText>
        </View>
      </View>

      <Feather
        name="chevron-right"
        size={20}
        color={theme.colors.textMuted}
      />
    </ThemedButton>
  );
}

function ThemeChip({ label, active, onPress, theme }) {
  return (
    <ThemedButton
      variant={active ? "primary" : "secondary"}
      style={[
        styles.themeChip,
        !active && {
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      {label}
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

  heroCard: {
    marginTop: 18,
    overflow: "hidden",
    padding: 0,
  },

  heroGradient: {
    minHeight: 170,
    padding: 22,
    justifyContent: "space-between",
  },

  heroOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
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
    marginTop: 6,
  },

  heroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    marginTop: 8,
    lineHeight: 20,
    fontWeight: "700",
  },

  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  quickThemes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 20,
    paddingTop: 18,
  },

  themeChip: {
    minWidth: 100,
  },

  storeButton: {
    marginHorizontal: 20,
    marginBottom: 20,
  },

  section: {
    marginTop: 28,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  card: {
    marginTop: 12,
  },

  rowButton: {
    paddingVertical: 18,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },

  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  rowCopy: {
    flex: 1,
  },

  rowLabel: {
    fontSize: 16,
    fontWeight: "800",
  },

  rowSubtitle: {
    marginTop: 4,
    lineHeight: 18,
    fontSize: 13,
  },

  logoutButton: {
    marginTop: 4,
  },

  footer: {
    marginTop: 30,
    alignItems: "center",
  },

  footerText: {
    fontSize: 13,
    fontWeight: "700",
  },
});