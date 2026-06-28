import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { PredictiveCoachingCards } from "../components/PredictiveCoachingCards";
import { ScreenHeader } from "../components/ScreenHeader";
import { UserAvatar } from "../components/UserAvatar";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { getOrbitTheme } from "../lib/orbitThemes";
import { gradientContrastInfo, radii, spacing, typography } from "../lib/theme";

const TYPE_LABELS = {
  habit_completions: "habit completions", task_completions: "task completions",
  streak_days: "streak days", xp: "XP", check_in: "check-ins",
};
const CHALLENGE_TYPES = [
  ["actions", "Actions"], ["habits", "Habits"], ["tasks", "Tasks"],
];
const RSVP_OPTIONS = [
  ["attending", "Attending"],
  ["maybe", "Maybe"],
  ["declined", "Declined"],
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
  const [parentDashboard, setParentDashboard] = useState(null);
  const [troopMilestones, setTroopMilestones] = useState([]);
  const [leaderboards, setLeaderboards] = useState(null);
  const [patrolLeaderboard, setPatrolLeaderboard] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [events, setEvents] = useState([]);
  const [readinessByEvent, setReadinessByEvent] = useState({});
  const [patrolReadinessByEvent, setPatrolReadinessByEvent] = useState({});
  const [orbitRecaps, setOrbitRecaps] = useState([]);
  const [predictiveCards, setPredictiveCards] = useState([]);
  const [insightsError, setInsightsError] = useState(null);
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
  const [challengeSeasonId, setChallengeSeasonId] = useState("");
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardCost, setRewardCost] = useState("500");
  const [rewardSeasonId, setRewardSeasonId] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventSeasonId, setEventSeasonId] = useState("");
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonDescription, setSeasonDescription] = useState("");
  const [seasonStartDate, setSeasonStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [seasonEndDate, setSeasonEndDate] = useState(() => {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() + 30);
    return end.toISOString().slice(0, 10);
  });
  const [readinessForm, setReadinessForm] = useState(null);
  const [readinessTitle, setReadinessTitle] = useState("");
  const [readinessDescription, setReadinessDescription] = useState("");
  const [readinessRequired, setReadinessRequired] = useState(true);
  const [showPatrolForm, setShowPatrolForm] = useState(false);
  const [patrolName, setPatrolName] = useState("");
  const [patrolDescription, setPatrolDescription] = useState("");
  const [challengeEndDate, setChallengeEndDate] = useState(() => {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() + 30);
    return end.toISOString().slice(0, 10);
  });

  const load = useCallback(async () => {
    try {
      const [dashboardData, recapData, leaderboardData, patrolLeaderboardData, eventData, seasonData] = await Promise.all([
        api.getOrbitDashboard(orbitId),
        api.getOrbitWeeklyRecaps(orbitId),
        api.getOrbitLeaderboards(orbitId),
        api.getOrbitPatrolLeaderboard(orbitId),
        api.getOrbitEvents(orbitId),
        api.getOrbitSeasons(orbitId),
      ]);
      setDashboard(dashboardData);
      setLeaderboards(leaderboardData);
      setPatrolLeaderboard(patrolLeaderboardData.items || []);
      const eventItems = eventData.items || [];
      setEvents(eventItems);
      setSeasons(seasonData.items || []);
      const [readinessResults, patrolReadinessResults] = await Promise.all([
        Promise.allSettled(eventItems.map((event) => api.getOrbitEventReadiness(orbitId, event.id))),
        Promise.allSettled(eventItems.map((event) => api.getOrbitEventPatrolReadiness(orbitId, event.id))),
      ]);
      const readinessMap = {};
      readinessResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          readinessMap[eventItems[index].id] = result.value;
        }
      });
      setReadinessByEvent(readinessMap);
      const patrolReadinessMap = {};
      patrolReadinessResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          patrolReadinessMap[eventItems[index].id] = result.value;
        }
      });
      setPatrolReadinessByEvent(patrolReadinessMap);
      if (dashboardData.orbit?.template === "scout_troop") {
        api.getOrbitParentDashboard(orbitId)
          .then(setParentDashboard)
          .catch(() => setParentDashboard(null));
        api.getOrbitMilestones(orbitId)
          .then((result) => setTroopMilestones((result.items || []).filter((item) => item.template === "scout_troop")))
          .catch(() => setTroopMilestones([]));
      } else {
        setParentDashboard(null);
        setTroopMilestones([]);
      }
      setOrbitRecaps(recapData.items || []);
      api.getPredictiveCoaching(orbitId)
        .then((result) => setPredictiveCards(result.items || []))
        .catch(() => setPredictiveCards([]));
      setError(null);
    }
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

  async function generateOrbitAIRecap() {
    setBusyItem("orbit-ai-recap");
    try {
      await api.generateOrbitAIWeeklyRecap(orbitId);
      await load();
    } catch (err) {
      Alert.alert("AI recap unavailable", err.message || "The Orbit dashboard is still available.");
    } finally {
      setBusyItem(null);
    }
  }

  async function generateOrbitAIInsights() {
    setBusyItem("orbit-ai-insights");
    setInsightsError(null);
    try {
      await api.generateOrbitAIInsights(orbitId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (err) {
      setInsightsError(err.message || "AI coaching is temporarily unavailable.");
      Alert.alert("Orbit Insights unavailable", err.message || "The Orbit dashboard is still available.");
    } finally {
      setBusyItem(null);
    }
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

  async function createPatrol() {
    const name = patrolName.trim();
    if (!name) {
      Alert.alert("Patrol name required", "Enter a name for this patrol.");
      return;
    }
    setBusyItem("create-patrol");
    try {
      await api.createOrbitPatrol(orbitId, {
        name,
        description: patrolDescription.trim(),
      });
      setPatrolName("");
      setPatrolDescription("");
      setShowPatrolForm(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (err) {
      Alert.alert("Could not create patrol", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  function deletePatrol(patrol) {
    Alert.alert("Delete patrol?", `Delete ${patrol.name}? Members will be unassigned from this patrol.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusyItem(`delete-patrol-${patrol.id}`);
          try {
            await api.deleteOrbitPatrol(orbitId, patrol.id);
            await load();
          } catch (err) {
            Alert.alert("Could not delete patrol", err.message);
          } finally {
            setBusyItem(null);
          }
        },
      },
    ]);
  }

  function assignPatrolMember(patrol, members) {
    const candidates = members.filter((member) => member.patrol_id !== patrol.id);
    if (!candidates.length) {
      Alert.alert("No members available", "Everyone is already assigned to this patrol.");
      return;
    }
    Alert.alert("Assign member", `Choose a member for ${patrol.name}.`, [
      { text: "Cancel", style: "cancel" },
      ...candidates.slice(0, 8).map((member) => ({
        text: member.user?.display_name || member.user?.name || member.user?.username || "Member",
        onPress: async () => {
          setBusyItem(`assign-patrol-${patrol.id}`);
          try {
            await api.assignOrbitPatrolMember(orbitId, patrol.id, member.user_id);
            await load();
          } catch (err) {
            Alert.alert("Could not assign member", err.message);
          } finally {
            setBusyItem(null);
          }
        },
      })),
    ]);
  }

  async function removePatrolMember(patrol, member) {
    setBusyItem(`remove-patrol-${patrol.id}-${member.user_id}`);
    try {
      await api.removeOrbitPatrolMember(orbitId, patrol.id, member.user_id);
      await load();
    } catch (err) {
      Alert.alert("Could not remove member", err.message);
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

  async function aiCheckProof(proof) {
    setBusyItem(`ai-${proof.id}`);
    try {
      await api.aiCheckOrbitProof(orbitId, proof.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (err) {
      Alert.alert("AI check unavailable", err.message || "Manual review is still available.");
    } finally {
      setBusyItem(null);
    }
  }

  function openSeasonForm(season = null) {
    setEditingSeason(season);
    setSeasonTitle(season?.title || "");
    setSeasonDescription(season?.description || "");
    setSeasonStartDate(season?.start_date || new Date().toISOString().slice(0, 10));
    setSeasonEndDate(season?.end_date || (() => {
      const end = new Date();
      end.setUTCDate(end.getUTCDate() + 30);
      return end.toISOString().slice(0, 10);
    })());
    setShowSeasonForm(true);
  }

  async function saveSeason() {
    if (!seasonTitle.trim() || !seasonStartDate.trim() || !seasonEndDate.trim()) {
      Alert.alert("Check season details", "Add a title, start date, and end date.");
      return;
    }
    setBusyItem(editingSeason ? `edit-season-${editingSeason.id}` : "create-season");
    try {
      const body = {
        title: seasonTitle.trim(),
        description: seasonDescription.trim(),
        start_date: seasonStartDate.trim(),
        end_date: seasonEndDate.trim(),
        template: dashboard?.orbit?.template || null,
      };
      if (editingSeason) await api.updateOrbitSeason(orbitId, editingSeason.id, body);
      else await api.createOrbitSeason(orbitId, body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSeasonForm(false);
      setEditingSeason(null);
      await load();
    } catch (err) {
      Alert.alert("Could not save season", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  function deleteSeason(season) {
    Alert.alert("Archive season?", `Archive “${season.title}”? Existing linked items will keep working.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: async () => {
        try { await api.deleteOrbitSeason(orbitId, season.id); await load(); }
        catch (err) { Alert.alert("Could not archive season", err.message); }
      } },
    ]);
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
        season_id: challengeSeasonId || null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowChallengeForm(false);
      setChallengeTitle("");
      setChallengeDescription("");
      setChallengeSeasonId("");
      await load();
    } catch (err) {
      Alert.alert("Could not create challenge", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  function openRewardForm(reward = null) {
    setEditingReward(reward);
    setRewardTitle(reward?.title || "");
    setRewardDescription(reward?.description || "");
    setRewardCost(String(reward?.xp_cost || 500));
    setRewardSeasonId(reward?.season_id || "");
    setShowRewardForm(true);
  }

  async function saveReward() {
    const xpCost = Number(rewardCost);
    if (!rewardTitle.trim() || xpCost < 1) {
      Alert.alert("Check reward details", "Add a title and a positive XP cost.");
      return;
    }
    setBusyItem(editingReward ? `edit-reward-${editingReward.id}` : "create-reward");
    try {
      const body = { title: rewardTitle.trim(), description: rewardDescription.trim(), xp_cost: xpCost, season_id: rewardSeasonId || null };
      if (editingReward) await api.updateOrbitReward(orbitId, editingReward.id, body);
      else await api.createOrbitReward(orbitId, body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowRewardForm(false);
      setEditingReward(null);
      await load();
    } catch (err) { Alert.alert("Could not save reward", err.message); }
    finally { setBusyItem(null); }
  }

  async function redeemReward(reward) {
    setBusyItem(`redeem-reward-${reward.id}`);
    try {
      await api.redeemOrbitReward(orbitId, reward.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (err) { Alert.alert("Could not redeem reward", err.message); }
    finally { setBusyItem(null); }
  }

  function deleteReward(reward) {
    Alert.alert("Delete Orbit reward?", `Delete “${reward.title}”?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await api.deleteOrbitReward(orbitId, reward.id); await load(); }
        catch (err) { Alert.alert("Could not delete reward", err.message); }
      } },
    ]);
  }

  function openEventForm(event = null) {
    setEditingEvent(event);
    setEventTitle(event?.title || "");
    setEventDescription(event?.description || "");
    setEventLocation(event?.location || "");
    setEventStart(event?.start_time ? event.start_time.slice(0, 16) : "");
    setEventEnd(event?.end_time ? event.end_time.slice(0, 16) : "");
    setEventSeasonId(event?.season_id || "");
    setShowEventForm(true);
  }

  async function saveEvent() {
    if (!eventTitle.trim() || !eventStart.trim()) {
      Alert.alert("Check event details", "Add a title and start date/time.");
      return;
    }
    setBusyItem(editingEvent ? `edit-event-${editingEvent.id}` : "create-event");
    try {
      const body = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        location: eventLocation.trim(),
        start_time: eventStart.trim(),
        end_time: eventEnd.trim() || null,
        season_id: eventSeasonId || null,
      };
      if (editingEvent) await api.updateOrbitEvent(orbitId, editingEvent.id, body);
      else await api.createOrbitEvent(orbitId, body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEventForm(false);
      setEditingEvent(null);
      await load();
    } catch (err) {
      Alert.alert("Could not save event", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  function deleteEvent(event) {
    Alert.alert("Delete Orbit event?", `Delete “${event.title}”?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.deleteOrbitEvent(orbitId, event.id);
          await load();
        } catch (err) {
          Alert.alert("Could not delete event", err.message);
        }
      } },
    ]);
  }

  async function rsvpEvent(event, status) {
    setBusyItem(`event-rsvp-${event.id}`);
    try {
      await api.rsvpOrbitEvent(orbitId, event.id, status);
      await Haptics.selectionAsync();
      await load();
    } catch (err) {
      Alert.alert("Could not update RSVP", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  function openReadinessForm(event, item = null) {
    setReadinessForm({ event, item });
    setReadinessTitle(item?.title || "");
    setReadinessDescription(item?.description || "");
    setReadinessRequired(item?.required !== false);
  }

  async function saveReadinessItem() {
    if (!readinessForm?.event || !readinessTitle.trim()) {
      Alert.alert("Checklist item required", "Add a title for the readiness item.");
      return;
    }
    const { event, item } = readinessForm;
    setBusyItem(item ? `readiness-edit-${item.id}` : `readiness-create-${event.id}`);
    try {
      const body = {
        title: readinessTitle.trim(),
        description: readinessDescription.trim(),
        required: readinessRequired,
      };
      const readiness = item
        ? await api.updateOrbitEventReadinessItem(orbitId, event.id, item.id, body)
        : await api.createOrbitEventReadinessItem(orbitId, event.id, body);
      setReadinessByEvent((current) => ({ ...current, [event.id]: readiness }));
      setReadinessForm(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert("Could not save checklist item", err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function deleteReadinessItem(event, item) {
    Alert.alert("Delete checklist item?", `Delete “${item.title}”?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const readiness = await api.deleteOrbitEventReadinessItem(orbitId, event.id, item.id);
          setReadinessByEvent((current) => ({ ...current, [event.id]: readiness }));
        } catch (err) {
          Alert.alert("Could not delete checklist item", err.message);
        }
      } },
    ]);
  }

  async function toggleReadinessItem(event, item) {
    setBusyItem(`readiness-${item.id}`);
    try {
      const readiness = item.completed
        ? await api.uncompleteOrbitEventReadinessItem(orbitId, event.id, item.id)
        : await api.completeOrbitEventReadinessItem(orbitId, event.id, item.id);
      setReadinessByEvent((current) => ({ ...current, [event.id]: readiness }));
      await Haptics.selectionAsync();
    } catch (err) {
      Alert.alert("Could not update checklist", err.message);
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
    patrols = [],
    recent_activity: recentActivity = [],
    shared_habits: sharedHabits = [],
    shared_tasks: sharedTasks = [],
    active_challenges: activeChallenges = [],
    completed_challenges: completedChallenges = [],
    orbit_achievements: orbitAchievements = [],
    recent_achievement_unlocks: recentAchievementUnlocks = [],
    recent_milestones: recentMilestones = [],
    milestone_count: milestoneCount = 0,
    active_rewards: activeRewards = [],
    redeemed_rewards: redeemedRewards = [],
    health_score: healthScore = 0,
    health_trend: healthTrend = "stable",
    health_change: healthChange = 0,
    health_breakdown: healthBreakdown = {},
    health_summary: healthSummary = "",
    pending_proof_count: pendingProofCount = 0,
    pending_proofs: pendingProofs = [],
  } = dashboard;
  const level = orbit.level || 1;
  const xp = orbit.xp || 0;
  const xpProgress = orbit.xp_progress || 0;
  const xpNeeded = orbit.xp_needed_for_next_level || 100;
  const xpPercent = orbit.xp_progress_percent || 0;
  const canManage = orbit.viewer_role === "owner" || orbit.viewer_role === "admin";
  const showPatrols = orbit.template === "scout_troop" || patrols.length > 0;
  const orbitTheme = getOrbitTheme(orbit.theme || orbit.theme_id);
  const bannerContrast = gradientContrastInfo(orbitTheme.gradient);
  const bannerTextColor = orbitTheme.text_color || bannerContrast.textColor;
  const bannerSecondaryColor = bannerContrast.secondaryTextColor || bannerTextColor;
  const bannerAccent = orbitTheme.accent || bannerTextColor;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader title={orbit.name} subtitle={orbit.description || "A private Shared Orbit."} />
      <LinearGradient colors={orbitTheme.gradient} style={styles.orbitBanner}>
        {bannerContrast.needsScrim ? <View style={styles.orbitBannerScrim} /> : null}
        <View style={styles.orbitBannerContent}>
          <View style={styles.heroCopy}>
            <Text style={[styles.smallLabel, { color: bannerSecondaryColor }]}>Shared Orbit</Text>
            <Text style={[styles.orbitBannerTitle, { color: bannerTextColor }]}>{orbit.name}</Text>
            <Text style={[styles.copy, { color: bannerSecondaryColor }]}>
              Level {level} · {stats.member_count} member{stats.member_count === 1 ? "" : "s"} · {xp} XP
            </Text>
          </View>
          <MaterialCommunityIcons name="orbit" size={44} color={bannerAccent} />
        </View>
        <OrbitProgressBar percent={xpPercent} style={styles.progressBar} glow color={bannerAccent} />
        <Text style={[styles.time, { color: bannerSecondaryColor }]}>{xpProgress} / {xpNeeded} XP to next level</Text>
      </LinearGradient>

      <AppCard style={styles.healthCard}>
        <View style={styles.row}>
          <View>
            <Text style={[styles.smallLabel, { color: c.textSecondary }]}>Orbit Health</Text>
            <Text style={[styles.healthScore, { color: c.text }]}>{healthScore}/100</Text>
          </View>
          <View style={[styles.healthTrend, { backgroundColor: c.surfaceAlt }]}>
            <MaterialCommunityIcons name={healthTrend === "up" ? "trending-up" : healthTrend === "down" ? "trending-down" : "trending-neutral"} size={20} color={healthTrend === "up" ? c.success : healthTrend === "down" ? c.danger : c.textMuted} />
            <Text style={[styles.memberName, { color: healthTrend === "up" ? c.success : healthTrend === "down" ? c.danger : c.textMuted }]}>{healthChange > 0 ? "+" : ""}{healthChange}</Text>
          </View>
        </View>
        <OrbitProgressBar percent={healthScore} style={styles.progressBar} />
        <Text style={[styles.copy, { color: c.textSecondary }]}>{healthSummary}</Text>
        <View style={styles.healthBreakdown}>
          {[["Completion", "completion", 40], ["Members", "members", 25], ["Challenges", "challenges", 15], ["Streaks", "streaks", 10], ["Activity", "activity", 10]].map(([label, key, max]) => <View key={key} style={styles.healthMetric}>
            <Text style={[styles.time, { color: c.textMuted }]}>{label}</Text>
            <Text style={[styles.memberName, { color: c.text }]}>{healthBreakdown[key] || 0}/{max}</Text>
          </View>)}
        </View>
      </AppCard>

      <View style={styles.actions}>
        <AppButton title="Members" variant="secondary" style={styles.action} onPress={() => router.push({ pathname: "/orbit-members", params: { orbitId } })} />
        <AppButton title="Switch Orbit" variant="secondary" style={styles.action} onPress={() => router.push("/orbits")} />
        <AppButton title="Projects" variant="secondary" style={styles.action} onPress={() => router.push({ pathname: "/projects", params: { orbitId, orbitName: orbit.name } })} />
        {canManage && <AppButton title={pendingProofCount ? `Verify (${pendingProofCount})` : "Verify"} variant="secondary" style={styles.action} onPress={() => router.push({ pathname: "/orbit-verifications", params: { orbitId, orbitName: orbit.name } })} />}
        {canManage && <AppButton title="Theme" variant="secondary" style={styles.action} onPress={() => router.push({ pathname: "/orbit-theme-settings", params: { orbitId } })} />}
        {canManage && <AppButton title="New goal" style={styles.action} onPress={() => router.push({ pathname: "/create-orbit-goal", params: { orbitId } })} />}
      </View>

      <AppCard style={styles.orbitNavCard}>
        <View style={styles.orbitNavRow}>
          <AppButton title="Overview" variant="secondary" style={styles.orbitNavButton} disabled />
          <AppButton title="Projects" variant="secondary" style={styles.orbitNavButton} onPress={() => router.push({ pathname: "/projects", params: { orbitId, orbitName: orbit.name } })} />
          <AppButton title="Milestones" variant="secondary" style={styles.orbitNavButton} onPress={() => router.push({ pathname: "/orbit-milestones", params: { orbitId, orbitName: orbit.name, canSync: canManage ? "true" : "false" } })} />
          <AppButton title="Timeline" variant="secondary" style={styles.orbitNavButton} onPress={() => router.push({ pathname: "/orbit-timeline", params: { orbitId, orbitName: orbit.name, canManage: canManage ? "true" : "false" } })} />
        </View>
      </AppCard>

      {canManage && <AppCard style={styles.quickActionsCard}>
        <View style={styles.sectionHeaderCompact}>
          <Text style={[styles.title, { color: c.text }]}>Orbit quick actions</Text>
          <Text style={[styles.time, { color: c.textMuted }]}>Create shared work</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          <QuickAction icon="repeat" label="Habit" colors={c} onPress={() => openCreate("habit")} />
          <QuickAction icon="check-circle-outline" label="Task" colors={c} onPress={() => openCreate("task")} />
          <QuickAction icon="clipboard-list-outline" label="Project" colors={c} onPress={() => router.push({ pathname: "/create-project", params: { orbitId, orbitName: orbit.name } })} />
          <QuickAction icon="gift-outline" label="Reward" colors={c} onPress={() => openRewardForm()} />
          <QuickAction icon="calendar-plus" label="Event" colors={c} onPress={() => openEventForm()} />
        </View>
      </AppCard>}

      {!!recentActivity.length && <AppCard style={styles.activityPreviewCard}>
        <View style={styles.sectionHeaderCompact}>
          <Text style={[styles.title, { color: c.text }]}>Latest Orbit activity</Text>
          <Text style={[styles.time, { color: c.textMuted }]}>Live momentum</Text>
        </View>
        {recentActivity.slice(0, 3).map((item) => (
          <View key={`preview-${item.id}`} style={styles.activityPreviewRow}>
            <MaterialCommunityIcons name="timeline-outline" size={20} color={c.primary} />
            <View style={styles.activityCopy}>
              <Text style={[styles.activityMessage, { color: c.text }]} numberOfLines={2}>{item.message}</Text>
              <Text style={[styles.time, { color: c.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </AppCard>}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Seasons</Text>
        {canManage && <AppButton title="Create" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={() => openSeasonForm()} disabled={!!busyItem} />}
      </View>
      {!!showSeasonForm && <AppCard style={styles.createCard}>
        <Text style={[styles.title, { color: c.text }]}>{editingSeason ? "Edit season" : "New season"}</Text>
        <AppInput value={seasonTitle} onChangeText={setSeasonTitle} placeholder="Season title" maxLength={120} style={styles.formInput} />
        <AppInput value={seasonDescription} onChangeText={setSeasonDescription} placeholder="Description (optional)" maxLength={1000} style={styles.formInput} />
        <AppInput value={seasonStartDate} onChangeText={setSeasonStartDate} placeholder="Start date: YYYY-MM-DD" style={styles.formInput} />
        <AppInput value={seasonEndDate} onChangeText={setSeasonEndDate} placeholder="End date: YYYY-MM-DD" style={styles.formInput} />
        <View style={styles.formActions}>
          <AppButton title="Cancel" variant="secondary" style={styles.formAction} onPress={() => { setShowSeasonForm(false); setEditingSeason(null); }} disabled={!!busyItem} />
          <AppButton title="Save" style={styles.formAction} onPress={saveSeason} disabled={!!busyItem || !seasonTitle.trim()} />
        </View>
      </AppCard>}
      {seasons.length ? seasons.map((season) => (
        <AppCard key={season.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.activityCopy}>
              <Text style={[styles.title, { color: c.text }]}>{season.title}</Text>
              {!!season.description && <Text style={[styles.copy, { color: c.textSecondary }]}>{season.description}</Text>}
              <Text style={[styles.time, { color: c.textMuted }]}>{season.start_date} → {season.end_date}</Text>
            </View>
            <Text style={[styles.status, { color: c.primary }]}>{season.days_remaining}d</Text>
          </View>
          <View style={styles.seasonStats}>
            <Stat label="Challenges" value={season.challenge_count || 0} color={c.text} labelColor={c.textSecondary} />
            <Stat label="Events" value={season.event_count || 0} color={c.text} labelColor={c.textSecondary} />
            <Stat label="Milestones" value={season.milestone_count || 0} color={c.text} labelColor={c.textSecondary} />
            <Stat label="Rewards" value={season.reward_count || 0} color={c.text} labelColor={c.textSecondary} />
          </View>
          {canManage && <View style={styles.formActions}>
            <AppButton title="Edit" variant="secondary" style={styles.formAction} onPress={() => openSeasonForm(season)} disabled={!!busyItem} />
            <AppButton title="Archive" variant="secondary" style={styles.formAction} onPress={() => deleteSeason(season)} disabled={!!busyItem} />
          </View>}
        </AppCard>
      )) : <AppCard style={styles.card}><EmptyState compact title="No seasons yet" description="Create a time-bound season to group challenges, events, rewards, and milestones." icon={<MaterialCommunityIcons name="calendar-star" size={40} color={c.primary} />} /></AppCard>}

      {showPatrols && <>
        <ParentDashboardCard parentDashboard={parentDashboard} colors={c} />
        <TroopMilestonesCard milestones={troopMilestones} colors={c} />
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Patrols</Text>
          {canManage && <AppButton title="Create" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={() => setShowPatrolForm((value) => !value)} disabled={!!busyItem} />}
        </View>
        {!!patrolLeaderboard.length && <AppCard style={styles.card}>
          <Text style={[styles.title, { color: c.text }]}>Patrol Leaderboard</Text>
          {patrolLeaderboard.slice(0, 5).map((item) => (
            <View key={item.patrol_id} style={styles.patrolLeaderboardRow}>
              <Text style={[styles.leaderboardRank, { color: item.rank === 1 ? c.primary : c.textMuted }]}>#{item.rank}</Text>
              <View style={styles.activityCopy}>
                <Text style={[styles.memberName, { color: c.text }]}>{item.patrol_name}</Text>
                <Text style={[styles.time, { color: c.textSecondary }]}>{item.member_count} member{item.member_count === 1 ? "" : "s"} · {item.average_xp} avg XP</Text>
              </View>
              <Text style={[styles.memberName, { color: c.primary }]}>{item.total_xp} XP</Text>
            </View>
          ))}
        </AppCard>}
        {!!showPatrolForm && <AppCard style={styles.createCard}>
          <Text style={[styles.title, { color: c.text }]}>New patrol</Text>
          <AppInput value={patrolName} onChangeText={setPatrolName} placeholder="Patrol name" maxLength={80} style={styles.formInput} />
          <AppInput value={patrolDescription} onChangeText={setPatrolDescription} placeholder="Description (optional)" maxLength={500} style={styles.formInput} />
          <View style={styles.formActions}>
            <AppButton title="Cancel" variant="secondary" style={styles.formAction} onPress={() => setShowPatrolForm(false)} disabled={!!busyItem} />
            <AppButton title="Create" style={styles.formAction} onPress={createPatrol} disabled={!!busyItem || !patrolName.trim()} />
          </View>
        </AppCard>}
        {patrols.length ? patrols.map((patrol) => (
          <AppCard key={patrol.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.activityCopy}>
                <Text style={[styles.title, { color: c.text }]}>{patrol.name}</Text>
                {!!patrol.description && <Text style={[styles.copy, { color: c.textSecondary }]}>{patrol.description}</Text>}
                {!!patrol.leader && <Text style={[styles.time, { color: c.textMuted }]}>Leader: {patrol.leader.display_name || patrol.leader.name || patrol.leader.username}</Text>}
              </View>
              <Text style={[styles.status, { color: c.primary }]}>{patrol.member_count || 0}</Text>
            </View>
            {(patrol.members || []).map((member) => (
              <View key={member.user_id} style={styles.patrolMemberRow}>
                <UserAvatar user={member.user} size={28} icon="account-circle" color={c.primary} backgroundColor={c.surfaceAlt} />
                <Text style={[styles.memberName, styles.patrolMemberName, { color: c.text }]}>{member.user?.display_name || member.user?.name || member.user?.username || "Member"}</Text>
                {canManage && <AppButton title="Remove" variant="ghost" fullWidth={false} onPress={() => removePatrolMember(patrol, member)} disabled={!!busyItem} />}
              </View>
            ))}
            {canManage && <View style={styles.formActions}>
              <AppButton title="Assign member" variant="secondary" style={styles.formAction} onPress={() => assignPatrolMember(patrol, members)} disabled={!!busyItem} />
              <AppButton title="Delete" variant="secondary" style={styles.formAction} onPress={() => deletePatrol(patrol)} disabled={!!busyItem} />
            </View>}
          </AppCard>
        )) : <AppCard style={styles.card}><EmptyState compact title="No patrols yet" description="Create patrols to organize this Scout Troop Orbit." icon={<MaterialCommunityIcons name="account-group-outline" size={40} color={c.primary} />} /></AppCard>}
      </>}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Orbit Events</Text>
        {canManage && <AppButton title="Create" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={() => openEventForm()} disabled={!!busyItem} />}
      </View>
      {!!showEventForm && <AppCard style={styles.createCard}>
        <Text style={[styles.title, { color: c.text }]}>{editingEvent ? "Edit Orbit event" : "New Orbit event"}</Text>
        <AppInput value={eventTitle} onChangeText={setEventTitle} placeholder="Event title" maxLength={120} style={styles.formInput} />
        <AppInput value={eventDescription} onChangeText={setEventDescription} placeholder="Description (optional)" maxLength={1000} style={styles.formInput} />
        <AppInput value={eventLocation} onChangeText={setEventLocation} placeholder="Location (optional)" maxLength={240} style={styles.formInput} />
        <AppInput value={eventStart} onChangeText={setEventStart} placeholder="Start: YYYY-MM-DDTHH:mm" style={styles.formInput} />
        <AppInput value={eventEnd} onChangeText={setEventEnd} placeholder="End: YYYY-MM-DDTHH:mm (optional)" style={styles.formInput} />
        <SeasonSelector seasons={seasons} selectedId={eventSeasonId} onSelect={setEventSeasonId} colors={c} />
        <View style={styles.formActions}>
          <AppButton title="Cancel" variant="secondary" style={styles.formAction} onPress={() => { setShowEventForm(false); setEditingEvent(null); }} disabled={!!busyItem} />
          <AppButton title="Save" style={styles.formAction} onPress={saveEvent} disabled={!!busyItem} />
        </View>
      </AppCard>}
      {events.length ? events.map((event) => <View key={event.id}>
        <OrbitEventCard
          event={event}
          readiness={readinessByEvent[event.id]}
          patrolReadiness={patrolReadinessByEvent[event.id]}
          colors={c}
          canManage={canManage}
          busy={!!busyItem}
          onEdit={() => openEventForm(event)}
          onDelete={() => deleteEvent(event)}
          onRsvp={(status) => rsvpEvent(event, status)}
          onCreateReadiness={() => openReadinessForm(event)}
          onEditReadiness={(item) => openReadinessForm(event, item)}
          onDeleteReadiness={(item) => deleteReadinessItem(event, item)}
          onToggleReadiness={(item) => toggleReadinessItem(event, item)}
        />
        {readinessForm?.event?.id === event.id && <AppCard style={styles.createCard}>
          <Text style={[styles.title, { color: c.text }]}>{readinessForm.item ? "Edit readiness item" : "New readiness item"}</Text>
          <AppInput value={readinessTitle} onChangeText={setReadinessTitle} placeholder="Checklist item" maxLength={140} style={styles.formInput} />
          <AppInput value={readinessDescription} onChangeText={setReadinessDescription} placeholder="Description (optional)" maxLength={500} style={styles.formInput} />
          <Pressable onPress={() => setReadinessRequired((value) => !value)} style={[styles.proofToggle, { borderColor: readinessRequired ? c.primary : c.border, backgroundColor: readinessRequired ? `${c.primary}16` : c.surfaceAlt }]}>
            <MaterialCommunityIcons name={readinessRequired ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={22} color={readinessRequired ? c.primary : c.textMuted} />
            <Text style={[styles.copy, { color: c.text }]}>Required for readiness percentage</Text>
          </Pressable>
          <View style={styles.formActions}>
            <AppButton title="Cancel" variant="secondary" style={styles.formAction} onPress={() => setReadinessForm(null)} disabled={!!busyItem} />
            <AppButton title="Save" style={styles.formAction} onPress={saveReadinessItem} disabled={!!busyItem} />
          </View>
        </AppCard>}
      </View>) : <AppCard style={styles.card}><EmptyState compact title="No Orbit events" description="Add meetings, campouts, workouts, or study sessions for this Orbit." icon={<MaterialCommunityIcons name="calendar-month-outline" size={40} color={c.primary} />} /></AppCard>}

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

      <Text style={[styles.sectionTitle, { color: c.text }]}>Leaderboards</Text>
      <Text style={[styles.copy, styles.leaderboardIntro, { color: c.textSecondary }]}>Friendly rankings from shared Orbit activity this week.</Text>
      <View style={styles.leaderboardGrid}>
        <LeaderboardCard title="Weekly XP" metric="XP" items={leaderboards?.weekly_xp} colors={c} />
        <LeaderboardCard title="Shared habits" metric="habits" items={leaderboards?.habit_completions} colors={c} />
        <LeaderboardCard title="Shared tasks" metric="tasks" items={leaderboards?.task_completions} colors={c} />
        <LeaderboardCard title="Current streak" metric="days" items={leaderboards?.streaks} colors={c} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Orbit Rewards</Text>
        {canManage && <AppButton title="Create" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={() => openRewardForm()} disabled={!!busyItem} />}
      </View>
      {!!showRewardForm && <AppCard style={styles.createCard}>
        <Text style={[styles.title, { color: c.text }]}>{editingReward ? "Edit Orbit reward" : "New Orbit reward"}</Text>
        <AppInput value={rewardTitle} onChangeText={setRewardTitle} placeholder="Reward title" maxLength={100} style={styles.formInput} />
        <AppInput value={rewardDescription} onChangeText={setRewardDescription} placeholder="Description (optional)" maxLength={500} style={styles.formInput} />
        <AppInput value={rewardCost} onChangeText={setRewardCost} placeholder="XP cost" keyboardType="number-pad" style={styles.formInput} />
        <SeasonSelector seasons={seasons} selectedId={rewardSeasonId} onSelect={setRewardSeasonId} colors={c} />
        <View style={styles.formActions}>
          <AppButton title="Cancel" variant="secondary" style={styles.formAction} onPress={() => { setShowRewardForm(false); setEditingReward(null); }} disabled={!!busyItem} />
          <AppButton title="Save" style={styles.formAction} onPress={saveReward} disabled={!!busyItem} />
        </View>
      </AppCard>}
      {activeRewards.length ? activeRewards.map((reward) => <OrbitRewardCard key={reward.id} reward={reward} colors={c} canManage={canManage} busy={!!busyItem} onEdit={() => openRewardForm(reward)} onDelete={() => deleteReward(reward)} onRedeem={() => redeemReward(reward)} />) : <AppCard style={styles.card}><EmptyState compact title="No Orbit rewards" description="Create a shared reward worth working toward together." icon={<MaterialCommunityIcons name="gift-outline" size={40} color={c.primary} />} /></AppCard>}
      {!!redeemedRewards.length && <>
        <Text style={[styles.smallLabel, styles.completedLabel, { color: c.textSecondary }]}>Redeemed</Text>
        {redeemedRewards.slice(0, 3).map((reward) => <OrbitRewardCard key={reward.id} reward={reward} colors={c} canManage={false} busy={false} />)}
      </>}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Orbit Milestones</Text>
        <AppButton
          title="View all"
          variant="ghost"
          fullWidth={false}
          style={styles.smallButton}
          onPress={() => router.push({
            pathname: "/orbit-milestones",
            params: {
              orbitId,
              orbitName: orbit.name,
              canSync: canManage ? "true" : "false",
            },
          })}
        />
      </View>
      {recentMilestones.length ? <AppCard style={[styles.card, styles.milestoneCard, { borderColor: c.primary }] }>
        <View style={styles.milestoneHeader}>
          <MaterialCommunityIcons name="party-popper" size={28} color={c.primary} />
          <View style={styles.activityCopy}>
            <Text style={[styles.memberName, { color: c.text }]}>Shared celebrations</Text>
            <Text style={[styles.time, { color: c.textMuted }]}>{milestoneCount} milestone{milestoneCount === 1 ? "" : "s"} unlocked</Text>
          </View>
        </View>
        {recentMilestones.map((milestone) => <View key={milestone.id || milestone.milestone_id} style={styles.milestoneRow}>
          <View style={[styles.milestoneIcon, { backgroundColor: `${milestone.color || c.primary}20` }]}>
            <MaterialCommunityIcons name={milestone.icon || "star-four-points"} size={24} color={milestone.color || c.primary} />
          </View>
          <View style={styles.activityCopy}>
            <Text style={[styles.memberName, { color: c.text }]}>{milestone.title}</Text>
            <Text style={[styles.copy, { color: c.textSecondary }]}>{milestone.description}</Text>
            {!!milestone.unlocked_at && <Text style={[styles.time, { color: c.textMuted }]}>Unlocked {new Date(milestone.unlocked_at).toLocaleDateString()}</Text>}
          </View>
        </View>)}
      </AppCard> : <AppCard style={styles.card}>
        <Text style={[styles.copy, { color: c.textSecondary }]}>Major shared accomplishments will be celebrated here. View all milestones to see what this Orbit is working toward next.</Text>
      </AppCard>}

      <Text style={[styles.sectionTitle, { color: c.text }]}>Orbit Achievements</Text>
      {!!recentAchievementUnlocks.length && <AppCard style={styles.card}>
        <Text style={[styles.smallLabel, { color: c.textSecondary }]}>Recent unlocks</Text>
        {recentAchievementUnlocks.map((achievement) => <View key={achievement.id} style={styles.achievementUnlock}>
          <MaterialCommunityIcons name="trophy-award" size={24} color={achievement.color || c.primary} />
          <View style={styles.activityCopy}>
            <Text style={[styles.memberName, { color: c.text }]}>{achievement.name}</Text>
            <Text style={[styles.time, { color: c.textMuted }]}>{achievement.description}</Text>
          </View>
        </View>)}
      </AppCard>}
      <AppCard style={styles.card}>
        {orbitAchievements.length ? orbitAchievements.map((achievement) => <View key={achievement.id} style={styles.achievementRow}>
          <View style={styles.row}>
            <Text style={[styles.memberName, { color: c.text }]}>{achievement.earned ? "✓ " : ""}{achievement.name}</Text>
            <Text style={[styles.time, { color: achievement.earned ? c.success : c.textMuted }]}>{achievement.progress} / {achievement.target}</Text>
          </View>
          <View style={[styles.achievementTrack, { backgroundColor: c.surfaceAlt }]}><View style={[styles.fill, { width: `${achievement.percent || 0}%`, backgroundColor: achievement.color || c.primary }]} /></View>
        </View>) : <Text style={[styles.copy, { color: c.textSecondary }]}>Orbit achievement progress will appear as members build momentum.</Text>}
      </AppCard>

      <AppCard style={styles.inviteCard}>
        <Text style={[styles.smallLabel, { color: c.textSecondary }]}>Invite code</Text>
        <Text selectable style={[styles.code, { color: c.text }]}>{orbit.invite_code}</Text>
      </AppCard>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: c.text }]}>Challenges</Text>
        {canManage && <AppButton title="Create" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={() => setShowChallengeForm((value) => !value)} disabled={!!busyItem} />}
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
        <SeasonSelector seasons={seasons} selectedId={challengeSeasonId} onSelect={setChallengeSeasonId} colors={c} />
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
        canCreate={canManage}
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
        canCreate={canManage}
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
        {proof.ai_status === "completed" && <View style={[styles.aiRecommendation, { backgroundColor: c.surfaceAlt }]}>
          <Text style={[styles.aiTitle, { color: c.text }]}>AI recommendation: {proof.ai_recommendation || "uncertain"}</Text>
          <Text style={[styles.time, { color: c.textMuted }]}>{Math.round((proof.ai_confidence || 0) * 100)}% confidence</Text>
          {!!proof.ai_reason && <Text style={[styles.copy, { color: c.textSecondary }]}>{proof.ai_reason}</Text>}
        </View>}
        {proof.ai_status === "failed" && !!proof.ai_reason && <Text style={[styles.copy, { color: c.danger }]}>{proof.ai_reason}</Text>}
        <AppButton title={proof.ai_status === "pending" ? "Checking..." : "AI Check"} variant="secondary" style={styles.proofImageButton} onPress={() => aiCheckProof(proof)} disabled={!!busyItem || proof.ai_status === "pending"} />
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

      <Text style={[styles.sectionTitle, { color: c.text }]}>Weekly Orbit Recap</Text>
      <AppCard style={styles.card}>
        {orbitRecaps[0]?.ai_recap ? <OrbitAIRecap recap={orbitRecaps[0].ai_recap} colors={c} /> : <Text style={[styles.copy, { color: c.textSecondary }]}>Generate a shared reflection from this Orbit&apos;s completions, challenges, XP, and proof reviews.</Text>}
        <AppButton title={busyItem === "orbit-ai-recap" ? "Generating..." : orbitRecaps[0]?.ai_recap ? "Refresh AI Recap" : "Generate AI Recap"} onPress={generateOrbitAIRecap} disabled={!!busyItem} style={styles.contribute} />
      </AppCard>

      {!!predictiveCards.length && <>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Predictive Coaching</Text>
        <PredictiveCoachingCards
          cards={predictiveCards}
          colors={c}
          onDismiss={(id) => setPredictiveCards((cards) => cards.filter((card) => card.id !== id))}
        />
      </>}

      <Text style={[styles.sectionTitle, { color: c.text }]}>AI Orbit Coach</Text>
      <AppCard style={styles.card}>
        {orbitRecaps[0]?.ai_insights ? <OrbitAIInsights insights={orbitRecaps[0].ai_insights} colors={c} /> : <Text style={[styles.copy, { color: c.textSecondary }]}>Get practical coaching based on this Orbit&apos;s participation, progress, streaks, and challenges.</Text>}
        {!!orbitRecaps[0]?.ai_insights_generated_at && <Text style={[styles.time, { color: c.textMuted }]}>Last generated {new Date(orbitRecaps[0].ai_insights_generated_at).toLocaleString()}</Text>}
        {!!insightsError && <Text style={[styles.copy, { color: c.danger }]}>{insightsError}</Text>}
        <AppButton title="Chat with Coach" variant="secondary" onPress={() => router.push({ pathname: "/ai-coach", params: { orbitId } })} disabled={!!busyItem} style={styles.contribute} />
        <AppButton title={busyItem === "orbit-ai-insights" ? "Generating..." : orbitRecaps[0]?.ai_insights ? "Refresh Insights" : "Generate Insights"} onPress={generateOrbitAIInsights} disabled={!!busyItem} style={styles.contribute} />
      </AppCard>

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
              <View style={styles.memberMetaRow}><View style={[styles.roleBadge, { backgroundColor: c.surfaceAlt }]}><Text style={[styles.time, { color: c.primary, textTransform: "capitalize" }]}>{member.role}</Text></View><Text style={[styles.time, { color: c.textSecondary }]}>Level {member.user?.level || 1}</Text></View>
            </View>
          </View>
        </AppCard>
      ))}

      <AppButton title={orbit.viewer_role === "owner" ? "Delete Orbit" : "Leave Orbit"} variant="secondary" onPress={leaveOrDelete} style={styles.dangerButton} />
    </ScrollView>
  );
}

function QuickAction({ icon, label, colors, onPress }) {
  return (
    <Pressable style={[styles.quickAction, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}16` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
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

function SeasonSelector({ seasons, selectedId, onSelect, colors }) {
  if (!seasons.length) return null;
  return (
    <View style={styles.seasonSelector}>
      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Season</Text>
      <View style={styles.chips}>
        <Pressable
          onPress={() => onSelect("")}
          style={[
            styles.chip,
            {
              borderColor: !selectedId ? colors.primary : colors.border,
              backgroundColor: !selectedId ? `${colors.primary}16` : colors.surfaceAlt,
            },
          ]}
        >
          <Text style={[styles.time, { color: colors.text }]}>None</Text>
        </Pressable>
        {seasons.map((season) => (
          <Pressable
            key={season.id}
            onPress={() => onSelect(season.id)}
            style={[
              styles.chip,
              {
                borderColor: selectedId === season.id ? colors.primary : colors.border,
                backgroundColor: selectedId === season.id ? `${colors.primary}16` : colors.surfaceAlt,
              },
            ]}
          >
            <Text style={[styles.time, { color: colors.text }]}>{season.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function LeaderboardCard({ title, metric, items = [], colors }) {
  return <AppCard style={styles.leaderboardCard}>
    <Text style={[styles.memberName, { color: colors.text }]}>{title}</Text>
    {items.slice(0, 3).map((item) => <View key={item.user_id} style={styles.leaderboardRow}>
      <Text style={[styles.leaderboardRank, { color: item.rank === 1 ? colors.primary : colors.textMuted }]}>#{item.rank}</Text>
      <UserAvatar user={item} size={32} icon="account-circle" color={colors.primary} backgroundColor={colors.surfaceAlt} />
      <View style={styles.leaderboardName}>
        <Text numberOfLines={1} style={[styles.memberName, { color: colors.text }]}>{item.display_name}</Text>
        <Text style={[styles.time, { color: colors.textMuted, textTransform: "capitalize" }]}>{item.role}</Text>
      </View>
      <Text style={[styles.memberName, { color: colors.primary }]}>{item.score} {metric}</Text>
    </View>)}
  </AppCard>;
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
  canCreate,
  onCreate,
  onComplete,
}) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: colors.text }]}>{title}</Text>
        {canCreate && <AppButton title="Create" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={onCreate} disabled={!!busyItem} />}
      </View>
      {items.length ? items.map((item) => {
        const completed = itemType === "habit" ? item.completed_today : item.completed;
        return <AppCard key={item.id} style={styles.sharedItemCard}>
          <View style={styles.sharedItemRow}>
            <MaterialCommunityIcons name={completed ? "check-circle" : icon} size={28} color={completed ? colors.success : colors.primary} />
            <View style={styles.sharedItemCopy}>
              <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.time, { color: colors.primary }]}>Shared Orbit</Text>
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

function OrbitRewardCard({ reward, colors, canManage, busy, onEdit, onDelete, onRedeem }) {
  return <AppCard style={styles.card}>
    <View style={styles.row}><Text style={[styles.title, { color: colors.text }]}>{reward.title}</Text><Text style={[styles.status, { color: reward.redeemed ? colors.success : colors.primary }]}>{reward.redeemed ? "redeemed" : `${reward.xp_cost} XP`}</Text></View>
    {!!reward.description && <Text style={[styles.copy, { color: colors.textSecondary }]}>{reward.description}</Text>}
    <OrbitProgressBar percent={reward.progress_percent || 0} style={styles.progressBar} />
    <Text style={[styles.time, { color: colors.textMuted }]}>{reward.progress_xp || 0} / {reward.xp_cost} XP</Text>
    {canManage && !reward.redeemed && <View style={styles.formActions}>
      <AppButton title="Edit" variant="secondary" style={styles.formAction} onPress={onEdit} disabled={busy} />
      <AppButton title="Delete" variant="secondary" style={styles.formAction} onPress={onDelete} disabled={busy} />
      {reward.redeemable && <AppButton title="Redeem" style={styles.formAction} onPress={onRedeem} disabled={busy} />}
    </View>}
  </AppCard>;
}

function ParentDashboardCard({ parentDashboard, colors }) {
  if (!parentDashboard) {
    return <AppCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.activityCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Parent Dashboard</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>Loading troop visibility...</Text>
        </View>
        <MaterialCommunityIcons name="account-heart-outline" size={28} color={colors.primary} />
      </View>
    </AppCard>;
  }
  const events = parentDashboard.upcoming_events || [];
  const patrols = parentDashboard.patrols || [];
  const challenges = parentDashboard.challenges || [];
  const activity = parentDashboard.recent_activity || [];
  return <AppCard style={styles.card}>
    <View style={styles.row}>
      <View style={styles.activityCopy}>
        <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Read-only troop view</Text>
        <Text style={[styles.title, { color: colors.text }]}>Parent Dashboard</Text>
        <Text style={[styles.copy, { color: colors.textSecondary }]}>Upcoming events, readiness, patrol progress, and recent troop activity.</Text>
      </View>
      <MaterialCommunityIcons name="account-heart-outline" size={28} color={colors.primary} />
    </View>
    <View style={styles.parentDashboardGrid}>
      <View style={styles.parentDashboardSection}>
        <Text style={[styles.memberName, { color: colors.text }]}>Upcoming events</Text>
        {events.length ? events.map((event) => <Text key={event.id} style={[styles.time, { color: colors.textSecondary }]}>
          {event.title}: {event.readiness_percent ?? 0}% ready{event.viewer_rsvp ? ` · ${event.viewer_rsvp}` : ""}{event.location ? ` · ${event.location}` : ""}
        </Text>) : <Text style={[styles.time, { color: colors.textMuted }]}>No upcoming events.</Text>}
      </View>
      <View style={styles.parentDashboardSection}>
        <Text style={[styles.memberName, { color: colors.text }]}>Patrol standings</Text>
        {patrols.length ? patrols.slice(0, 5).map((patrol) => <Text key={patrol.id} style={[styles.time, { color: colors.textSecondary }]}>
          {patrol.leaderboard_rank ? `#${patrol.leaderboard_rank} ` : ""}{patrol.name}: {patrol.readiness_percent ?? "No"}{patrol.readiness_percent == null ? " readiness yet" : "% ready"}
        </Text>) : <Text style={[styles.time, { color: colors.textMuted }]}>No patrols yet.</Text>}
      </View>
      <View style={styles.parentDashboardSection}>
        <Text style={[styles.memberName, { color: colors.text }]}>Active challenges</Text>
        {challenges.length ? challenges.map((challenge) => <Text key={challenge.id} style={[styles.time, { color: colors.textSecondary }]}>
          {challenge.title}: {challenge.progress_percent}%
        </Text>) : <Text style={[styles.time, { color: colors.textMuted }]}>No active challenges.</Text>}
      </View>
      <View style={styles.parentDashboardSection}>
        <Text style={[styles.memberName, { color: colors.text }]}>Recent activity</Text>
        {activity.length ? activity.slice(0, 4).map((item) => <Text key={item.id} style={[styles.time, { color: colors.textSecondary }]}>
          {item.message || item.type || "Orbit activity"}
        </Text>) : <Text style={[styles.time, { color: colors.textMuted }]}>No recent activity.</Text>}
      </View>
    </View>
  </AppCard>;
}

function TroopMilestonesCard({ milestones, colors }) {
  return <AppCard style={styles.card}>
    <View style={styles.row}>
      <View style={styles.activityCopy}>
        <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Scout Troop</Text>
        <Text style={[styles.title, { color: colors.text }]}>Troop Milestones</Text>
        <Text style={[styles.copy, { color: colors.textSecondary }]}>Celebrate campouts, service projects, patrol readiness, and troop XP.</Text>
      </View>
      <MaterialCommunityIcons name="flag-variant" size={28} color={colors.primary} />
    </View>
    {milestones.length ? milestones.map((milestone) => {
      const percent = milestone.target ? Math.min(100, Math.round((milestone.progress / milestone.target) * 100)) : 0;
      return <View key={milestone.id} style={styles.troopMilestoneRow}>
        <View style={[styles.milestoneIcon, { backgroundColor: `${milestone.color || colors.primary}20`, opacity: milestone.unlocked ? 1 : 0.55 }]}>
          <MaterialCommunityIcons name={milestone.unlocked ? (milestone.icon || "star-four-points") : "lock-outline"} size={24} color={milestone.unlocked ? (milestone.color || colors.primary) : colors.textMuted} />
        </View>
        <View style={styles.activityCopy}>
          <View style={styles.row}>
            <Text style={[styles.memberName, { color: colors.text }]}>{milestone.title}</Text>
            <Text style={[styles.status, { color: milestone.unlocked ? colors.primary : colors.textMuted }]}>
              {milestone.unlocked ? "Unlocked" : "Locked"}
            </Text>
          </View>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>{milestone.description}</Text>
          <OrbitProgressBar percent={percent} style={styles.troopMilestoneProgress} />
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {milestone.progress} / {milestone.target}{milestone.unlocked_at ? ` · Unlocked ${new Date(milestone.unlocked_at).toLocaleDateString()}` : ""}
          </Text>
        </View>
      </View>;
    }) : <Text style={[styles.copy, { color: colors.textSecondary }]}>Troop milestone progress will appear here after the next sync.</Text>}
  </AppCard>;
}

function OrbitEventCard({
  event,
  readiness,
  patrolReadiness,
  colors,
  canManage,
  busy,
  onEdit,
  onDelete,
  onRsvp,
  onCreateReadiness,
  onEditReadiness,
  onDeleteReadiness,
  onToggleReadiness,
}) {
  const counts = event.rsvp_counts || {};
  const start = event.start_time ? new Date(event.start_time).toLocaleString() : "Time TBD";
  const end = event.end_time ? new Date(event.end_time).toLocaleString() : null;
  const readinessItems = readiness?.items || [];
  const patrolReadinessItems = patrolReadiness?.items || [];
  return <AppCard style={styles.card}>
    <View style={styles.row}>
      <View style={styles.activityCopy}>
        <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
        <Text style={[styles.time, { color: colors.primary }]}>{start}{end ? ` - ${end}` : ""}</Text>
      </View>
      <MaterialCommunityIcons name="calendar-star" size={28} color={colors.primary} />
    </View>
    {!!event.location && <Text style={[styles.copy, { color: colors.textSecondary }]}>Location: {event.location}</Text>}
    {!!event.description && <Text style={[styles.copy, { color: colors.textSecondary }]}>{event.description}</Text>}
    <Text style={[styles.time, { color: colors.textMuted }]}>
      {counts.attending || 0} attending · {counts.maybe || 0} maybe · {counts.declined || 0} declined
    </Text>
    <View style={styles.formActions}>
      {RSVP_OPTIONS.map(([value, label]) => (
        <AppButton
          key={value}
          title={event.viewer_rsvp === value ? `✓ ${label}` : label}
          variant={event.viewer_rsvp === value ? "primary" : "secondary"}
          style={styles.formAction}
          onPress={() => onRsvp(value)}
          disabled={busy}
        />
      ))}
    </View>
    {canManage && <View style={styles.formActions}>
      <AppButton title="Edit" variant="secondary" style={styles.formAction} onPress={onEdit} disabled={busy} />
      <AppButton title="Delete" variant="secondary" style={styles.formAction} onPress={onDelete} disabled={busy} />
    </View>}
    <View style={styles.readinessHeader}>
      <View style={styles.activityCopy}>
        <Text style={[styles.memberName, { color: colors.text }]}>Readiness checklist</Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {readiness ? `${readiness.readiness_percent}% ready · ${readiness.completed_count}/${readiness.total_count}` : "Loading readiness..."}
        </Text>
      </View>
      {canManage && <AppButton title="Add" variant="ghost" fullWidth={false} style={styles.smallButton} onPress={onCreateReadiness} disabled={busy} />}
    </View>
    {readiness && <OrbitProgressBar percent={readiness.readiness_percent || 0} style={styles.challengeProgress} />}
    {readinessItems.length ? readinessItems.map((item) => <View key={item.id} style={styles.readinessItemRow}>
      <Pressable onPress={() => onToggleReadiness(item)} disabled={busy} style={styles.readinessCheck}>
        <MaterialCommunityIcons name={item.completed ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={24} color={item.completed ? colors.success : colors.textMuted} />
      </Pressable>
      <View style={styles.activityCopy}>
        <Text style={[styles.memberName, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.time, { color: item.required ? colors.primary : colors.textMuted }]}>{item.required ? "Required" : "Optional"}</Text>
        {!!item.description && <Text style={[styles.copy, { color: colors.textSecondary }]}>{item.description}</Text>}
      </View>
      {canManage && <View style={styles.readinessActions}>
        <Pressable onPress={() => onEditReadiness(item)} disabled={busy}><Text style={[styles.time, { color: colors.primary }]}>Edit</Text></Pressable>
        <Pressable onPress={() => onDeleteReadiness(item)} disabled={busy}><Text style={[styles.time, { color: colors.danger }]}>Delete</Text></Pressable>
      </View>}
    </View>) : <Text style={[styles.copy, { color: colors.textSecondary }]}>No readiness items yet.</Text>}
    {canManage && readiness?.member_readiness?.length ? <View style={styles.memberReadiness}>
      <Text style={[styles.memberName, { color: colors.text }]}>Member readiness</Text>
      {readiness.member_readiness.slice(0, 5).map((member) => <Text key={member.user_id} style={[styles.time, { color: colors.textSecondary }]}>
        {member.user?.display_name || member.user?.name || member.user?.username || "Member"}: {member.readiness_percent}% ({member.completed_count}/{member.total_count})
      </Text>)}
    </View> : null}
    {patrolReadinessItems.length ? <View style={styles.memberReadiness}>
      <Text style={[styles.memberName, { color: colors.text }]}>Patrol readiness</Text>
      {patrolReadinessItems.slice(0, 5).map((patrol) => <View key={patrol.patrol_id} style={styles.patrolRollupRow}>
        <View style={styles.activityCopy}>
          <View style={styles.row}>
            <Text style={[styles.memberName, { color: colors.text }]}>{patrol.patrol_name}</Text>
            <Text style={[styles.status, { color: colors.primary }]}>{patrol.readiness_percent}%</Text>
          </View>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {patrol.completed_count}/{patrol.required_count} ready · {patrol.member_count} {patrol.member_count === 1 ? "member" : "members"}
          </Text>
          {patrol.items?.slice(0, 3).map((item) => <Text key={item.item_id} style={[styles.time, { color: colors.textMuted }]}>
            {item.title}: {item.completed_count}/{item.required_count} ({item.readiness_percent}%)
          </Text>)}
        </View>
      </View>)}
    </View> : null}
  </AppCard>;
}

function OrbitAIRecap({ recap, colors }) {
  const sections = [["Wins", recap.wins], ["Needs attention", recap.needs_attention], ["Suggested focus", recap.suggested_focus]];
  return <View style={styles.aiRecap}>
    <Text style={[styles.copy, { color: colors.text }]}>{recap.summary}</Text>
    {sections.map(([label, items]) => items?.length ? <View key={label}>
      <Text style={[styles.memberName, { color: colors.text }]}>{label}</Text>
      {items.map((item, index) => <Text key={`${label}-${index}`} style={[styles.copy, { color: colors.textSecondary }]}>- {item}</Text>)}
    </View> : null)}
    {!!recap.suggested_challenge && <Text style={[styles.memberName, { color: colors.primary }]}>Challenge idea: {recap.suggested_challenge}</Text>}
  </View>;
}

function OrbitAIInsights({ insights, colors }) {
  const sections = [["Strengths", insights.strengths], ["Risks", insights.risks], ["Opportunities", insights.opportunities], ["Recommendations", insights.recommendations]];
  const challenge = insights.suggested_challenge;
  return <View style={styles.aiRecap}>
    <Text style={[styles.copy, { color: colors.text }]}>{insights.summary}</Text>
    {!!insights.health_explanation && <View>
      <Text style={[styles.memberName, { color: colors.text }]}>Health explanation</Text>
      <Text style={[styles.copy, { color: colors.textSecondary }]}>{insights.health_explanation}</Text>
    </View>}
    {sections.map(([label, items]) => items?.length ? <View key={label}>
      <Text style={[styles.memberName, { color: colors.text }]}>{label}</Text>
      {items.map((item, index) => <Text key={`${label}-${index}`} style={[styles.copy, { color: colors.textSecondary }]}>- {item}</Text>)}
    </View> : null)}
    {!!challenge && <View>
      <Text style={[styles.memberName, { color: colors.primary }]}>Suggested challenge: {typeof challenge === "string" ? challenge : challenge.title}</Text>
      {typeof challenge === "object" && !!challenge.description && <Text style={[styles.copy, { color: colors.textSecondary }]}>{challenge.description}</Text>}
    </View>}
  </View>;
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg }, action: { flex: 1, minWidth: "30%" },
  orbitNavCard: { marginBottom: spacing.lg },
  orbitNavRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  orbitNavButton: { flex: 1, minWidth: "45%" },
  quickActionsCard: { marginBottom: spacing.lg },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  quickAction: { width: "31%", borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, alignItems: "center", gap: spacing.sm },
  quickActionIcon: { width: 38, height: 38, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { ...typography.caption, fontWeight: "900" },
  activityPreviewCard: { marginBottom: spacing.lg },
  activityPreviewRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingTop: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(127,127,127,0.16)" },
  sectionHeaderCompact: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  orbitBanner: { borderRadius: radii.xxl, padding: spacing.xl, marginBottom: spacing.lg, overflow: "hidden", minHeight: 190 },
  orbitBannerScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
  orbitBannerContent: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroCard: { marginBottom: spacing.lg }, heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md }, heroCopy: { flex: 1 }, heroTitle: { ...typography.h2, marginTop: spacing.xs }, orbitBannerTitle: { ...typography.h1, marginTop: spacing.xs }, progressBar: { marginTop: spacing.lg },
  healthCard: { marginBottom: spacing.lg }, healthScore: { ...typography.h1, marginTop: spacing.xs }, healthTrend: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, healthBreakdown: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md }, healthMetric: { minWidth: "30%" },
  inviteCard: { marginBottom: spacing.xl }, smallLabel: { ...typography.caption }, code: { ...typography.h2, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md }, card: { marginBottom: spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg }, sectionTitleInline: { marginTop: 0 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md }, title: { ...typography.h3, flex: 1 }, status: { ...typography.caption, textTransform: "uppercase" },
  copy: { ...typography.body, marginTop: spacing.xs }, track: { height: 9, borderRadius: radii.pill, overflow: "hidden", marginTop: spacing.lg }, fill: { height: "100%" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg }, stat: { width: "50%" }, statValue: { ...typography.h2 }, statLabel: { ...typography.caption, marginTop: 2 },
  seasonStats: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.md, marginTop: spacing.md },
  seasonSelector: { marginTop: spacing.md },
  contribute: { marginTop: spacing.lg }, activityCard: { marginBottom: spacing.sm }, activityRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md }, activityCopy: { flex: 1 }, activityMessage: { ...typography.bodyBold }, time: { ...typography.caption, marginTop: spacing.xs },
  memberCard: { marginBottom: spacing.sm }, memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.md }, memberCopy: { flex: 1 }, memberName: { ...typography.bodyBold }, memberMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs }, roleBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }, dangerButton: { marginTop: spacing.xxl },
  patrolMemberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  patrolMemberName: { flex: 1 },
  patrolLeaderboardRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(127,127,127,0.18)" },
  parentDashboardGrid: { gap: spacing.md, marginTop: spacing.md },
  parentDashboardSection: { gap: spacing.xs },
  smallButton: { minHeight: 40, paddingHorizontal: spacing.md }, sharedItemCard: { marginBottom: spacing.sm }, sharedItemRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md }, sharedItemCopy: { flex: 1 }, completeButton: { marginTop: spacing.md },
  createCard: { marginTop: spacing.md, marginBottom: spacing.lg }, formInput: { marginTop: spacing.md }, formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }, formAction: { flex: 1 },
  formLabel: { ...typography.caption, marginTop: spacing.md, marginBottom: spacing.sm }, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, chip: { borderWidth: 1, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }, challengeProgress: { marginTop: spacing.md }, completedLabel: { marginTop: spacing.sm, marginBottom: spacing.sm },
  proofToggle: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radii.xl, padding: spacing.md, marginTop: spacing.md }, proofQuote: { ...typography.body, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.lg },
  proofImageButton: { marginTop: spacing.md }, selectedProof: { gap: spacing.sm, marginTop: spacing.md }, proofImage: { width: "100%", height: 220, borderRadius: radii.lg, marginTop: spacing.md },
  aiRecommendation: { gap: spacing.xs, borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.md }, aiTitle: { ...typography.bodyBold, textTransform: "capitalize" },
  aiRecap: { gap: spacing.md },
  readinessHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, marginTop: spacing.lg },
  readinessItemRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingTop: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(127,127,127,0.18)" },
  readinessCheck: { paddingTop: spacing.xs },
  readinessActions: { alignItems: "flex-end", gap: spacing.xs },
  memberReadiness: { gap: spacing.xs, marginTop: spacing.md },
  patrolRollupRow: { paddingTop: spacing.sm, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: "rgba(127,127,127,0.14)" },
  achievementUnlock: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md }, achievementRow: { marginBottom: spacing.md }, achievementTrack: { height: 7, borderRadius: radii.pill, overflow: "hidden", marginTop: spacing.sm },
  milestoneCard: { borderWidth: 1 }, milestoneHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm }, milestoneRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingTop: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(127,127,127,0.18)" }, milestoneIcon: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  troopMilestoneRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: "rgba(127,127,127,0.18)" },
  troopMilestoneProgress: { marginTop: spacing.sm },
  leaderboardIntro: { marginTop: -spacing.sm, marginBottom: spacing.md }, leaderboardGrid: { gap: spacing.sm, marginBottom: spacing.md }, leaderboardCard: { marginBottom: 0 }, leaderboardRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(127,127,127,0.18)" }, leaderboardRank: { ...typography.bodyBold, width: 28 }, leaderboardName: { flex: 1 },
});
