import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const TYPE_ICONS = {
  orbit_milestone: "star-four-points",
  project_completed: "clipboard-check-outline",
  season_completed: "calendar-check-outline",
  orbit_achievement: "trophy-outline",
  orbit_event: "calendar-star",
  member_joined: "account-plus-outline",
};

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch (_err) {
    return "";
  }
}

function monthKey(value) {
  if (!value) return "Earlier";
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  } catch (_err) {
    return "Earlier";
  }
}

export default function OrbitTimelineScreen() {
  const { orbitId, orbitName, canManage } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const canPin = canManage === "true";

  const load = useCallback(async () => {
    if (!orbitId) return;
    setError(null);
    try {
      const data = await api.getOrbitMemories(orbitId);
      setPayload(data);
    } catch (err) {
      setError(err.message || "Unable to load Orbit timeline.");
    } finally {
      setLoading(false);
    }
  }, [orbitId]);

  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => payload?.items || [], [payload]);
  const featured = payload?.featured || items.filter((item) => item.pinned);
  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = monthKey(item.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).map(([label, memories]) => ({ label, memories }));
  }, [items]);

  async function togglePin(memory) {
    if (!canPin) return;
    setBusyId(memory.id);
    try {
      const updated = memory.pinned
        ? await api.unpinOrbitMemory(orbitId, memory.id)
        : await api.pinOrbitMemory(orbitId, memory.id);
      setPayload((current) => {
        const nextItems = (current?.items || []).map((item) => item.id === updated.id ? updated : item);
        return { ...(current || {}), items: nextItems, featured: nextItems.filter((item) => item.pinned) };
      });
      await Haptics.selectionAsync();
    } catch (err) {
      Alert.alert("Could not update memory", err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader title="Orbit Timeline" subtitle={orbitName ? orbitName + " memories" : "Meaningful Orbit history"} />
      {error ? <ErrorState title="Timeline unavailable" description={error} onRetry={load} /> : null}
      {loading ? (
        <Text style={[styles.copy, { color: c.textSecondary }]}>Loading timeline...</Text>
      ) : items.length === 0 ? (
        <AppCard>
          <EmptyState
            title="No memories yet"
            description="Major milestones, completed projects, events, and new members will become part of this Orbit history."
            icon={<MaterialCommunityIcons name="timeline-clock-outline" size={44} color={c.primary} />}
          />
        </AppCard>
      ) : (
        <>
          {!!featured.length && <View>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Featured Memories</Text>
            {featured.map((memory) => <MemoryCard key={"featured-" + memory.id} memory={memory} colors={c} canPin={canPin} busy={busyId === memory.id} onTogglePin={togglePin} featured />)}
          </View>}
          <Text style={[styles.sectionTitle, { color: c.text }]}>History</Text>
          {grouped.map((group) => <View key={group.label}>
            <Text style={[styles.monthLabel, { color: c.textSecondary }]}>{group.label}</Text>
            {group.memories.map((memory) => <MemoryCard key={memory.id} memory={memory} colors={c} canPin={canPin} busy={busyId === memory.id} onTogglePin={togglePin} />)}
          </View>)}
        </>
      )}
    </ScrollView>
  );
}

function MemoryCard({ memory, colors, canPin, busy, onTogglePin, featured = false }) {
  const icon = TYPE_ICONS[memory.type] || "bookmark-outline";
  const importanceColor = memory.importance === "major" ? colors.primary : memory.importance === "important" ? colors.warning || colors.gold || colors.primary : colors.textMuted;
  return (
    <Pressable onPress={() => router.push({ pathname: "/orbit-memory-detail", params: { orbitId: memory.orbit_id, memoryId: memory.id, canManage: canPin ? "true" : "false" } })}>
      <AppCard style={[styles.card, featured && { borderColor: colors.primary, borderWidth: 1 }]}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: importanceColor + "20" }]}>
            <MaterialCommunityIcons name={icon} size={24} color={importanceColor} />
          </View>
          <View style={styles.copyWrap}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>{memory.title}</Text>
              {memory.pinned ? <MaterialCommunityIcons name="pin" size={18} color={colors.primary} /> : null}
            </View>
            {!!memory.description && <Text style={[styles.copy, { color: colors.textSecondary }]}>{memory.description}</Text>}
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: colors.textMuted }]}>{formatDate(memory.created_at)}</Text>
              <Text style={[styles.badge, { color: importanceColor, borderColor: importanceColor + "55" }]}>{memory.importance || "normal"}</Text>
            </View>
          </View>
        </View>
        {canPin && <AppButton title={memory.pinned ? "Unpin" : "Pin"} variant="secondary" style={styles.pinButton} onPress={() => onTogglePin(memory)} disabled={busy} />}
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  card: { marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  copyWrap: { flex: 1 },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md },
  monthLabel: { ...typography.caption, textTransform: "uppercase", marginBottom: spacing.sm, marginTop: spacing.sm },
  title: { ...typography.h3, flex: 1 },
  copy: { ...typography.body, marginTop: spacing.xs },
  meta: { ...typography.caption },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  badge: { ...typography.caption, textTransform: "uppercase", borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  icon: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  pinButton: { marginTop: spacing.md },
});
