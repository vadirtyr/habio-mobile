import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { getOrbitTheme } from "../lib/orbitThemes";
import { gradientContrastInfo, radii, spacing, typography } from "../lib/theme";

export default function OrbitsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [orbits, setOrbits] = useState([]);
  const [invites, setInvites] = useState([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [orbitData, inviteData] = await Promise.all([
        api.getOrbits(),
        api.getOrbitInvites(),
      ]);
      setOrbits(orbitData.items || []);
      setInvites(inviteData.items || []);
    } catch (err) {
      setError(err.message || "Unable to load Shared Orbits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function respond(invite, accept) {
    try {
      const data = accept
        ? await api.acceptOrbitInvite(invite.id)
        : await api.declineOrbitInvite(invite.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
      if (accept) router.push({ pathname: "/orbit-detail", params: { orbitId: data.orbit_id } });
    } catch (err) {
      Alert.alert("Invite update failed", err.message);
    }
  }

  async function joinByCode() {
    if (!code.trim()) return;
    try {
      const data = await api.joinOrbitByCode(code.trim());
      setCode("");
      router.push({ pathname: "/orbit-detail", params: { orbitId: data.orbit_id } });
    } catch (err) {
      Alert.alert("Could not join Orbit", err.message);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader
        title="Shared Orbits"
        subtitle="Build better habits together. Shared goals, real accountability."
        right={<AppButton title="Create" fullWidth={false} onPress={() => router.push("/create-orbit")} />}
      />

      {error ? <ErrorState title="Orbits unavailable" description={error} onRetry={load} /> : null}

      {invites.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Pending invites</Text>
          {invites.map((invite) => (
            <AppCard key={invite.id} style={styles.card}>
              <Text style={[styles.title, { color: c.text }]}>{invite.orbit?.name || "Shared Orbit"}</Text>
              <Text style={[styles.copy, { color: c.textSecondary }]}>Invited by {invite.inviter?.display_name || invite.inviter?.name || "a member"}</Text>
              <View style={styles.actions}>
                <AppButton title="Accept" onPress={() => respond(invite, true)} style={styles.action} />
                <AppButton title="Decline" variant="secondary" onPress={() => respond(invite, false)} style={styles.action} />
              </View>
            </AppCard>
          ))}
        </View>
      )}

      <AppCard style={styles.joinCard}>
        <Text style={[styles.title, { color: c.text }]}>Have an invite code?</Text>
        <AppInput value={code} onChangeText={setCode} placeholder="Enter invite code" autoCapitalize="none" style={styles.input} />
        <AppButton title="Join Orbit" onPress={joinByCode} disabled={!code.trim()} />
      </AppCard>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Your Orbits</Text>
      {loading ? (
        <Text style={[styles.copy, { color: c.textSecondary }]}>Loading...</Text>
      ) : orbits.length === 0 ? (
        <AppCard>
          <EmptyState title="Create your first Orbit" description="Create an Orbit for your family, troop, fitness group, study group, or accountability circle. Start with a template and customize from there." icon={<MaterialCommunityIcons name="account-group-outline" size={42} color={c.primary} />} />
        </AppCard>
      ) : (
        orbits.map((orbit) => (
          <ThemedOrbitCard
            key={orbit.id}
            orbit={orbit}
            onPress={() => router.push({ pathname: "/orbit-detail", params: { orbitId: orbit.id } })}
          />
        ))
      )}
    </ScrollView>
  );
}

function ThemedOrbitCard({ orbit, onPress }) {
  const orbitTheme = getOrbitTheme(orbit.theme || orbit.theme_id);
  const contrast = gradientContrastInfo(orbitTheme.gradient);
  const textColor = orbitTheme.text_color || contrast.textColor;
  const secondaryColor = contrast.secondaryTextColor || textColor;
  const accentColor = orbitTheme.accent || textColor;
  const memberCount = orbit.member_count ?? orbit.members?.length ?? 0;
  const level = orbit.level || 1;
  const healthScore = orbit.health_score ?? orbit.stats?.health_score;
  const hasHealthScore = healthScore !== undefined && healthScore !== null;

  return <Pressable onPress={onPress} style={styles.themedCardPressable}>
    <LinearGradient colors={orbitTheme.gradient} style={styles.themedCard}>
      {contrast.needsScrim ? <View style={styles.gradientScrim} /> : null}
      <View style={styles.row}>
        <View style={styles.copyWrap}>
          <Text style={[styles.themedTitle, { color: textColor }]}>{orbit.name}</Text>
          <Text style={[styles.themedCopy, { color: secondaryColor }]}>Level {level} · {memberCount} member{memberCount === 1 ? "" : "s"}</Text>
          {hasHealthScore ? <View style={[styles.healthPill, { borderColor: secondaryColor }]}> 
            <MaterialCommunityIcons name="heart-pulse" size={14} color={accentColor} />
            <Text style={[styles.healthText, { color: secondaryColor }]}>Health {healthScore}/100</Text>
          </View> : null}
        </View>
        <View style={[styles.orbitIcon, { borderColor: secondaryColor }]}> 
          <MaterialCommunityIcons name="chevron-right" size={24} color={accentColor} />
        </View>
      </View>
    </LinearGradient>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, container: { padding: spacing.xl, paddingBottom: 100 },
  section: { marginBottom: spacing.xl }, sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  card: { marginBottom: spacing.md }, joinCard: { marginBottom: spacing.xl },
  themedCardPressable: { marginBottom: spacing.md },
  themedCard: { borderRadius: radii.xl, padding: spacing.lg, overflow: "hidden", minHeight: 132, justifyContent: "center" },
  gradientScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
  title: { ...typography.h3 }, copy: { ...typography.body, marginTop: spacing.xs },
  themedTitle: { ...typography.h3 }, themedCopy: { ...typography.body, marginTop: spacing.xs },
  input: { marginVertical: spacing.md }, actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  action: { flex: 1 }, row: { flexDirection: "row", alignItems: "center", gap: spacing.md }, copyWrap: { flex: 1 },
  healthPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: spacing.xs, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, marginTop: spacing.md },
  healthText: { ...typography.caption },
  orbitIcon: { width: 38, height: 38, borderRadius: radii.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
