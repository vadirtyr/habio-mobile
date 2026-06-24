import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ErrorState } from "../components/ErrorState";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const TYPE_LABELS = {
  orbit_milestone: "Orbit milestone",
  project_completed: "Project completed",
  season_completed: "Season completed",
  orbit_achievement: "Orbit achievement",
  orbit_event: "Orbit event",
  member_joined: "Member joined",
};

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch (_err) {
    return "";
  }
}

export default function OrbitMemoryDetailScreen() {
  const { orbitId, memoryId, canManage } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const canPin = canManage === "true";

  const load = useCallback(async () => {
    if (!orbitId || !memoryId) return;
    setError(null);
    try {
      const data = await api.getOrbitMemory(orbitId, memoryId);
      setMemory(data);
    } catch (err) {
      setError(err.message || "Unable to load memory.");
    } finally {
      setLoading(false);
    }
  }, [orbitId, memoryId]);

  useEffect(() => { load(); }, [load]);

  async function togglePin() {
    if (!canPin || !memory) return;
    setBusy(true);
    try {
      const updated = memory.pinned ? await api.unpinOrbitMemory(orbitId, memory.id) : await api.pinOrbitMemory(orbitId, memory.id);
      setMemory(updated);
      await Haptics.selectionAsync();
    } catch (err) {
      Alert.alert("Could not update memory", err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader title="Memory" subtitle="A lasting Orbit moment" />
      {error ? <ErrorState title="Memory unavailable" description={error} onRetry={load} /> : null}
      {loading ? <Text style={[styles.copy, { color: c.textSecondary }]}>Loading memory...</Text> : memory ? (
        <AppCard style={styles.card}>
          <View style={styles.headerRow}>
            <View style={[styles.icon, { backgroundColor: c.primary + "20" }]}>
              <MaterialCommunityIcons name={memory.pinned ? "pin" : "bookmark-outline"} size={28} color={c.primary} />
            </View>
            <View style={styles.copyWrap}>
              <Text style={[styles.type, { color: c.primary }]}>{TYPE_LABELS[memory.type] || memory.type}</Text>
              <Text style={[styles.title, { color: c.text }]}>{memory.title}</Text>
              <Text style={[styles.meta, { color: c.textMuted }]}>{formatDate(memory.created_at)}</Text>
            </View>
          </View>
          {!!memory.description && <Text style={[styles.copy, { color: c.textSecondary }]}>{memory.description}</Text>}
          <View style={styles.metaRow}>
            <Text style={[styles.badge, { color: c.textSecondary, borderColor: c.textMuted + "55" }]}>Scope: {memory.scope || "orbit"}</Text>
            <Text style={[styles.badge, { color: c.primary, borderColor: c.primary + "55" }]}>{memory.importance || "normal"}</Text>
          </View>
          <Text style={[styles.copy, { color: c.textMuted }]}>Media attachments are reserved for a future version.</Text>
          {canPin && <AppButton title={memory.pinned ? "Unpin Memory" : "Pin Memory"} variant="secondary" style={styles.pinButton} onPress={togglePin} disabled={busy} />}
        </AppCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  card: { marginBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  copyWrap: { flex: 1 },
  icon: { width: 52, height: 52, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  type: { ...typography.caption, textTransform: "uppercase" },
  title: { ...typography.h2, marginTop: spacing.xs },
  copy: { ...typography.body, marginTop: spacing.md },
  meta: { ...typography.caption, marginTop: spacing.xs },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  badge: { ...typography.caption, textTransform: "uppercase", borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  pinButton: { marginTop: spacing.lg },
});
