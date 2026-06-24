import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function OrbitVerificationsScreen() {
  const { orbitId, orbitName } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getPendingOrbitVerifications(orbitId);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Unable to load verification queue.");
    } finally {
      setLoading(false);
    }
  }, [orbitId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function review(item, approve) {
    setBusyId(item.id);
    try {
      const projectId = item.project_id || item.item?.project_id;
      if (item.item_type === "project_subtask" && projectId) {
        if (approve) await api.approveProjectVerification(projectId, item.id);
        else await api.rejectProjectVerification(projectId, item.id, { reason: reason.trim() });
      } else if (approve) {
        await api.approveOrbitProof(orbitId, item.id);
      } else {
        await api.rejectOrbitProof(orbitId, item.id, { reason: reason.trim() });
      }
      setReason("");
      await load();
    } catch (err) {
      Alert.alert("Review failed", err.message || "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <View style={[styles.screen, styles.container, { backgroundColor: c.background }]}><ScreenHeader title="Verification Queue" subtitle={orbitName || "Shared Orbit"} /><ErrorState title="Queue unavailable" description={error} onRetry={load} /></View>;
  }

  return <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
    <ScreenHeader title="Verification Queue" subtitle={orbitName || "Review pending proof before rewards are awarded."} />
    {loading ? <Text style={[styles.copy, { color: c.textSecondary }]}>Loading...</Text> : null}
    {!loading && !items.length ? <AppCard><EmptyState compact title="Nothing to review" description="Pending habit, task, project, and subtask proofs will appear here." icon={<MaterialCommunityIcons name="shield-check-outline" size={40} color={c.primary} />} /></AppCard> : null}
    {items.map((item) => <AppCard key={item.id} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color={c.primary} />
        </View>
        <View style={styles.copyWrap}>
          <Text style={[styles.title, { color: c.text }]}>{item.item?.name || "Shared activity"}</Text>
          {!!item.item?.project_title && <Text style={[styles.meta, { color: c.textMuted }]}>{item.item.project_title}</Text>}
          <Text style={[styles.meta, { color: c.textMuted }]}>Submitted by {item.submitter?.display_name || item.submitter?.name || "a member"}</Text>
        </View>
      </View>
      {!!(item.verification_text || item.proof_text) && <Text style={[styles.proofText, { color: c.text, backgroundColor: c.surfaceAlt }]}>{item.verification_text || item.proof_text}</Text>}
      {!!(item.verification_photo_url || item.proof_image_key) && <Text style={[styles.meta, { color: c.primary }]}>Photo proof attached</Text>}
      <AppInput value={reason} onChangeText={setReason} placeholder="Optional rejection reason" maxLength={500} style={styles.input} />
      <View style={styles.actions}>
        <AppButton title="Reject" variant="secondary" style={styles.action} onPress={() => review(item, false)} disabled={!!busyId} />
        <AppButton title={busyId === item.id ? "Approving..." : "Approve"} style={styles.action} onPress={() => review(item, true)} disabled={!!busyId} />
      </View>
    </AppCard>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  card: { marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  iconWrap: { width: 42, height: 42, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  copyWrap: { flex: 1 },
  title: { ...typography.bodyBold },
  copy: { ...typography.body },
  meta: { ...typography.caption, marginTop: spacing.xs },
  proofText: { ...typography.body, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.lg },
  input: { marginTop: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1 },
});
