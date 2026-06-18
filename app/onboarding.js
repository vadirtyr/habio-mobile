import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
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
import { radii, spacing, typography } from "../lib/theme";

const GOALS = [
  { id: "family", title: "Family Accountability", template: "family" },
  { id: "scout", title: "Scout Troop", template: "scout_troop" },
  { id: "accountability", title: "Accountability Group", template: "accountability_circle" },
  { id: "fitness", title: "Fitness Goals", template: "fitness_group" },
  { id: "study", title: "Study Group", template: "study_group" },
  { id: "personal", title: "Personal Growth", template: "blank" },
];

const TEMPLATES = [
  {
    id: "family",
    title: "Family",
    icon: "home-heart",
    placeholder: "Williams Family",
    description: "Shared goals, chores, rewards, and family accountability.",
  },
  {
    id: "scout_troop",
    title: "Scout Troop",
    icon: "tent",
    placeholder: "Troop 123",
    description: "Meetings, campouts, service projects, leadership, and troop accountability.",
  },
  {
    id: "accountability_circle",
    title: "Accountability Circle",
    icon: "account-group",
    placeholder: "Morning Momentum",
    description: "Weekly check-ins, shared goals, and group accountability.",
  },
  {
    id: "fitness_group",
    title: "Fitness Group",
    icon: "run",
    placeholder: "Saturday Striders",
    description: "Workouts, step goals, fitness challenges, and team motivation.",
  },
  {
    id: "study_group",
    title: "Study Group",
    icon: "school",
    placeholder: "Exam Prep Crew",
    description: "Study sessions, reading goals, exam prep, and group focus.",
  },
  {
    id: "blank",
    title: "Blank Orbit",
    icon: "orbit",
    placeholder: "My Orbit",
    description: "Start with an empty Orbit and customize everything yourself.",
    secondary: true,
  },
];

const SUCCESS_ACTIONS = {
  family: ["Invite family members", "Review starter challenges", "Review starter rewards"],
  scout_troop: ["Invite leaders", "Create first event", "Review patrols"],
  accountability_circle: ["Invite members", "Schedule check-in"],
  fitness_group: ["Invite workout partners", "Review challenges"],
  study_group: ["Invite study group", "Schedule study session"],
  blank: ["Invite a member", "Create your first challenge", "Add an event"],
};

const CHECKLIST = [
  "Create or Join an Orbit",
  "Invite a Member",
  "View a Challenge",
  "View an Event",
  "Complete a Task or Habit",
];

export default function OnboardingScreen() {
  const { refresh } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(null);
  const [mode, setMode] = useState(null);
  const [templateId, setTemplateId] = useState("family");
  const [orbitName, setOrbitName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createdOrbit, setCreatedOrbit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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

  const suggestedActions = SUCCESS_ACTIONS[templateId] || SUCCESS_ACTIONS.blank;
  const progress = Math.round(((step + 1) / 7) * 100);

  async function markStep(body) {
    try {
      await api.completeOnboardingStep(body);
    } catch (_error) {}
  }

  function chooseGoal(item) {
    setGoal(item.id);
    setTemplateId(item.template);
    markStep({ step: "goal_selected", onboarding_goal: item.id });
  }

  function continueFromIntro() {
    markStep({ step: "welcome" });
    setStep(1);
  }

  function chooseMode(nextMode) {
    setMode(nextMode);
    markStep({ step: "join_or_create_selected" });
    setStep(nextMode === "join" ? 5 : 3);
  }

  async function createOrbit() {
    const name = orbitName.trim();

    if (!name) {
      Alert.alert("Orbit name required", "Give your Orbit a name to continue.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await api.createOrbit({
        name,
        template: templateId,
      });
      const orbit = data?.orbit || data;

      setCreatedOrbit(orbit);
      setChecklist((current) => ({ ...current, create_or_join_orbit: true }));

      await api.completeOnboardingStep({
        step: "success",
        checklist_item: "create_or_join_orbit",
      });
      await api.completeOnboarding();
      await refresh?.();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setStep(5);
    } catch (error) {
      Alert.alert("Create Orbit failed", error?.message || "Unable to create your Orbit.");
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
        step: "success",
        checklist_item: "create_or_join_orbit",
      });
      await api.completeOnboarding();
      await refresh?.();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setStep(5);
    } catch (error) {
      Alert.alert("Join Orbit failed", error?.message || "Unable to join that Orbit.");
    } finally {
      setSubmitting(false);
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
              <BrandBadge label="Onboarding 2.0" />
              <Text style={[styles.title, { color: c.text }]}>Welcome to OurOrbit</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Build better habits together through shared goals and accountability.
              </Text>
              <AppButton title="Get Started" onPress={continueFromIntro} />
            </AppCard>
          )}

          {step === 1 && (
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

          {step === 2 && (
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
              <Text style={[styles.title, { color: c.text }]}>Choose Template</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Templates include starter challenges, rewards, events, and readiness checklists.
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
                      markStep({ step: "template_selected" });
                    },
                  })
                )}
              </View>
              <AppButton title="Continue" onPress={() => setStep(4)} />
            </AppCard>
          )}

          {step === 4 && (
            <AppCard elevated style={styles.section}>
              <Text style={[styles.title, { color: c.text }]}>
                {templateId === "scout_troop" ? "Troop Name" : "Orbit Name"}
              </Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Starter content will be added automatically.
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
              <AppButton
                title={submitting ? "Creating..." : "Create Orbit"}
                onPress={createOrbit}
                disabled={submitting}
              />
            </AppCard>
          )}

          {step === 5 && mode === "join" && !createdOrbit && (
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

          {step === 5 && createdOrbit && (
            <AppCard elevated glow style={styles.section}>
              <View style={[styles.successIcon, { backgroundColor: `${c.primary}18` }]}>
                <Feather name="check" size={30} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.text }]}>Your Orbit is ready.</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Here are the best next actions to build momentum.
              </Text>
              <View style={styles.stack}>
                {suggestedActions.map((action) => (
                  <View key={action} style={styles.checkRow}>
                    <Feather name="arrow-right-circle" size={18} color={c.primary} />
                    <Text style={[styles.checkText, { color: c.text }]}>{action}</Text>
                  </View>
                ))}
              </View>
              <AppButton title="View Getting Started Checklist" onPress={() => setStep(6)} />
            </AppCard>
          )}

          {step === 6 && (
            <AppCard elevated style={styles.section}>
              <Text style={[styles.title, { color: c.text }]}>Getting Started Checklist</Text>
              <Text style={[styles.body, { color: c.textMuted }]}>
                Starter Badge unlocked. Keep going with these first meaningful actions.
              </Text>
              <View style={styles.stack}>
                {CHECKLIST.map((item, index) => {
                  const done = index === 0 && checklist.create_or_join_orbit;
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
