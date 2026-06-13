import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { OrbitProgressBar } from "../components/OrbitProgressBar";
import { ScreenHeader } from "../components/ScreenHeader";
import { UserAvatar } from "../components/UserAvatar";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const TYPE_LABELS = {
  habit_completions: "habit completions", task_completions: "task completions",
  streak_days: "streak days", xp: "XP", check_in: "check-ins",
};
const CHALLENGE_TYPES = [
  ["actions", "Actions"], ["habits", "Habits"], ["tasks", "Tasks"],
];
const PROOF_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export default function OrbitDetailScreen() {
  const { orbitId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createType, setCreateType] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [requiresProof, setRequiresProof] = useState(false);
  const [busyItem, setBusyItem] = useState(null);
  const [proofTarget, setProofTarget] = useState(null);
  const [proofText, setProofText] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeType, setChallengeType] = useState("actions");
  const [challengeGoal, setChallengeGoal] = useState("100");
  const [challengeReward, setChallengeReward] = useState("500");
  const [challengeEndDate, setChallengeEndDate] = useState(() => {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() + 30);
    return end.toISOString().slice(0, 10);
  });

  const load = useCallback(async () => {
    try { setDashboard(await api.getOrbitDashboard(orbitId)); setError(null); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [orbitId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function contribute(goal) {
    try {
      await api.contributeOrbitGoal(orbitId, goal.id, { amount: 1 });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (err) { Alert.alert("Could not add progress", err.message); }
  }

  function openCreate(type) {
    setCreateType(type);
    setItemName("");
    setItemDescription("");
    setRequiresProof(false);
  }

  async function createSharedItem() {
    const name = itemName.trim();
    if (!name) {
      Alert.alert("Name required", `Enter a name for the shared ${createType}.`);
      return;
    }
    setBusyItem(`create-${createType}`);
    try {
      const body = { name, description: itemDescription.trim(), requires_proof: requiresProof };
      if (createType === "habit") await api.createOrbitHabit(orbitId, body);
      else await api.createOrbitTask(orbitId, body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreateType(null);
      setItemName("");
      setItemDescription("");
      await load();
    } catch (err) {
      Alert.alert(`Could not create ${createType}`, err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function completeSharedItem(type, item) {
    if (item.requires_proof) {
      setProofTarget({ type, item });
      setProofText("");
      setProofImage(null);
      return;
    }
    setBusyItem(`${type}-${item.id}`);
    try {
      if (type === "habit") await api.completeOrbitHabit(orbitId, item.id);
      else await api.completeOrbitTask(orbitId, item.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (err) {
      Alert.alert(`Could not complete ${type}`, err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function submitProof() {
    if (!proofText.trim() && !proofImage) {
      Alert.alert("Proof required", "Add a description or select an image.");
      return;
    }
    const { type, item } = proofTarget;
    setBusyItem(`proof-${item.id}`);
    try {
      let proofImageKey = null;
      if (proofImage) {
        const upload = await api.createUploadUrl({
          upload_type: "proof_image",
          filename: proofImage.fileName,
          content_type: proofImage.mimeType,
        });
        const fileResponse = await fetch(proofImage.uri);
        const fileBlob = await fileResponse.blob();
        const uploadResponse = await fetch(upload.upload_url, {
          method: "PUT",
          headers: upload.headers,
          body: fileBlob,
        });
        if (!uploadResponse.ok) throw new Error("Image upload failed. Please try again.");
        proofImageKey = upload.key;
      }
      const body = { proof_text: proofText.trim(), proof_image_key: proofImageKey };
      if (type === "habit") await api.completeOrbitHabitWithProof(orbitId, item.id, body);
      else await api.completeOrbitTaskWithProof(orbitId, item.id, body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProofTarget(null);
      setProofText("");
      setProofImage(null);
      await load();
    } catch (err) {
      Alert.alert("Could not submit proof", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function pickProofImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo access to attach an image as proof.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    const extension = PROOF_EXTENSIONS[mimeType] || "jpg";
    const originalName = asset.fileName || "";
    const fileName = originalName.toLowerCase().endsWith(`.${extension}`)
      ? originalName
      : `proof.${extension}`;
    setProofImage({
      uri: asset.uri,
      mimeType,
      fileName,
    });
  }

  async function reviewProof(proof, approve) {
    setBusyItem(`review-${proof.id}`);
    try {
      if (approve) await api.approveOrbitProof(orbitId, proof.id);
      else await api.rejectOrbitProof(orbitId, proof.id, { reason: rejectionReason.trim() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRejectionReason("");
      await load();
    } catch (err) {
      Alert.alert("Could not review proof", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function createChallenge() {
    const goalValue = Number(challengeGoal);
    const rewardXp = Number(challengeReward);
    if (!challengeTitle.trim() || goalValue < 1 || rewardXp < 0 || !challengeEndDate.trim()) {
      Alert.alert("Check challenge details", "Add a title, positive goal, reward, and end date.");
      return;
    }
    setBusyItem("create-challenge");
    try {
      await api.createOrbitChallenge(orbitId, {
        title: challengeTitle.trim(),
        description: challengeDescription.trim(),
        goal_type: challengeType,
        goal_value: goalValue,
        reward_xp: rewardXp,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: challengeEndDate.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowChallengeForm(false);
      setChallengeTitle("");
      setChallengeDescription("");
      await load();
    } catch (err) {
      Alert.alert("Could not create challenge", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  function leaveOrDelete() {
    const orbit = dashboard.orbit;
    const owner = orbit.viewer_role === "owner";
    Alert.alert(owner ? "Delete Shared Orbit?" : "Leave Shared Orbit?", owner ? "This removes the Orbit for every member." : "You will lose access to this private Orbit.", [
      { text: "Cancel", style: "cancel" },
      { text: owner ? "Delete" : "Leave", style: "destructive", onPress: async () => {
        try {
          if (owner) await api.deleteOrbit(orbitId);
          else await api.leaveOrbit(orbitId);
          router.replace("/orbits");
        }
        catch (err) { Alert.alert("Could not update Orbit", err.message); }
      } },
    ]);
  }

  if (loading) return <View style={[styles.center, { backgroundColor: c.background }]}><Text style={{ color: c.textSecondary }}>Loading Orbit...</Text></View>;
  if (error) return <View style={[styles.screen, styles.container, { backgroundColor: c.background }]}><ErrorState title="Orbit unavailable" description={error} onRetry={load} /></View>;
  if (!dashboard) return null;

  const {
    orbit,
    stats,
    members = [],
    recent_activity: recentActivity = [],
    shared_habits: sharedHabits = [],
    shared_tasks: sharedTasks = [],
    active_challenges: activeChallenges = [],
    completed_challenges: completedChallenges = [],
    pending_proof_count: pendingProofCount = 0,
    pending_proofs: pendingProofs = [],
  } = dashboard;
  const level = orbit.level || 1;
  const xp = orbit.xp || 0;
  const xpProgress = orbit.xp_progress || 0;
  const xpNeeded = orbit.xp_needed_for_next_level || 100;
  const xpPercent = orbit.xp_progress_percent || 0;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader title={orbit.name} subtitle={orbit.description || "A private Shared Orbit."} />
      <AppCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={[styles.smallLabel, { color: c.textSecondary }]}>Shared Orbit</Text>
            <Text style={[styles.heroTitle, { color: c.text }]}>Level {level}</Text>
            <Text style={[styles.copy, { color: c.textSecondary }]}>
              {stats.member_count} member{stats.member_count === 1 ? "" : "s"} · {xp} XP
            </Text>
          </View>
          <MaterialCommunityIcons name="orbit" size={44} color={c.primary} />
        </View>
        <OrbitProgressBar percent={xpPercent} style={styles.progressBar} glow />
        <Text style={[styles.time, { color: c.textMuted }]}>{xpProgress} / {xpNeeded} XP to next level</Text>
      </AppCard>

      <View style={styles.actions}>
        <AppButton title="Members" variant="secondary" style={styles.action} onPress={() => router.push({ pathname: "/orbit-members", params: { orbitId } })} />
        <AppButton title="New goal" style={styles.action} onPress={() => router.push({ pathname: "/create-orbit-goal", params: { orbitId } })} />
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>This week</Text>
      <AppCard style={styles.card}>
        <View style={styles.statGrid}>
          <Stat label="Completion" value={`${stats.weekly_completion_rate}%`} color={c.primary} labelColor={c.textSecondary} />
          <Stat label="Actions" value={stats.weekly_actions} color={c.text} labelColor={c.textSecondary} />
          <Stat label="Habits" value={stats.habits_completed_this_week} color={c.success} labelColor={c.textSecondary} />
          <Stat label="Tasks" value={stats.tasks_completed_this_week} color={c.text} labelColor={c.textSecondary} />
          <Stat label="Best streak" value={`${stats.current_streak}d`} color={c.primary} labelColor={c.textSecondary} />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: c.text }]}>Weekly progress</Text>
          <Text style={[styles.status, { color: c.primary }]}>{stats.weekly_completion_rate}%</Text>
        </View>
        <OrbitProgressBar percent={stats.weekly_completion_rate} style={styles.progressBar} glow />
        <Text style={[styles.copy, { color: c.textSecondary }]}>Progress across Shared Orbit goals active this week.</Text>
      </AppCard>

      <AppCard style={styles.inviteCard}>
        <Text style={[styles.smallLabel, { color: c.textSecondary }]}>Invite code</Text>
        <Text selectable style={[styles.code, { color: c.text }]}>{orbit.invite_code}</Text>
      </AppCard>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Challenges</Text>
        <AppButton title="Create" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={() => setShowChallengeForm((value) => !value)} disabled={!!busyItem} />
      </View>

      {!!showChallengeForm && <AppCard style={styles.createCard}>
        <Text style={[styles.title, { color: c.text }]}>New Orbit challenge</Text>
        <AppInput value={challengeTitle} onChangeText={setChallengeTitle} placeholder="Challenge title" maxLength={100} style={styles.formInput} />
        <AppInput value={challengeDescription} onChangeText={setChallengeDescription} placeholder="Description (optional)" maxLength={500} style={styles.formInput} />
        <Text style={[styles.formLabel, { color: c.textSecondary }]}>Challenge type</Text>
        <View style={styles.chips}>{CHALLENGE_TYPES.map(([value, label]) => (
          <Pressable key={value} onPress={() => setChallengeType(value)} style={[styles.chip, { borderColor: challengeType === value ? c.primary : c.border, backgroundColor: challengeType === value ? `${c.primary}16` : c.surfaceAlt }]}>
            <Text style={[styles.time, { color: c.text }]}>{label}</Text>
          </Pressable>
        ))}</View>
        <AppInput value={challengeGoal} onChangeText={setChallengeGoal} placeholder="Goal value" keyboardType="number-pad" style={styles.formInput} />
        <AppInput value={challengeReward} onChangeText={setChallengeReward} placeholder="Reward XP" keyboardType="number-pad" style={styles.formInput} />
        <AppInput value={challengeEndDate} onChangeText={setChallengeEndDate} placeholder="End date: YYYY-MM-DD" style={styles.formInput} />
        <View style={styles.formActions}>
          <AppButton title="Cancel" variant="secondary" style={styles.formAction} onPress={() => setShowChallengeForm(false)} disabled={!!busyItem} />
          <AppButton title="Create" style={styles.formAction} onPress={createChallenge} disabled={!!busyItem} />
        </View>
      </AppCard>}

      {activeChallenges.length ? activeChallenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} colors={c} />) : <AppCard style={styles.card}><EmptyState compact title="No active challenges" description="Create a shared target for the Orbit to tackle together." icon={<MaterialCommunityIcons name="trophy-outline" size={40} color={c.primary} />} /></AppCard>}
      {!!completedChallenges.length && <>
        <Text style={[styles.smallLabel, styles.completedLabel, { color: c.textSecondary }]}>Completed</Text>
        {completedChallenges.slice(0, 3).map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} colors={c} />)}
      </>}

      <SharedItemsSection
        title="Shared habits"
        emptyTitle="No shared habits"
        emptyDescription="Create a daily habit everyone in this Orbit can build together."
        icon="repeat"
        items={sharedHabits}
        itemType="habit"
        colors={c}
        busyItem={busyItem}
        onCreate={() => openCreate("habit")}
        onComplete={completeSharedItem}
      />

      {!!proofTarget && <AppCard style={styles.createCard}>
        <Text style={[styles.title, { color: c.text }]}>Submit proof</Text>
        <Text style={[styles.copy, { color: c.textSecondary }]}>{proofTarget.item.name}</Text>
        <AppInput value={proofText} onChangeText={setProofText} placeholder="Describe what you completed" multiline maxLength={1000} style={styles.formInput} />
        {proofImage ? <View style={styles.selectedProof}>
          <Image source={{ uri: proofImage.uri }} style={styles.proofImage} contentFit="cover" />
          <AppButton title="Remove image" variant="secondary" onPress={() => setProofImage(null)} disabled={!!busyItem} />
        </View> : <AppButton title="Add proof image" variant="secondary" onPress={pickProofImage} style={styles.proofImageButton} disabled={!!busyItem} />}
        <View style={styles.formActions}>
          <AppButton title="Cancel" variant="secondary" style={styles.formAction} onPress={() => { setProofTarget(null); setProofImage(null); }} disabled={!!busyItem} />
          <AppButton title={busyItem ? "Submitting..." : "Submit for review"} style={styles.formAction} onPress={submitProof} disabled={!!busyItem || (!proofText.trim() && !proofImage)} />
        </View>
      </AppCard>}

      <SharedItemsSection
        title="Shared tasks"
        emptyTitle="No shared tasks"
        emptyDescription="Add a task that any Orbit member can complete."
        icon="check-circle-outline"
        items={sharedTasks}
        itemType="task"
        colors={c}
        busyItem={busyItem}
        onCreate={() => openCreate("task")}
        onComplete={completeSharedItem}
      />

      {!!createType && <AppCard style={styles.createCard}>
        <Text style={[styles.title, { color: c.text }]}>New shared {createType}</Text>
        <AppInput
          value={itemName}
          onChangeText={setItemName}
          placeholder={`${createType === "habit" ? "Habit" : "Task"} name`}
          maxLength={100}
          style={styles.formInput}
        />
        <Pressable onPress={() => setRequiresProof((value) => !value)} style={[styles.proofToggle, { borderColor: requiresProof ? c.primary : c.border, backgroundColor: requiresProof ? `${c.primary}16` : c.surfaceAlt }]}>
          <MaterialCommunityIcons name={requiresProof ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={22} color={requiresProof ? c.primary : c.textMuted} />
          <Text style={[styles.copy, { color: c.text }]}>Require proof before XP is awarded</Text>
        </Pressable>
        <AppInput
          value={itemDescription}
          onChangeText={setItemDescription}
          placeholder="Description (optional)"
          maxLength={300}
          style={styles.formInput}
        />
        <View style={styles.formActions}>
          <AppButton title="Cancel" variant="secondary" style={styles.formAction} onPress={() => setCreateType(null)} disabled={!!busyItem} />
          <AppButton title="Create" style={styles.formAction} onPress={createSharedItem} disabled={!!busyItem} />
        </View>
      </AppCard>}

      {pendingProofCount > 0 && <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Pending proofs</Text>
        <Text style={[styles.time, { color: c.textMuted }]}>{pendingProofCount}</Text>
      </View>}
      {pendingProofs.map((proof) => <AppCard key={proof.id} style={styles.card}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: c.text }]}>{proof.item?.name || "Shared item"}</Text>
          <Text style={[styles.status, { color: c.primary }]}>pending</Text>
        </View>
        <Text style={[styles.copy, { color: c.textSecondary }]}>Submitted by {proof.submitter?.display_name || proof.submitter?.name || "a member"}</Text>
        {!!proof.proof_text && <Text style={[styles.proofQuote, { color: c.text }]}>{proof.proof_text}</Text>}
        {!!proof.proof_image_key && <ProofImage objectKey={proof.proof_image_key} colors={c} />}
        <AppInput value={rejectionReason} onChangeText={setRejectionReason} placeholder="Rejection reason (optional)" maxLength={500} style={styles.formInput} />
        <View style={styles.formActions}>
          <AppButton title="Reject" variant="secondary" style={styles.formAction} onPress={() => reviewProof(proof, false)} disabled={!!busyItem} />
          <AppButton title="Approve" style={styles.formAction} onPress={() => reviewProof(proof, true)} disabled={!!busyItem} />
        </View>
      </AppCard>)}

      <Text style={[styles.sectionTitle, { color: c.text }]}>Group goals</Text>
      {orbit.goals?.length ? orbit.goals.map((goal) => {
        const percent = Math.min(100, Math.round(((goal.progress || 0) / goal.target_amount) * 100));
        return <AppCard key={goal.id} style={styles.card}>
          <View style={styles.row}><Text style={[styles.title, { color: c.text }]}>{goal.title}</Text><Text style={[styles.status, { color: goal.status === "completed" ? c.success : c.primary }]}>{goal.status}</Text></View>
          {!!goal.description && <Text style={[styles.copy, { color: c.textSecondary }]}>{goal.description}</Text>}
          <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: c.primary }]} /></View>
          <Text style={[styles.copy, { color: c.textSecondary }]}>{goal.progress || 0} / {goal.target_amount} {TYPE_LABELS[goal.target_type]}</Text>
          {goal.status !== "completed" && <AppButton title={goal.target_type === "check_in" ? "Check in" : "Add 1"} variant="secondary" onPress={() => contribute(goal)} style={styles.contribute} />}
        </AppCard>;
      }) : <AppCard><EmptyState compact title="No group goals" description="Create the first shared target for this Orbit." icon={<MaterialCommunityIcons name="target" size={40} color={c.primary} />} /></AppCard>}

      <Text style={[styles.sectionTitle, { color: c.text }]}>Recent activity</Text>
      {recentActivity.length ? recentActivity.map((item) => <AppCard key={item.id} style={styles.activityCard}>
        <View style={styles.activityRow}>
          <MaterialCommunityIcons name="timeline-outline" size={22} color={c.primary} />
          <View style={styles.activityCopy}>
            <Text style={[styles.activityMessage, { color: c.text }]}>{item.message}</Text>
            <Text style={[styles.time, { color: c.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        </View>
      </AppCard>) : <Text style={[styles.copy, { color: c.textSecondary }]}>Activity will appear as members build momentum.</Text>}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Members</Text>
        <Text style={[styles.time, { color: c.textMuted }]}>{members.length} total</Text>
      </View>
      {members.slice(0, 6).map((member) => (
        <AppCard key={member.user_id} style={styles.memberCard}>
          <View style={styles.memberRow}>
            <UserAvatar user={member.user} size={34} icon="account-circle" color={c.primary} backgroundColor={c.surfaceAlt} />
            <View style={styles.memberCopy}>
              <Text style={[styles.memberName, { color: c.text }]}>{member.user?.display_name || member.user?.name || member.user?.username || "Member"}</Text>
              <Text style={[styles.time, { color: c.textSecondary }]}>{member.role} · Level {member.user?.level || 1}</Text>
            </View>
          </View>
        </AppCard>
      ))}

      <AppButton title={orbit.viewer_role === "owner" ? "Delete Orbit" : "Leave Orbit"} variant="secondary" onPress={leaveOrDelete} style={styles.dangerButton} />
    </ScrollView>
  );
}

function Stat({ label, value, color, labelColor }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

function SharedItemsSection({
  title,
  emptyTitle,
  emptyDescription,
  icon,
  items,
  itemType,
  colors,
  busyItem,
  onCreate,
  onComplete,
}) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: colors.text }]}>{title}</Text>
        <AppButton title="Create" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={onCreate} disabled={!!busyItem} />
      </View>
      {items.length ? items.map((item) => {
        const completed = itemType === "habit" ? item.completed_today : item.completed;
        return <AppCard key={item.id} style={styles.sharedItemCard}>
          <View style={styles.sharedItemRow}>
            <MaterialCommunityIcons name={completed ? "check-circle" : icon} size={28} color={completed ? colors.success : colors.primary} />
            <View style={styles.sharedItemCopy}>
              <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
              {!!item.description && <Text style={[styles.copy, { color: colors.textSecondary }]}>{item.description}</Text>}
              {!!item.requires_proof && <Text style={[styles.time, { color: colors.primary }]}>Proof required</Text>}
              {item.viewer_proof_status === "pending" && <Text style={[styles.time, { color: colors.textMuted }]}>Awaiting review</Text>}
              {item.viewer_proof_status === "rejected" && <Text style={[styles.time, { color: colors.coral || colors.danger }]}>Proof rejected. You can resubmit.</Text>}
            </View>
          </View>
          <AppButton
            title={completed ? "Completed" : item.viewer_proof_status === "pending" ? "Pending review" : item.requires_proof ? (item.viewer_proof_status === "rejected" ? "Resubmit proof" : "Submit proof") : "Complete"}
            variant="secondary"
            style={styles.completeButton}
            disabled={completed || item.viewer_proof_status === "pending" || !!busyItem}
            onPress={() => onComplete(itemType, item)}
          />
        </AppCard>;
      }) : <AppCard style={styles.card}><EmptyState compact title={emptyTitle} description={emptyDescription} icon={<MaterialCommunityIcons name={icon} size={40} color={colors.primary} />} /></AppCard>}
    </>
  );
}

function ChallengeCard({ challenge, colors }) {
  const progress = Math.min(challenge.current_progress || 0, challenge.goal_value);
  const percent = Math.min(100, Math.round((progress / challenge.goal_value) * 100));
  const label = CHALLENGE_TYPES.find(([value]) => value === challenge.goal_type)?.[1] || "Actions";
  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.text }]}>{challenge.title}</Text>
        <Text style={[styles.status, { color: challenge.status === "completed" ? colors.success : colors.primary }]}>{challenge.status}</Text>
      </View>
      {!!challenge.description && <Text style={[styles.copy, { color: colors.textSecondary }]}>{challenge.description}</Text>}
      <OrbitProgressBar percent={percent} style={styles.challengeProgress} glow={challenge.status !== "completed"} />
      <View style={styles.row}>
        <Text style={[styles.copy, { color: colors.textSecondary }]}>{progress} / {challenge.goal_value} {label}</Text>
        <Text style={[styles.copy, { color: colors.primary }]}>{percent}%</Text>
      </View>
      <Text style={[styles.time, { color: colors.textMuted }]}>{challenge.reward_xp} XP reward · Ends {challenge.end_date}</Text>
    </AppCard>
  );
}

function ProofImage({ objectKey, colors }) {
  const [uri, setUri] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    api.getViewUrl(objectKey)
      .then((result) => { if (active) setUri(result.view_url); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [objectKey]);
  if (failed) return <Text style={[styles.time, { color: colors.textMuted }]}>Proof image unavailable</Text>;
  if (!uri) return <Text style={[styles.time, { color: colors.textMuted }]}>Loading proof image...</Text>;
  return <Image source={{ uri }} style={styles.proofImage} contentFit="cover" />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, container: { padding: spacing.xl, paddingBottom: 100 },
  actions: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }, action: { flex: 1 },
  heroCard: { marginBottom: spacing.lg }, heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md }, heroCopy: { flex: 1 }, heroTitle: { ...typography.h2, marginTop: spacing.xs }, progressBar: { marginTop: spacing.lg },
  inviteCard: { marginBottom: spacing.xl }, smallLabel: { ...typography.caption }, code: { ...typography.h2, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md }, card: { marginBottom: spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg }, sectionTitleInline: { marginTop: 0 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md }, title: { ...typography.h3, flex: 1 }, status: { ...typography.caption, textTransform: "uppercase" },
  copy: { ...typography.body, marginTop: spacing.xs }, track: { height: 9, borderRadius: radii.pill, overflow: "hidden", marginTop: spacing.lg }, fill: { height: "100%" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg }, stat: { width: "50%" }, statValue: { ...typography.h2 }, statLabel: { ...typography.caption, marginTop: 2 },
  contribute: { marginTop: spacing.lg }, activityCard: { marginBottom: spacing.sm }, activityRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md }, activityCopy: { flex: 1 }, activityMessage: { ...typography.bodyBold }, time: { ...typography.caption, marginTop: spacing.xs },
  memberCard: { marginBottom: spacing.sm }, memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.md }, memberCopy: { flex: 1 }, memberName: { ...typography.bodyBold }, dangerButton: { marginTop: spacing.xxl },
  smallButton: { minHeight: 40, paddingHorizontal: spacing.md }, sharedItemCard: { marginBottom: spacing.sm }, sharedItemRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md }, sharedItemCopy: { flex: 1 }, completeButton: { marginTop: spacing.md },
  createCard: { marginTop: spacing.md, marginBottom: spacing.lg }, formInput: { marginTop: spacing.md }, formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }, formAction: { flex: 1 },
  formLabel: { ...typography.caption, marginTop: spacing.md, marginBottom: spacing.sm }, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, chip: { borderWidth: 1, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }, challengeProgress: { marginTop: spacing.md }, completedLabel: { marginTop: spacing.sm, marginBottom: spacing.sm },
  proofToggle: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radii.xl, padding: spacing.md, marginTop: spacing.md }, proofQuote: { ...typography.body, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.lg },
  proofImageButton: { marginTop: spacing.md }, selectedProof: { gap: spacing.sm, marginTop: spacing.md }, proofImage: { width: "100%", height: 220, borderRadius: radii.lg, marginTop: spacing.md },
});
