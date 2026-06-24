import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AnimatedPressable } from "../components/AnimatedPressable";
import { AnimatedScreen } from "../components/AnimatedScreen";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { BrandBadge, BrandHeader } from "../components/BrandMark";
import { OrbitProgressBar } from "../components/OrbitProgressBar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { APP_URL } from "../lib/config";
import { getOrbitTheme } from "../lib/orbitThemes";
import { onboardingTemplates } from "../lib/orbitTemplates";
import { gradientContrastInfo, radii, spacing, typography } from "../lib/theme";

const GOALS = [
  { id: "family", title: "Family Accountability", template: "family" },
  { id: "scout", title: "Scout Troop", template: "scout_troop" },
  { id: "accountability", title: "Accountability Group", template: "accountability_circle" },
  { id: "fitness", title: "Fitness Goals", template: "fitness_group" },
  { id: "study", title: "Study Group", template: "study_group" },
  { id: "couples", title: "Couples", template: "couples" },
  { id: "personal", title: "Personal Growth", template: "blank" },
];

const TEMPLATES = onboardingTemplates();

const INVITE_MESSAGES = {
  family: "Invite family members.",
  scout_troop: "Invite leaders, parents, and scouts.",
  accountability_circle: "Invite accountability partners.",
  fitness_group: "Invite workout partners.",
  study_group: "Invite study group members.",
  couples: "Invite your partner.",
  blank: "Invite members into your Orbit.",
};

const REWARD_SUGGESTIONS = {
  family: [
    "Family Movie Night",
    "Pizza Night",
    "Choose Dinner",
    "Extra Screen Time",
    "Family Activity Choice",
  ],
  scout_troop: [
    "Troop Recognition",
    "Patrol Pizza Party",
    "Campout Privilege",
    "Patrol Choice Activity",
    "Custom Troop Reward",
  ],
  accountability_circle: [
    "Group Celebration",
    "Accountability Champion",
    "Consistency Award",
  ],
  fitness_group: [
    "Group Workout Celebration",
    "Fitness Champion",
    "Team Achievement Award",
  ],
  study_group: [
    "Study Streak Award",
    "Group Celebration",
    "Focus Champion",
  ],
  couples: [
    "Date Night Choice",
    "Favorite Restaurant Night",
    "Weekend Adventure",
    "Special Celebration",
  ],
  blank: [
    "Group Celebration",
    "Milestone Reward",
    "Team Choice Reward",
  ],
};

const CUSTOM_REWARD_PLACEHOLDERS = {
  family: "Ice cream trip",
  scout_troop: "Patrol pizza party",
  fitness_group: "Group celebration meal",
  study_group: "Exam celebration",
  couples: "Weekend adventure",
  accountability_circle: "Coffee shop celebration",
  blank: "Group celebration",
};

const HABIT_SUGGESTIONS = {
  family: ["Daily Reading", "Chores", "Family Dinner"],
  scout_troop: ["Physical Fitness", "Scout Skill Practice", "Daily Scout Spirit"],
  accountability_circle: ["Daily Check-In", "Goal Progress", "Encouragement"],
  fitness_group: ["Workout", "Stretching", "Hydration"],
  study_group: ["Reading", "Study Session", "Practice Questions"],
  couples: ["Gratitude", "Quality Time", "Shared Goal Progress"],
  blank: ["Check-In", "Practice", "Progress"],
};


const PROJECT_SUGGESTIONS = {
  family: [
    { title: "Family Routines Setup", subtasks: ["Choose weekly priorities", "Review chores", "Plan first reward"] },
  ],
  scout_troop: [
    { title: "Troop Launch Plan", subtasks: ["Invite leaders", "Create first event", "Review patrol setup"] },
  ],
  accountability_circle: [
    { title: "First Check-In Setup", subtasks: ["Invite members", "Choose weekly check-in time", "Pick first shared goal"] },
  ],
  fitness_group: [
    { title: "Fitness Group Kickoff", subtasks: ["Invite workout partners", "Choose first workout", "Review starter challenges"] },
  ],
  study_group: [
    { title: "Study Group Kickoff", subtasks: ["Invite study members", "Schedule first session", "Choose study goal"] },
  ],
  couples: [
    { title: "Shared Goals Kickoff", subtasks: ["Invite your partner", "Schedule first date night", "Choose first shared goal"] },
  ],
  blank: [],
};

const TASK_SUGGESTIONS = {
  family: ["Homework", "Chores", "Room Cleaning"],
  scout_troop: ["Permission Slips", "Medical Forms", "Gear Check"],
  accountability_circle: ["Weekly Reflection", "Next Step", "Goal Review"],
  fitness_group: ["Weekly Weigh-In", "Workout Plan Review"],
  study_group: ["Study Materials Ready", "Practice Exam"],
  couples: ["Date Night Planning", "Shared Goal Review"],
  blank: ["Plan First Goal", "Invite Members", "Review Progress"],
};

const EVENT_SETUP = {
  family: {
    prompt: "Would you like to create your first family event?",
    intro: "These are suggestions. Pick one and add the real date when your family is ready.",
    options: [
      { key: "family_vacation", action: "Create Family Vacation", defaultTitle: "Family Vacation", time: "09:00", readiness: ["Packing Complete"] },
      { key: "family_meeting", action: "Create Family Meeting", defaultTitle: "Family Meeting", time: "18:00", readiness: [] },
      { key: "family_activity", action: "Create Family Activity", defaultTitle: "Family Activity", time: "14:00", readiness: [] },
    ],
  },
  scout_troop: {
    prompt: "Let's get your troop started.",
    intro: "Create a real first event now, or skip and add one later from the Orbit.",
    options: [
      { key: "troop_meeting", action: "Create Troop Meeting", defaultTitle: "Troop Meeting", time: "19:00", readiness: [] },
      { key: "campout", action: "Create Campout", defaultTitle: "Campout", time: "17:00", includeEndDate: true, readiness: ["Permission Slip", "Medical Form", "Packing Complete", "Transportation Confirmed"] },
      { key: "service_project", action: "Create Service Project", defaultTitle: "Service Project", time: "09:00", readiness: ["Volunteers Assigned", "Materials Ready", "Tools Ready"] },
    ],
  },
  accountability_circle: {
    prompt: "Would you like to schedule your first check-in?",
    intro: "Use this to put your first real group touchpoint on the calendar.",
    options: [
      { key: "weekly_check_in", action: "Create Weekly Check-In", defaultTitle: "Weekly Check-In", time: "18:00", readiness: ["Goal Update Submitted", "Progress Reflection Completed", "Next Step Chosen"] },
      { key: "monthly_goal_review", action: "Create Monthly Goal Review", defaultTitle: "Monthly Goal Review", time: "18:00", readiness: [] },
    ],
  },
  fitness_group: {
    prompt: "Would you like to schedule your first workout event?",
    intro: "Pick a real workout or prep event to get the group moving.",
    options: [
      { key: "group_workout", action: "Create Group Workout", defaultTitle: "Group Workout", time: "07:00", readiness: [] },
      { key: "race_prep", action: "Create Race Prep", defaultTitle: "Race or Event Prep", time: "08:00", readiness: ["Training Plan Started", "Gear Ready", "Registration Complete", "Hydration Plan Ready"] },
      { key: "fitness_check_in", action: "Create Fitness Check-In", defaultTitle: "Fitness Check-In", time: "18:00", readiness: [] },
    ],
  },
  study_group: {
    prompt: "Would you like to schedule your first study session?",
    intro: "Put a real study session or exam prep meeting on the calendar.",
    options: [
      { key: "study_session", action: "Create Study Session", defaultTitle: "Study Session", time: "18:00", readiness: [] },
      { key: "exam_prep", action: "Create Exam Prep", defaultTitle: "Exam Prep Session", time: "18:00", readiness: ["Reading Complete", "Notes Reviewed", "Practice Questions Complete", "Study Materials Ready"] },
      { key: "reading_group", action: "Create Reading Group", defaultTitle: "Reading Group", time: "18:00", readiness: [] },
    ],
  },
  couples: {
    prompt: "Would you like to schedule your first date night?",
    intro: "Create a real shared event now, or skip and add it later.",
    options: [
      { key: "date_night", action: "Create Date Night", defaultTitle: "Date Night", time: "19:00", readiness: ["Reservation Made", "Childcare Arranged", "Plans Confirmed"] },
      { key: "goal_review", action: "Create Goal Review", defaultTitle: "Shared Goal Review", time: "18:00", readiness: [] },
      { key: "weekend_adventure", action: "Create Weekend Adventure", defaultTitle: "Weekend Adventure", time: "09:00", includeEndDate: true, readiness: ["Destination Chosen", "Packing Complete", "Reservations Confirmed"] },
    ],
  },
  blank: {
    prompt: "Would you like to create your first event?",
    intro: "Add a real event now, or skip and customize your Orbit later.",
    options: [
      { key: "first_event", action: "Create First Event", defaultTitle: "First Orbit Event", time: "18:00", readiness: [] },
    ],
  },
};

const CHALLENGE_SUGGESTIONS = {
  family: [
    { title: "Family Consistency Challenge", goal_type: "actions", goal_value: 30, reward_xp: 300, duration_days: 30 },
    { title: "Reading Challenge", goal_type: "habits", goal_value: 20, reward_xp: 250, duration_days: 30 },
    { title: "Chore Completion Challenge", goal_type: "tasks", goal_value: 20, reward_xp: 250, duration_days: 30 },
  ],
  scout_troop: [
    { title: "Service Hours Challenge", goal_type: "actions", goal_value: 40, reward_xp: 500, duration_days: 60 },
    { title: "Physical Fitness Challenge", goal_type: "habits", goal_value: 30, reward_xp: 350, duration_days: 30 },
    { title: "Camping Preparation Challenge", goal_type: "tasks", goal_value: 35, reward_xp: 400, duration_days: 45 },
  ],
  accountability_circle: [
    { title: "Weekly Check-In Challenge", goal_type: "actions", goal_value: 12, reward_xp: 250, duration_days: 30 },
    { title: "Consistency Challenge", goal_type: "habits", goal_value: 21, reward_xp: 300, duration_days: 30 },
  ],
  fitness_group: [
    { title: "Weekly Workout Challenge", goal_type: "habits", goal_value: 20, reward_xp: 300, duration_days: 30 },
    { title: "Step Goal Challenge", goal_type: "actions", goal_value: 50, reward_xp: 350, duration_days: 30 },
    { title: "Monthly Fitness Goal", goal_type: "tasks", goal_value: 25, reward_xp: 400, duration_days: 30 },
  ],
  study_group: [
    { title: "Weekly Study Challenge", goal_type: "habits", goal_value: 20, reward_xp: 300, duration_days: 30 },
    { title: "Reading Goal Challenge", goal_type: "tasks", goal_value: 15, reward_xp: 250, duration_days: 30 },
    { title: "Exam Prep Challenge", goal_type: "tasks", goal_value: 25, reward_xp: 400, duration_days: 45 },
  ],
  couples: [
    { title: "Weekly Date Night Challenge", goal_type: "actions", goal_value: 4, reward_xp: 250, duration_days: 30 },
    { title: "Daily Gratitude Challenge", goal_type: "habits", goal_value: 30, reward_xp: 350, duration_days: 30 },
    { title: "Shared Goal Challenge", goal_type: "tasks", goal_value: 10, reward_xp: 300, duration_days: 30 },
  ],
  blank: [
    { title: "First Orbit Challenge", goal_type: "actions", goal_value: 10, reward_xp: 200, duration_days: 30 },
  ],
};

const SEASON_SUGGESTIONS = {
  family: [{ title: "Summer Family Goals", days: 60 }],
  scout_troop: [{ title: "Summer Camp Season", days: 90 }, { title: "Fall Campout Season", days: 90 }],
  accountability_circle: [{ title: "New Year Accountability Sprint", days: 30 }],
  fitness_group: [{ title: "30-Day Fitness Sprint", days: 30 }, { title: "Race Prep Season", days: 90 }],
  study_group: [{ title: "Exam Prep Season", days: 45 }, { title: "Certification Sprint", days: 60 }],
  couples: [{ title: "Date Night Season", days: 60 }, { title: "Shared Goals Season", days: 60 }],
  blank: [{ title: "Custom Season", days: 30 }],
};

function titlesFor(map, templateId) {
  return (map[templateId] || map.blank).map((item) => (typeof item === "string" ? item : item.title));
}

const CHECKLIST = [
  "Create or Join an Orbit",
  "Invite a Member",
  "View a Challenge",
  "View an Event",
  "Complete a Task or Habit",
];

function dateInputValue(daysFromNow = 7) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export default function OnboardingScreen() {
  const { refresh } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(null);
  const [mode, setMode] = useState("create");
  const [templateId, setTemplateId] = useState("family");
  const [orbitName, setOrbitName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createdOrbit, setCreatedOrbit] = useState(null);
  const [provisionedItems, setProvisionedItems] = useState([]);
  const [provisionError, setProvisionError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRewards, setSelectedRewards] = useState(REWARD_SUGGESTIONS.family);
  const [selectedHabits, setSelectedHabits] = useState(titlesFor(HABIT_SUGGESTIONS, "family"));
  const [selectedTasks, setSelectedTasks] = useState(titlesFor(TASK_SUGGESTIONS, "family"));
  const [selectedChallenges, setSelectedChallenges] = useState(titlesFor(CHALLENGE_SUGGESTIONS, "family"));
  const [selectedSeasons, setSelectedSeasons] = useState(titlesFor(SEASON_SUGGESTIONS, "family"));
  const [customReward, setCustomReward] = useState("");
  const [, setRewardsAdded] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [setupEventKey, setSetupEventKey] = useState(null);
  const [setupEventTitle, setSetupEventTitle] = useState("");
  const [setupEventDate, setSetupEventDate] = useState(dateInputValue());
  const [setupEventEndDate, setSetupEventEndDate] = useState(dateInputValue(8));
  const [setupEventTime, setSetupEventTime] = useState("18:00");
  const [setupEventLocation, setSetupEventLocation] = useState("");
  const [eventSetupBusy, setEventSetupBusy] = useState(false);
  const [checklist, setChecklist] = useState({
    create_or_join_orbit: false,
    invite_member: false,
    view_challenge: false,
    view_event: false,
    complete_task_or_habit: false,
  });

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((item) => item.id === templateId) || TEMPLATES[0],
    [templateId]
  );

  const rewardSuggestions = REWARD_SUGGESTIONS[templateId] || REWARD_SUGGESTIONS.blank;
  const eventSetup = EVENT_SETUP[templateId];
  const selectedSetupEvent = eventSetup?.options.find((item) => item.key === setupEventKey);
  const successTheme = getOrbitTheme(createdOrbit?.theme || createdOrbit?.theme_id || templateId);
  const successContrast = gradientContrastInfo(successTheme.gradient);
  const successTextColor = successTheme.text_color || successContrast.textColor;
  const successSecondaryColor = successContrast.secondaryTextColor || successTextColor;
  const progress = step === 0
    ? 20
    : step === 3
      ? 40
      : step === 4
        ? 60
        : step === 11
          ? 80
          : 100;

  async function markStep(body) {
    try {
      await api.completeOnboardingStep(body);
    } catch (_error) {}
  }

  function chooseGoal(item) {
    setGoal(item.id);
    setTemplateId(item.template);
    setSelectedRewards(REWARD_SUGGESTIONS[item.template] || REWARD_SUGGESTIONS.blank);
    resetGuidedSelections(item.template);
    resetSetupEvent();
    markStep({ step: "goal_selected", onboarding_goal: item.id });
  }

  function resetGuidedSelections(nextTemplateId) {
    setSelectedHabits(titlesFor(HABIT_SUGGESTIONS, nextTemplateId));
    setSelectedTasks(titlesFor(TASK_SUGGESTIONS, nextTemplateId));
    setSelectedChallenges(titlesFor(CHALLENGE_SUGGESTIONS, nextTemplateId));
    setSelectedSeasons(titlesFor(SEASON_SUGGESTIONS, nextTemplateId));
    setSelectedRewards(REWARD_SUGGESTIONS[nextTemplateId] || REWARD_SUGGESTIONS.blank);
  }

  function resetSetupEvent() {
    setSetupEventKey(null);
    setSetupEventTitle("");
    setSetupEventDate(dateInputValue());
    setSetupEventEndDate(dateInputValue(8));
    setSetupEventTime("18:00");
    setSetupEventLocation("");
  }

  function chooseSetupEvent(option) {
    setSetupEventKey(option.key);
    setSetupEventTitle(option.defaultTitle);
    setSetupEventDate(dateInputValue());
    setSetupEventEndDate(dateInputValue(8));
    setSetupEventTime(option.time || "18:00");
    setSetupEventLocation("");
  }

  function continueFromIntro() {
    markStep({ step: "welcome" });
    setMode("create");
    setStep(3);
  }

  function chooseMode(nextMode) {
    setMode(nextMode);
    markStep({ step: "join_or_create_selected" });
    setStep(nextMode === "join" ? 4 : 3);
  }


  async function provisionStarterContent(orbit) {
    const orbitId = orbit?.id || orbit?.orbit_id;
    const addProvisioned = (label) => setProvisionedItems((current) => current.includes(label) ? current : [...current, label]);

    if (!orbitId) return;
    setProvisionError(null);

    if (templateId === "blank") {
      addProvisioned("Roles Ready");
      return;
    }

    const habitTitles = titlesFor(HABIT_SUGGESTIONS, templateId);
    const taskTitles = titlesFor(TASK_SUGGESTIONS, templateId);
    const rewardTitles = REWARD_SUGGESTIONS[templateId] || REWARD_SUGGESTIONS.blank;
    const challengeSuggestions = CHALLENGE_SUGGESTIONS[templateId] || CHALLENGE_SUGGESTIONS.blank;
    const seasonSuggestions = SEASON_SUGGESTIONS[templateId] || SEASON_SUGGESTIONS.blank;
    const projectSuggestions = PROJECT_SUGGESTIONS[templateId] || [];

    try {
      addProvisioned("Roles Ready");
      if (habitTitles.length && !provisionedItems.includes("Habits Ready")) {
        for (const name of habitTitles) {
          await api.createOrbitHabit(orbitId, {
            name,
            description: "Starter habit added from your Orbit template.",
            requires_proof: false,
          });
        }
        addProvisioned("Habits Ready");
      }
      if (taskTitles.length && !provisionedItems.includes("Tasks Ready")) {
        for (const name of taskTitles) {
          await api.createOrbitTask(orbitId, {
            name,
            description: "Starter task added from your Orbit template.",
            requires_proof: false,
          });
        }
        addProvisioned("Tasks Ready");
      }
      if (rewardTitles.length && !provisionedItems.includes("Rewards Ready")) {
        for (const title of rewardTitles) {
          await api.createOrbitReward(orbitId, {
            title,
            description: "Starter reward added from your Orbit template.",
            xp_cost: 500,
          });
        }
        addProvisioned("Rewards Ready");
      }
      if (challengeSuggestions.length && !provisionedItems.includes("Milestones Ready")) {
        for (const item of challengeSuggestions) {
          await api.createOrbitChallenge(orbitId, {
            title: item.title,
            description: "Starter challenge added from your Orbit template.",
            goal_type: item.goal_type,
            goal_value: item.goal_value,
            start_date: dateInputValue(0),
            end_date: dateInputValue(item.duration_days || 30),
            reward_xp: item.reward_xp,
          });
        }
        addProvisioned("Milestones Ready");
      }
      if (seasonSuggestions.length && !provisionedItems.includes("Seasons Ready")) {
        for (const item of seasonSuggestions) {
          await api.createOrbitSeason(orbitId, {
            title: item.title,
            description: "Starter season added from your Orbit template.",
            start_date: dateInputValue(0),
            end_date: dateInputValue(item.days || 30),
            template: templateId,
          });
        }
        addProvisioned("Seasons Ready");
      }
      if (projectSuggestions.length && !provisionedItems.includes("Projects Ready")) {
        for (const item of projectSuggestions) {
          await api.createProject({
            title: item.title,
            description: "Starter project added from your Orbit template.",
            orbit_id: orbitId,
            xp_reward: 50,
            coin_reward: 0,
            subtasks: (item.subtasks || []).map((title) => ({
              title,
              assigned_user_id: null,
              xp_reward: 0,
              coin_reward: 0,
            })),
          });
        }
        addProvisioned("Projects Ready");
      }
    } catch (error) {
      const message = error?.message || "Template provisioning failed. Please retry before continuing.";
      setProvisionError(message);
      throw new Error(message);
    }
  }

  async function createOrbit() {
    const name = orbitName.trim();

    if (!name) {
      Alert.alert("Orbit name required", "Give your Orbit a name to continue.");
      return;
    }

    setSubmitting(true);

    try {
      let orbit = createdOrbit;
      if (!orbit) {
        const data = await api.createOrbit({
          name,
          template: templateId,
        });
        orbit = data?.orbit || data;
        setCreatedOrbit(orbit);
      }
      setChecklist((current) => ({ ...current, create_or_join_orbit: true }));

      await api.completeOnboardingStep({
        checklist_item: "create_or_join_orbit",
      });
      await provisionStarterContent(orbit);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setStep(11);
    } catch (error) {
      Alert.alert(createdOrbit ? "Template provisioning failed" : "Create Orbit failed", error?.message || "Unable to create your Orbit.");
    } finally {
      setSubmitting(false);
    }
  }

  async function joinOrbit() {
    const code = inviteCode.trim();

    if (!code) {
      Alert.alert("Invite code required", "Enter an invite code to join an Orbit.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await api.joinOrbitByCode(code);
      const orbitId = data?.orbit_id || data?.orbit?.id;

      setCreatedOrbit({ id: orbitId, name: data?.orbit?.name || "Your Orbit" });
      setChecklist((current) => ({ ...current, create_or_join_orbit: true }));

      await api.completeOnboardingStep({
        checklist_item: "create_or_join_orbit",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await api.completeOnboarding();
      await refresh?.();
      setStep(12);
    } catch (error) {
      Alert.alert("Join Orbit failed", error?.message || "Unable to join that Orbit.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleReward(title) {
    setSelectedRewards((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    );
  }

  function toggleSelected(setter, title) {
    setter((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    );
  }

  async function createGuidedHabits() {
    const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;
    if (!orbitId) return;
    setSubmitting(true);
    try {
      for (const name of selectedHabits) {
        await api.createOrbitHabit(orbitId, {
          name,
          description: "Added during guided template setup.",
          requires_proof: false,
        });
      }
      setStep(6);
    } catch (error) {
      Alert.alert("Could not create habits", error?.message || "You can skip and add habits later.");
    } finally {
      setSubmitting(false);
    }
  }

  async function createGuidedTasks() {
    const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;
    if (!orbitId) return;
    setSubmitting(true);
    try {
      for (const name of selectedTasks) {
        await api.createOrbitTask(orbitId, {
          name,
          description: "Added during guided template setup.",
          requires_proof: false,
        });
      }
      setStep(7);
    } catch (error) {
      Alert.alert("Could not create tasks", error?.message || "You can skip and add tasks later.");
    } finally {
      setSubmitting(false);
    }
  }

  async function createSetupEvent() {
    const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;
    const title = setupEventTitle.trim();

    if (!orbitId || !selectedSetupEvent) {
      Alert.alert("Choose an event", "Pick an event suggestion or skip for now.");
      return;
    }

    if (!title || !setupEventDate.trim()) {
      Alert.alert("Event details required", "Add an event title and date to continue.");
      return;
    }

    setEventSetupBusy(true);

    try {
      const startTime = `${setupEventDate.trim()}T${setupEventTime.trim() || "09:00"}:00`;
      const endTime = selectedSetupEvent.includeEndDate && setupEventEndDate.trim()
        ? `${setupEventEndDate.trim()}T${setupEventTime.trim() || "09:00"}:00`
        : null;
      const event = await api.createOrbitEvent(orbitId, {
        title,
        description: "Created during template setup.",
        location: setupEventLocation.trim(),
        start_time: startTime,
        end_time: endTime,
      });
      const eventId = event?.id || event?.event?.id;

      if (eventId) {
        for (const item of selectedSetupEvent.readiness || []) {
          await api.createOrbitEventReadinessItem(orbitId, eventId, {
            title: item,
            description: "",
            required: true,
          });
        }
      }

      setChecklist((current) => ({ ...current, view_event: true }));
      await api.completeOnboardingStep({ checklist_item: "view_event" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(9);
    } catch (error) {
      Alert.alert("Could not create event", error?.message || "You can skip this and add an event later.");
    } finally {
      setEventSetupBusy(false);
    }
  }

  async function continueToSuccess({ addRewards = false } = {}) {
    if (addRewards && mode === "create") {
      const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;
      const rewardTitles = [
        ...selectedRewards,
        ...(customReward.trim() ? [customReward.trim()] : []),
      ];

      if (orbitId && rewardTitles.length) {
        setSubmitting(true);

        try {
          const existing = await api.getOrbitRewards(orbitId);
          const existingTitles = new Set(
            (existing?.items || existing || [])
              .map((reward) => reward?.title?.trim().toLowerCase())
              .filter(Boolean)
          );
          const uniqueTitles = rewardTitles.filter(
            (title, index, all) =>
              title &&
              all.findIndex((item) => item.trim().toLowerCase() === title.trim().toLowerCase()) === index &&
              !existingTitles.has(title.trim().toLowerCase())
          );

          for (const title of uniqueTitles) {
            await api.createOrbitReward(orbitId, {
              title,
              description: "Starter reward added during onboarding.",
              xp_cost: 500,
            });
          }

          setRewardsAdded(uniqueTitles.length > 0);
        } catch (error) {
          Alert.alert(
            "Could not add rewards",
            error?.message || "You can still add rewards from your Orbit later."
          );
          return;
        } finally {
          setSubmitting(false);
        }
      }
    }

    setStep(8);
  }

  async function createGuidedChallenges() {
    const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;
    if (!orbitId) return;
    const suggestions = CHALLENGE_SUGGESTIONS[templateId] || CHALLENGE_SUGGESTIONS.blank;
    const selected = suggestions.filter((item) => selectedChallenges.includes(item.title));
    setSubmitting(true);
    try {
      for (const item of selected) {
        await api.createOrbitChallenge(orbitId, {
          title: item.title,
          description: "Added during guided template setup.",
          goal_type: item.goal_type,
          goal_value: item.goal_value,
          start_date: dateInputValue(0),
          end_date: dateInputValue(item.duration_days || 30),
          reward_xp: item.reward_xp,
        });
      }
      setStep(10);
    } catch (error) {
      Alert.alert("Could not create challenges", error?.message || "You can skip and add challenges later.");
    } finally {
      setSubmitting(false);
    }
  }

  async function createGuidedSeasons() {
    const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;
    if (!orbitId) return;
    const suggestions = SEASON_SUGGESTIONS[templateId] || SEASON_SUGGESTIONS.blank;
    const selected = suggestions.filter((item) => selectedSeasons.includes(item.title));
    setSubmitting(true);
    try {
      for (const item of selected) {
        await api.createOrbitSeason(orbitId, {
          title: item.title,
          description: "Added during guided template setup.",
          start_date: dateInputValue(0),
          end_date: dateInputValue(item.days || 30),
          template: templateId,
        });
      }
      setStep(11);
    } catch (error) {
      Alert.alert("Could not create seasons", error?.message || "You can skip and add seasons later.");
    } finally {
      setSubmitting(false);
    }
  }

  async function showSuccess() {
    await api.completeOnboardingStep({ step: "success" });
    await api.completeOnboarding();
    await refresh?.();
    setStep(12);
  }

  async function createOnboardingInviteLink({ share = false } = {}) {
    const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;
    if (!orbitId) return;

    setInviteBusy(true);

    try {
      let link = inviteLink;
      if (!link) {
        const invite = await api.createOrbitInviteLink(orbitId);
        link = `${APP_URL}/orbit-invite/${invite.token}`;
        setInviteLink(link);
      }

      await api.completeOnboardingStep({ checklist_item: "invite_member" });
      setChecklist((current) => ({ ...current, invite_member: true }));

      if (share) {
        await Share.share({ message: `Join ${createdOrbit?.name || "my Orbit"} on OurOrbit: ${link}`, url: link });
      } else {
        Alert.alert("Invite link ready", "The invite link is shown below. Press and hold to copy, or use Share Invite.");
      }
    } catch (error) {
      Alert.alert("Could not create invite", error?.message || "Try again from your Orbit later.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function sendOnboardingEmailInvites() {
    const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;
    const emails = inviteEmails
      .split(/[\s,;]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!orbitId || !emails.length) {
      Alert.alert("Email required", "Enter at least one email address.");
      return;
    }

    setInviteBusy(true);

    try {
      const result = await api.sendOrbitEmailInvites(orbitId, emails);
      const sentCount = result.items?.length || 0;
      const errors = result.errors || [];

      if (sentCount) {
        setInviteEmails("");
        setChecklist((current) => ({ ...current, invite_member: true }));
        await api.completeOnboardingStep({ checklist_item: "invite_member" });
      }

      Alert.alert(
        sentCount ? "Invitations sent" : "No invitations sent",
        `${sentCount} email invitation${sentCount === 1 ? "" : "s"} sent.${errors.length ? `\n${errors.map((item) => `${item.email}: ${item.detail}`).join("\n")}` : ""}`
      );
    } catch (error) {
      Alert.alert("Could not send invites", error?.message || "Try again from your Orbit later.");
    } finally {
      setInviteBusy(false);
    }
  }

  function finish() {
    const orbitId = createdOrbit?.id || createdOrbit?.orbit_id;

    if (orbitId) {
      router.replace({ pathname: "/orbit-detail", params: { orbitId } });
      return;
    }

    router.replace("/(tabs)/dashboard");
  }

  function renderOption({ active, icon, title, description, onPress, secondary }) {
    return (
      <AnimatedPressable key={title} onPress={onPress}>
        <AppCard
          style={[
            styles.optionCard,
            {
              borderColor: active ? c.primary : c.border,
              opacity: secondary ? 0.88 : 1,
            },
          ]}
          elevated={active}
        >
          <View style={styles.optionRow}>
            <View style={[styles.optionIcon, { backgroundColor: `${c.primary}14` }]}>
              <MaterialCommunityIcons name={icon} size={22} color={c.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: c.text }]}>{title}</Text>
              {!!description && (
                <Text style={[styles.optionDescription, { color: c.textMuted }]}>
                  {description}
                </Text>
              )}
            </View>
            {active && <Feather name="check-circle" size={22} color={c.primary} />}
          </View>
        </AppCard>
      </AnimatedPressable>
    );
  }

  function renderGuidedChecklist({ items, selected, onToggle }) {
    return (
      <View style={styles.stack}>
        {items.map((item) => {
          const title = typeof item === "string" ? item : item.title;
          const isSelected = selected.includes(title);
          return (
            <AnimatedPressable key={title} onPress={() => onToggle(title)}>
              <AppCard style={[styles.optionCard, { borderColor: isSelected ? c.primary : c.border }]}>
                <View style={styles.optionRow}>
                  <Feather
                    name={isSelected ? "check-circle" : "circle"}
                    size={20}
                    color={isSelected ? c.primary : c.textMuted}
                  />
                  <Text style={[styles.optionTitle, { color: c.text, flex: 1 }]}>{title}</Text>
                </View>
              </AppCard>
            </AnimatedPressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <AnimatedScreen style={styles.screen}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <BrandHeader
            eyebrow="Welcome to OurOrbit"
            title="Build better habits together"
            subtitle="Shared goals, real accountability, and a faster path into your first Orbit."
          />

          <OrbitProgressBar percent={progress} />

          {step === 0 && (
            <AppCard elevated glow style={styles.section}>
              <BrandBadge label="Onboarding" />
              <Text style={[styles.title, { color: c.text }]}>Welcome to OurOrbit</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Build better habits together through shared goals and accountability.
              </Text>
              <AppButton title="Get Started" onPress={continueFromIntro} />
            </AppCard>
          )}

          {false && step === 1 && (
            <AppCard elevated style={styles.section}>
              <Text style={[styles.title, { color: c.text }]}>What brings you here?</Text>
              <View style={styles.stack}>
                {GOALS.map((item) =>
                  renderOption({
                    active: goal === item.id,
                    icon: "target",
                    title: item.title,
                    onPress: () => chooseGoal(item),
                  })
                )}
              </View>
              <AppButton title="Continue" onPress={() => setStep(2)} disabled={!goal} />
            </AppCard>
          )}

          {false && step === 2 && (
            <AppCard elevated style={styles.section}>
              <Text style={[styles.title, { color: c.text }]}>How would you like to get started?</Text>
              <View style={styles.stack}>
                {renderOption({
                  active: mode === "join",
                  icon: "account-plus",
                  title: "Join an Existing Orbit",
                  description: "Use an invite code from your group.",
                  onPress: () => setMode("join"),
                })}
                {renderOption({
                  active: mode === "create",
                  icon: "plus-circle",
                  title: "Create a New Orbit",
                  description: "Choose a template and invite people after setup.",
                  onPress: () => setMode("create"),
                })}
              </View>
              <AppButton title="Continue" onPress={() => chooseMode(mode)} disabled={!mode} />
            </AppCard>
          )}

          {step === 3 && (
            <AppCard elevated style={styles.section}>
              <Text style={[styles.title, { color: c.text }]}>Choose your Orbit template</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Choose a template to start with recommended habits, tasks, projects, rewards, challenges, roles, and a matching theme.
              </Text>
              <View style={styles.stack}>
                {TEMPLATES.map((template) =>
                  renderOption({
                    active: templateId === template.id,
                    icon: template.icon,
                    title: template.title,
                    description: template.description,
                    secondary: template.secondary,
                    onPress: () => {
                      setTemplateId(template.id);
                      resetGuidedSelections(template.id);
                      resetSetupEvent();
                      markStep({ step: "template_selected" });
                    },
                  })
                )}
              </View>
              <AppButton title="Continue" onPress={() => { markStep({ step: "template_selected" }); setStep(4); }} />
            </AppCard>
          )}

          {step === 4 && mode === "create" && (
            <AppCard elevated style={styles.section}>
              <Text style={[styles.title, { color: c.text }]}>
                {templateId === "scout_troop" ? "Troop Name" : "Orbit Name"}
              </Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Template defaults will be added automatically. You can customize everything later.
              </Text>
              <TextInput
                value={orbitName}
                onChangeText={setOrbitName}
                placeholder={selectedTemplate.placeholder}
                placeholderTextColor={c.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: c.surfaceAlt || c.surface,
                    borderColor: c.border,
                    color: c.text,
                  },
                ]}
              />
              {!!provisionError && <Text style={[styles.errorText, { color: c.danger }]}>{provisionError}</Text>}
              <AppButton
                title={submitting ? "Creating..." : createdOrbit ? "Retry Provisioning" : "Create Orbit"}
                onPress={createOrbit}
                disabled={submitting}
              />
            </AppCard>
          )}

          {step === 4 && mode === "join" && !createdOrbit && (
            <AppCard elevated style={styles.section}>
              <Text style={[styles.title, { color: c.text }]}>Enter Invite Code</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Paste the invite code from your existing Orbit.
              </Text>
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="none"
                placeholder="Invite code"
                placeholderTextColor={c.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: c.surfaceAlt || c.surface,
                    borderColor: c.border,
                    color: c.text,
                  },
                ]}
              />
              <AppButton
                title={submitting ? "Joining..." : "Join Orbit"}
                onPress={joinOrbit}
                disabled={submitting}
              />
            </AppCard>
          )}

          {step === 5 && createdOrbit && mode === "create" && (
            <AppCard elevated style={styles.section}>
              <BrandBadge label="Guided Setup" />
              <Text style={[styles.title, { color: c.text }]}>Would you like to add shared habits?</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Start with habits that match your template, or skip and add your own later.
              </Text>
              {renderGuidedChecklist({
                items: HABIT_SUGGESTIONS[templateId] || HABIT_SUGGESTIONS.blank,
                selected: selectedHabits,
                onToggle: (title) => toggleSelected(setSelectedHabits, title),
              })}
              <AppButton title={submitting ? "Creating..." : "Create Selected"} onPress={createGuidedHabits} disabled={submitting} />
              <AppButton title="Skip" variant="ghost" onPress={() => setStep(6)} disabled={submitting} />
            </AppCard>
          )}

          {step === 6 && createdOrbit && mode === "create" && (
            <AppCard elevated style={styles.section}>
              <BrandBadge label="Guided Setup" />
              <Text style={[styles.title, { color: c.text }]}>Would you like to add shared tasks?</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                These are concrete one-time tasks your group can complete together.
              </Text>
              {renderGuidedChecklist({
                items: TASK_SUGGESTIONS[templateId] || TASK_SUGGESTIONS.blank,
                selected: selectedTasks,
                onToggle: (title) => toggleSelected(setSelectedTasks, title),
              })}
              <AppButton title={submitting ? "Creating..." : "Create Selected"} onPress={createGuidedTasks} disabled={submitting} />
              <AppButton title="Skip" variant="ghost" onPress={() => setStep(7)} disabled={submitting} />
            </AppCard>
          )}

          {step === 7 && createdOrbit && (
            <AppCard elevated style={styles.section}>
              <BrandBadge label="Rewards" />
              <Text style={[styles.title, { color: c.text }]}>Why Rewards Matter</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Rewards help reinforce positive habits, participation, and progress.
              </Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                A reward can be anything meaningful to your group: family movie night, extra screen time, choosing dinner, patrol pizza party, a group celebration, or a special outing.
              </Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Members earn rewards by completing habits, tasks, challenges, and group goals.
              </Text>

              <View style={styles.stack}>
                {rewardSuggestions.map((title) => {
                  const selected = selectedRewards.includes(title);
                  return (
                    <AnimatedPressable key={title} onPress={() => toggleReward(title)}>
                      <AppCard
                        style={[
                          styles.optionCard,
                          { borderColor: selected ? c.primary : c.border },
                        ]}
                      >
                        <View style={styles.optionRow}>
                          <Feather
                            name={selected ? "check-circle" : "circle"}
                            size={20}
                            color={selected ? c.primary : c.textMuted}
                          />
                          <Text style={[styles.optionTitle, { color: c.text, flex: 1 }]}>
                            {title}
                          </Text>
                        </View>
                      </AppCard>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <Text style={[styles.optionTitle, { color: c.text }]}>
                {"What's one reward your group would actually get excited about?"}
              </Text>
              <TextInput
                value={customReward}
                onChangeText={setCustomReward}
                placeholder={CUSTOM_REWARD_PLACEHOLDERS[templateId] || CUSTOM_REWARD_PLACEHOLDERS.blank}
                placeholderTextColor={c.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: c.surfaceAlt || c.surface,
                    borderColor: c.border,
                    color: c.text,
                  },
                ]}
              />
              {mode === "create" ? (
                <AppButton
                  title={submitting ? "Adding Rewards..." : "Create Selected"}
                  onPress={() => continueToSuccess({ addRewards: true })}
                  disabled={submitting}
                />
              ) : null}
              <AppButton
                title={mode === "create" ? "Skip" : "Continue"}
                variant={mode === "create" ? "ghost" : "primary"}
                onPress={() => continueToSuccess({ addRewards: false })}
                disabled={submitting}
              />
            </AppCard>
          )}

          {step === 8 && createdOrbit && mode === "create" && eventSetup && (
            <AppCard elevated style={styles.section}>
              <BrandBadge label="First Event" />
              <Text style={[styles.title, { color: c.text }]}>{eventSetup.prompt}</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>{eventSetup.intro}</Text>
              <View style={styles.stack}>
                {eventSetup.options.map((option) =>
                  renderOption({
                    active: setupEventKey === option.key,
                    icon: "calendar-plus",
                    title: option.action,
                    description: option.readiness?.length
                      ? `Includes readiness: ${option.readiness.join(", ")}`
                      : "No readiness checklist required.",
                    onPress: () => chooseSetupEvent(option),
                  })
                )}
              </View>

              {selectedSetupEvent ? (
                <>
                  <TextInput
                    value={setupEventTitle}
                    onChangeText={setSetupEventTitle}
                    placeholder="Event name"
                    placeholderTextColor={c.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: c.surfaceAlt || c.surface,
                        borderColor: c.border,
                        color: c.text,
                      },
                    ]}
                  />
                  <TextInput
                    value={setupEventDate}
                    onChangeText={setSetupEventDate}
                    placeholder="Start date (YYYY-MM-DD)"
                    placeholderTextColor={c.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: c.surfaceAlt || c.surface,
                        borderColor: c.border,
                        color: c.text,
                      },
                    ]}
                  />
                  {selectedSetupEvent.includeEndDate ? (
                    <TextInput
                      value={setupEventEndDate}
                      onChangeText={setSetupEventEndDate}
                      placeholder="End date (YYYY-MM-DD)"
                      placeholderTextColor={c.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: c.surfaceAlt || c.surface,
                          borderColor: c.border,
                          color: c.text,
                        },
                      ]}
                    />
                  ) : null}
                  <TextInput
                    value={setupEventTime}
                    onChangeText={setSetupEventTime}
                    placeholder="Time (HH:MM)"
                    placeholderTextColor={c.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: c.surfaceAlt || c.surface,
                        borderColor: c.border,
                        color: c.text,
                      },
                    ]}
                  />
                  <TextInput
                    value={setupEventLocation}
                    onChangeText={setSetupEventLocation}
                    placeholder="Location"
                    placeholderTextColor={c.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: c.surfaceAlt || c.surface,
                        borderColor: c.border,
                        color: c.text,
                      },
                    ]}
                  />
                  <AppButton
                    title={eventSetupBusy ? "Creating Event..." : "Create Event"}
                    onPress={createSetupEvent}
                    disabled={eventSetupBusy}
                  />
                </>
              ) : null}

              <AppButton
                title="Skip For Now"
                variant="ghost"
                onPress={() => setStep(9)}
                disabled={eventSetupBusy}
              />
            </AppCard>
          )}

          {step === 9 && createdOrbit && mode === "create" && (
            <AppCard elevated style={styles.section}>
              <BrandBadge label="Guided Setup" />
              <Text style={[styles.title, { color: c.text }]}>Would you like to add challenges?</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Challenges give the Orbit a clear shared target from day one.
              </Text>
              {renderGuidedChecklist({
                items: CHALLENGE_SUGGESTIONS[templateId] || CHALLENGE_SUGGESTIONS.blank,
                selected: selectedChallenges,
                onToggle: (title) => toggleSelected(setSelectedChallenges, title),
              })}
              <AppButton title={submitting ? "Creating..." : "Create Selected"} onPress={createGuidedChallenges} disabled={submitting} />
              <AppButton title="Skip" variant="ghost" onPress={() => setStep(10)} disabled={submitting} />
            </AppCard>
          )}

          {step === 10 && createdOrbit && mode === "create" && (
            <AppCard elevated style={styles.section}>
              <BrandBadge label="Guided Setup" />
              <Text style={[styles.title, { color: c.text }]}>Would you like to add a season?</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Seasons group events, rewards, milestones, and goals around a time-bound focus.
              </Text>
              {renderGuidedChecklist({
                items: SEASON_SUGGESTIONS[templateId] || SEASON_SUGGESTIONS.blank,
                selected: selectedSeasons,
                onToggle: (title) => toggleSelected(setSelectedSeasons, title),
              })}
              <AppButton title={submitting ? "Creating..." : "Create Selected"} onPress={createGuidedSeasons} disabled={submitting} />
              <AppButton title="Skip" variant="ghost" onPress={() => setStep(11)} disabled={submitting} />
            </AppCard>
          )}

          {step === 11 && createdOrbit && mode === "create" && (
            <AppCard elevated style={styles.section}>
              <BrandBadge label="Invite" />
              <Text style={[styles.title, { color: c.text }]}>Invite members now?</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                {INVITE_MESSAGES[templateId] || INVITE_MESSAGES.blank}
              </Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Bring people in now so your shared habits, challenges, rewards, and events feel alive from day one.
              </Text>

              {inviteLink ? (
                <Text selectable style={[styles.inviteLink, { color: c.primary }]}>
                  {inviteLink}
                </Text>
              ) : null}

              <View style={styles.inviteActions}>
                <AppButton
                  title={inviteBusy ? "Creating..." : "Copy Link"}
                  onPress={() => createOnboardingInviteLink({ share: false })}
                  disabled={inviteBusy}
                  fullWidth={false}
                  style={styles.inviteAction}
                />
                <AppButton
                  title="Share Invite"
                  variant="secondary"
                  onPress={() => createOnboardingInviteLink({ share: true })}
                  disabled={inviteBusy}
                  fullWidth={false}
                  style={styles.inviteAction}
                />
              </View>

              <TextInput
                value={inviteEmails}
                onChangeText={setInviteEmails}
                placeholder={"parent1@example.com\nparent2@example.com\nleader@example.com"}
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                multiline
                style={[
                  styles.input,
                  styles.multilineInput,
                  {
                    backgroundColor: c.surfaceAlt || c.surface,
                    borderColor: c.border,
                    color: c.text,
                  },
                ]}
              />
              <AppButton
                title={inviteBusy ? "Sending..." : "Email Invite"}
                onPress={sendOnboardingEmailInvites}
                disabled={inviteBusy}
              />
              <AppButton
                title="Skip for now"
                variant="ghost"
                onPress={showSuccess}
                disabled={inviteBusy}
              />
            </AppCard>
          )}

          {step === 12 && createdOrbit && (
            <AppCard elevated glow style={styles.section}>
              <BrandBadge label="Orbit Ready" />
              <LinearGradient colors={successTheme.gradient} style={styles.successBanner}>
                {successContrast.needsScrim ? <View style={styles.successScrim} /> : null}
                <Text style={[styles.successEyebrow, { color: successSecondaryColor }]}>{selectedTemplate.title}</Text>
                <Text style={[styles.successBannerTitle, { color: successTextColor }]}>{createdOrbit.name || orbitName}</Text>
                <Text style={[styles.successEyebrow, { color: successSecondaryColor }]}>{successTheme.name || "Default"} theme</Text>
              </LinearGradient>
              <Text style={[styles.title, { color: c.text }]}>Welcome to Your {selectedTemplate.title}</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Everything is ready. Start building habits, completing projects, and reaching milestones together.
              </Text>
              <View style={styles.stack}>
                {provisionedItems
                  .filter((item) => ["Habits Ready", "Rewards Ready", "Milestones Ready", "Projects Ready", "Roles Ready"].includes(item))
                  .map((item) => (
                    <View key={item} style={styles.checkRow}>
                      <Feather name="check-circle" size={19} color={c.primary} />
                      <Text style={[styles.checkText, { color: c.text }]}>{item}</Text>
                    </View>
                  ))}
              </View>
              <AppButton title="Enter Orbit" onPress={finish} />
              <AppButton title="Invite Members" variant="secondary" onPress={() => setStep(11)} />
            </AppCard>
          )}

          {step === 13 && (
            <AppCard elevated style={styles.section}>
              <Text style={[styles.title, { color: c.text }]}>Getting Started Checklist</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Starter Badge unlocked. Keep going with these first meaningful actions.
              </Text>
              <View style={styles.stack}>
                {CHECKLIST.map((item, index) => {
                  const done =
                    (index === 0 && checklist.create_or_join_orbit) ||
                    (index === 1 && checklist.invite_member);
                  return (
                    <View key={item} style={styles.checkRow}>
                      <Feather
                        name={done ? "check-circle" : "circle"}
                        size={19}
                        color={done ? c.primary : c.textMuted}
                      />
                      <Text style={[styles.checkText, { color: c.text }]}>{item}</Text>
                    </View>
                  );
                })}
              </View>
              <AppButton title="Go to My Orbit" onPress={finish} />
              <AppButton title="Go to Dashboard" variant="ghost" onPress={() => router.replace("/(tabs)/dashboard")} />
            </AppCard>
          )}
        </ScrollView>
      </AnimatedScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing["3xl"] || 48,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.lg,
  },
  title: {
    ...typography.h2,
  },
  body: {
    ...typography.body,
    lineHeight: 22,
  },
  stack: {
    gap: spacing.md,
  },
  optionCard: {
    borderWidth: 1.5,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    ...typography.subtitle,
    fontWeight: "800",
  },
  optionDescription: {
    ...typography.caption,
    lineHeight: 18,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  multilineInput: {
    minHeight: 110,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  inviteLink: {
    ...typography.caption,
  },
  inviteActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inviteAction: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
  },
  successBanner: {
    minHeight: 170,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  successScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  successEyebrow: {
    ...typography.caption,
  },
  successBannerTitle: {
    ...typography.h1,
    marginVertical: spacing.xs,
  },
  successIcon: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkText: {
    ...typography.body,
    flex: 1,
  },
});
