import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { spacing, typography } from "../lib/theme";

export default function OrbitMembersScreen() {
  const { orbitId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [orbit, setOrbit] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const load = useCallback(async () => {
    try { setOrbit(await api.getOrbit(orbitId)); }
    catch (err) { Alert.alert("Unable to load members", err.message); }
  }, [orbitId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try { setResults(await api.get(`/users/search?q=${encodeURIComponent(text)}`)); }
      catch (err) { console.log(err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function invite(user) {
    try { await api.inviteOrbitMember(orbitId, { user_id: user.id }); Alert.alert("Invite sent", `${user.display_name || user.name || user.username} was invited.`); setQuery(""); setResults([]); await load(); }
    catch (err) { Alert.alert("Could not invite user", err.message); }
  }

  function remove(member) {
    const name = member.user?.display_name || member.user?.name || "this member";
    Alert.alert("Remove member?", `Remove ${name} from this Orbit?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { try { await api.removeOrbitMember(orbitId, member.user_id); await load(); } catch (err) { Alert.alert("Could not remove member", err.message); } } },
    ]);
  }

  if (!orbit) return <View style={[styles.center, { backgroundColor: c.background }]}><Text style={{ color: c.textSecondary }}>Loading members...</Text></View>;
  const canManage = orbit.viewer_role === "owner" || orbit.viewer_role === "admin";

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Members" subtitle={`${orbit.member_count} people in ${orbit.name}`} />
      {canManage && <>
        <AppCard style={styles.searchCard}>
          <Text style={[styles.title, { color: c.text }]}>Invite someone</Text>
          <AppInput value={query} onChangeText={setQuery} placeholder="Search by username or name" autoCapitalize="none" style={styles.input} leftElement={<Feather name="search" size={18} color={c.textMuted} />} />
          {results.map((user) => <Pressable key={user.id} onPress={() => invite(user)} style={[styles.result, { borderTopColor: c.border }]}>
            <MaterialCommunityIcons name={user.avatar || "account-circle"} size={28} color={c.primary} />
            <View style={styles.resultCopy}><Text style={[styles.memberName, { color: c.text }]}>{user.display_name || user.name || user.username}</Text><Text style={[styles.handle, { color: c.textSecondary }]}>@{user.username}</Text></View>
            <Feather name="plus" size={22} color={c.primary} />
          </Pressable>)}
        </AppCard>
      </>}

      <Text style={[styles.sectionTitle, { color: c.text }]}>Current members</Text>
      {orbit.members.map((member) => <AppCard key={member.user_id} style={styles.memberCard}>
        <View style={styles.row}>
          <MaterialCommunityIcons name={member.user?.avatar || "account-circle"} size={34} color={c.primary} />
          <View style={styles.resultCopy}><Text style={[styles.memberName, { color: c.text }]}>{member.user?.display_name || member.user?.name || "Member"}</Text><Text style={[styles.handle, { color: c.textSecondary }]}>{member.role}</Text></View>
          {canManage && member.role !== "owner" && <AppButton title="Remove" variant="ghost" fullWidth={false} onPress={() => remove(member)} />}
        </View>
      </AppCard>)}

      {canManage && orbit.pending_invites?.length > 0 && <>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Pending invites</Text>
        {orbit.pending_invites.map((invite) => <AppCard key={invite.id} style={styles.memberCard}><Text style={[styles.handle, { color: c.textSecondary }]}>{invite.email || invite.invitee_id}</Text></AppCard>)}
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, container: { padding: spacing.xl, paddingBottom: 100 },
  searchCard: { marginBottom: spacing.xl }, title: { ...typography.h3 }, input: { marginTop: spacing.md },
  result: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1 }, resultCopy: { flex: 1 },
  memberName: { ...typography.bodyBold }, handle: { ...typography.caption, marginTop: 2 }, sectionTitle: { ...typography.h3, marginBottom: spacing.md, marginTop: spacing.md },
  memberCard: { marginBottom: spacing.sm }, row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
