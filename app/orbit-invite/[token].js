import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { ErrorState } from "../../components/ErrorState";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";
import { spacing, typography } from "../../lib/theme";

export default function OrbitInviteScreen() {
  const { token } = useLocalSearchParams();
  const { isLoggedIn, authLoading } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getOrbitInvitePreview(token)
      .then(setPreview)
      .catch((err) => setError(err.message || "This invite is unavailable."));
  }, [token]);

  async function join() {
    setJoining(true);
    try {
      const result = await api.acceptOrbitInviteLink(token);
      router.replace({ pathname: "/orbit-detail", params: { orbitId: result.orbit_id } });
    } catch (err) {
      Alert.alert("Could not join Orbit", err.message);
    } finally {
      setJoining(false);
    }
  }

  const returnTo = `/orbit-invite/${token}`;
  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      {error ? <ErrorState title="Invite unavailable" description={error} /> : null}
      {!error && !preview ? <Text style={{ color: c.textSecondary }}>Loading invitation...</Text> : null}
      {preview ? <AppCard style={styles.card}>
        <View style={[styles.icon, { backgroundColor: c.surfaceAlt }]}><MaterialCommunityIcons name="orbit" size={42} color={c.primary} /></View>
        <Text style={[styles.eyebrow, { color: c.primary }]}>Shared Orbit invitation</Text>
        <Text style={[styles.title, { color: c.text }]}>{preview.orbit.name}</Text>
        <Text style={[styles.copy, { color: c.textSecondary }]}>{preview.orbit.description || "Join this private Shared Orbit and build momentum together."}</Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>{preview.orbit.member_count} member{preview.orbit.member_count === 1 ? "" : "s"}</Text>
        {!authLoading && isLoggedIn ? <AppButton title={joining ? "Joining..." : "Join Orbit"} disabled={joining} onPress={join} style={styles.action} /> : null}
        {!authLoading && !isLoggedIn ? <View style={styles.actions}>
          <AppButton title="Log in to join" onPress={() => router.push({ pathname: "/login", params: { returnTo } })} style={styles.flex} />
          <AppButton title="Create account" variant="secondary" onPress={() => router.push({ pathname: "/register", params: { returnTo } })} style={styles.flex} />
        </View> : null}
      </AppCard> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, container: { flexGrow: 1, justifyContent: "center", padding: spacing.xl }, card: { alignItems: "center" },
  icon: { width: 76, height: 76, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  eyebrow: { ...typography.caption, textTransform: "uppercase" }, title: { ...typography.h1, textAlign: "center", marginTop: spacing.sm },
  copy: { ...typography.body, textAlign: "center", marginTop: spacing.md }, meta: { ...typography.caption, marginTop: spacing.md },
  action: { marginTop: spacing.xl, width: "100%" }, actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl }, flex: { flex: 1 },
});
