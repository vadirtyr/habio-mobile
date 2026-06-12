import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { radii, spacing, typography } from "../lib/theme";

const SECTIONS = [
  {
    title: "Information we collect",
    body: "OurOrbit processes account details, profile information, habits, tasks, rewards, activity, and other content you choose to add. If you use Google sign-in, we receive the basic account information needed to authenticate you.",
  },
  {
    title: "How we use information",
    body: "We use this information to provide and personalize OurOrbit, maintain your progress, support social features, secure accounts, deliver requested notifications, and improve reliability.",
  },
  {
    title: "Notifications and device data",
    body: "With your permission, OurOrbit may register a device push token and schedule reminders. The app also stores limited preferences and authentication information securely on your device.",
  },
  {
    title: "Service providers",
    body: "OurOrbit relies on service providers such as Google for optional sign-in and Expo for app delivery and notifications. These providers process information according to their own terms and privacy policies.",
  },
  {
    title: "Sharing and public activity",
    body: "Profile and activity information you make public may be visible to other OurOrbit users. We may disclose information when required by law, to protect users and the service, or to vendors that help operate the app.",
  },
  {
    title: "Your choices",
    body: "You can update profile information, disable notification permissions in your device settings, reset app data, or permanently delete your account from OurOrbit settings.",
  },
  {
    title: "Data retention and security",
    body: "We retain information as needed to provide the service and meet legal or operational obligations. We use reasonable safeguards, but no storage or transmission method can guarantee absolute security.",
  },
  {
    title: "Children",
    body: "OurOrbit is not intended for children under 13. If you believe a child has provided personal information, contact OurOrbit support so it can be reviewed and removed where appropriate.",
  },
  {
    title: "Policy updates",
    body: "We may update this policy as OurOrbit changes. Material updates will be reflected here with a revised effective date.",
  },
];

export default function PrivacyScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: c.primary }]}>Back</Text>
        </Pressable>

        <ScreenHeader
          title="Privacy Policy"
          subtitle="How OurOrbit handles information used to provide the app."
        />

        <AppCard style={styles.introCard}>
          <Text style={[styles.effectiveDate, { color: c.primary }]}>
            Effective June 11, 2026
          </Text>
          <Text style={[styles.introText, { color: c.textSecondary }]}>
            This policy describes information handled by the OurOrbit mobile
            app and the choices available to you.
          </Text>
        </AppCard>

        {SECTIONS.map((section) => (
          <AppCard key={section.title} style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionBody, { color: c.textSecondary }]}>
              {section.body}
            </Text>
          </AppCard>
        ))}

        <Text style={[styles.footer, { color: c.textMuted || c.muted }]}>
          Questions about privacy can be sent through the official OurOrbit
          support channel.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: spacing.xl,
    paddingTop: 56,
    paddingBottom: 120,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.bodyBold,
  },
  introCard: {
    marginBottom: spacing.md,
  },
  effectiveDate: {
    ...typography.caption,
    textTransform: "uppercase",
  },
  introText: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  sectionBody: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  footer: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
