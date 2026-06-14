import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { UserAvatar } from "../components/UserAvatar";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { APP_URL } from "../lib/config";
import { spacing, typography } from "../lib/theme";

export default function OrbitMembersScreen() {
  const { orbitId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [orbit, setOrbit] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [inviteLink, setInviteLink] = useState("");
  const [linkInvites, setLinkInvites] = useState([]);

  const load = useCallback(async () => {
    try {
      const orbitData = await api.getOrbit(orbitId);
      setOrbit(orbitData);
      if (orbitData.capabilities?.can_manage_invites) {
        const inviteData = await api.listOrbitInvites(orbitId);
        setLinkInvites(inviteData.link_invites || []);
      } else {
        setLinkInvites([]);
      }
    }
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

  async function createInviteLink() {
    try {
      const invite = await api.createOrbitInviteLink(orbitId);
      const link = `${APP_URL}/orbit-invite/${invite.token}`;
      setInviteLink(link);
      await load();
      await Share.share({ message: `Join ${orbit.name} on OurOrbit: ${link}`, url: link });
    } catch (err) {
      Alert.alert("Could not create invite link", err.message);
    }
  }

  function revokeInvite(invite) {
    Alert.alert("Revoke invite link?", "Anyone using this link will no longer be able to join.", [
      { text: "Cancel", style: "cancel" },
      { text: "Revoke", style: "destructive", onPress: async () => { try { await api.deactivateOrbitInvite(orbitId, invite.id); if (inviteLink.endsWith(invite.token)) setInviteLink(""); await load(); } catch (err) { Alert.alert("Could not revoke invite", err.message); } } },
    ]);
  }

  function shareInvite(invite) {
    const link = `${APP_URL}/orbit-invite/${invite.token}`;
    return Share.share({ message: `Join ${orbit.name} on OurOrbit: ${link}`, url: link });
  }

  function remove(member) {
    const name = member.user?.display_name || member.user?.name || "this member";
    Alert.alert("Remove member?", `Remove ${name} from this Orbit?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { try { await api.removeOrbitMember(orbitId, member.user_id); await load(); } catch (err) { Alert.alert("Could not remove member", err.message); } } },
    ]);
  }

  function changeRole(member) {
    const nextRole = member.role === "admin" ? "member" : "admin";
    const action = nextRole === "admin" ? "Promote" : "Demote";
    const name = member.user?.display_name || member.user?.name || "this member";
    Alert.alert(`${action} member?`, `${action} ${name} to ${nextRole}?`, [
      { text: "Cancel", style: "cancel" },
      { text: action, onPress: async () => { try { await api.updateOrbitMemberRole(orbitId, member.user_id, nextRole); await load(); } catch (err) { Alert.alert("Could not update role", err.message); } } },
    ]);
  }

  function transferOwnership(member) {
    const name = member.user?.display_name || member.user?.name || "this member";
    Alert.alert(
      "Transfer ownership?",
      `${name} will become the owner. You will become an admin and will no longer be able to delete the Orbit or manage admin roles.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Transfer", style: "destructive", onPress: async () => { try { await api.transferOrbitOwnership(orbitId, member.user_id); await load(); } catch (err) { Alert.alert("Could not transfer ownership", err.message); } } },
      ],
    );
  }

  if (!orbit) return <View style={[styles.center, { backgroundColor: c.background }]}><Text style={{ color: c.textSecondary }}>Loading members...</Text></View>;
  const canManage = orbit.viewer_role === "owner" || orbit.viewer_role === "admin";
  const isOwner = orbit.viewer_role === "owner";

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Members" subtitle={`${orbit.member_count} people in ${orbit.name}`} />
      {canManage && <>
        <AppCard style={styles.searchCard}>
          <Text style={[styles.title, { color: c.text }]}>Invite link</Text>
          <Text style={[styles.handle, { color: c.textSecondary }]}>Create a reusable link for someone to join as a member.</Text>
          {inviteLink ? <Text selectable style={[styles.inviteLink, { color: c.primary }]}>{inviteLink}</Text> : null}
          <AppButton title={inviteLink ? "Share again" : "Create invite link"} onPress={inviteLink ? () => Share.share({ message: `Join ${orbit.name} on OurOrbit: ${inviteLink}`, url: inviteLink }) : createInviteLink} style={styles.linkButton} />
        </AppCard>
        {linkInvites.length > 0 && <>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Active invite links</Text>
          {linkInvites.map((invite) => <AppCard key={invite.id} style={styles.memberCard}>
            <Text selectable style={[styles.inviteLink, { color: c.primary }]}>{APP_URL}/orbit-invite/{invite.token}</Text>
            <Text style={[styles.handle, { color: c.textSecondary }]}>{invite.uses_count || 0} use{invite.uses_count === 1 ? "" : "s"}{invite.max_uses ? ` of ${invite.max_uses}` : ""}</Text>
            <View style={styles.inviteActions}><AppButton title="Share" variant="ghost" fullWidth={false} onPress={() => shareInvite(invite)} /><AppButton title="Revoke" variant="ghost" fullWidth={false} onPress={() => revokeInvite(invite)} /></View>
          </AppCard>)}
        </>}
        <AppCard style={styles.searchCard}>
          <Text style={[styles.title, { color: c.text }]}>Invite someone</Text>
          <AppInput value={query} onChangeText={setQuery} placeholder="Search by username or name" autoCapitalize="none" style={styles.input} leftElement={<Feather name="search" size={18} color={c.textMuted} />} />
          {results.map((user) => <Pressable key={user.id} onPress={() => invite(user)} style={[styles.result, { borderTopColor: c.border }]}>
            <UserAvatar user={user} size={28} icon="account-circle" color={c.primary} backgroundColor={c.surfaceAlt} />
            <View style={styles.resultCopy}><Text style={[styles.memberName, { color: c.text }]}>{user.display_name || user.name || user.username}</Text><Text style={[styles.handle, { color: c.textSecondary }]}>@{user.username}</Text></View>
            <Feather name="plus" size={22} color={c.primary} />
          </Pressable>)}
        </AppCard>
      </>}

      <Text style={[styles.sectionTitle, { color: c.text }]}>Current members</Text>
      {orbit.members.map((member) => <AppCard key={member.user_id} style={styles.memberCard}>
        <View style={styles.row}>
          <UserAvatar user={member.user} size={34} icon="account-circle" color={c.primary} backgroundColor={c.surfaceAlt} />
          <View style={styles.resultCopy}><Text style={[styles.memberName, { color: c.text }]}>{member.user?.display_name || member.user?.name || "Member"}</Text><View style={[styles.roleBadge, { backgroundColor: c.surfaceAlt }]}><Text style={[styles.roleText, { color: c.primary }]}>{member.role}</Text></View></View>
          <View style={styles.memberActions}>
            {isOwner && member.role !== "owner" && <AppButton title="Make owner" variant="ghost" fullWidth={false} onPress={() => transferOwnership(member)} />}
            {isOwner && member.role !== "owner" && <AppButton title={member.role === "admin" ? "Demote" : "Promote"} variant="ghost" fullWidth={false} onPress={() => changeRole(member)} />}
            {canManage && member.role !== "owner" && (isOwner || member.role === "member") && <AppButton title="Remove" variant="ghost" fullWidth={false} onPress={() => remove(member)} />}
          </View>
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
  memberActions: { alignItems: "flex-end", gap: spacing.xs }, roleBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: 4 }, roleText: { ...typography.caption, textTransform: "capitalize" },
  inviteLink: { ...typography.caption, marginTop: spacing.md }, linkButton: { marginTop: spacing.md },
  inviteActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.sm },
});
