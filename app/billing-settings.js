import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const PLAN_ORDER = ["free", "plus", "family", "group"];

const PLAN_COPY = {
  free: {
    name: "Free",
    price: "$0",
    audience: "For individuals and small Orbits getting started.",
    description: "Core habit, task, project, reward, and Orbit accountability features.",
    button: "Current Plan",
  },
  plus: {
    name: "Plus",
    price: "Coming soon",
    audience: "For people who want deeper personal momentum tools.",
    description: "Advanced AI coaching, predictive insights, premium customization, and deeper personal progress tools.",
    button: "Coming Soon",
  },
  family: {
    name: "Family",
    price: "Coming soon",
    audience: "For households coordinating shared accountability.",
    description: "Family-focused dashboards, shared rewards, parent visibility, and family accountability tools.",
    button: "Coming Soon",
  },
  group: {
    name: "Group",
    price: "Coming soon",
    audience: "For troops, teams, classes, and organizations.",
    description: "Leader tools, group analytics, exports, and advanced management for troops, teams, and organizations.",
    button: "Contact Us Later",
  },
};

const FEATURE_LABELS = {
  basic_habits: "Basic habits",
  basic_tasks: "Basic tasks",
  basic_projects: "Basic projects",
  basic_orbits: "Basic Orbits",
  basic_templates: "Basic templates",
  rewards: "Rewards",
  milestones: "Milestones",
  verification_basics: "Verification basics",
  wear_os_basics: "Wear OS basics",
  advanced_ai_coach: "Advanced AI Coach",
  unlimited_ai_messages: "Unlimited AI messages",
  advanced_analytics: "Advanced analytics",
  premium_themes: "Premium themes",
  premium_templates: "Premium templates",
  group_admin_tools: "Group admin tools",
  export_reports: "Export reports",
  family_dashboard: "Family dashboard",
  leader_dashboard: "Leader dashboard",
};

const FEATURE_GROUPS = [
  {
    title: "Core",
    requiredPlan: "free",
    keys: ["basic_habits", "basic_tasks", "basic_projects", "basic_orbits", "basic_templates", "rewards", "milestones", "verification_basics", "wear_os_basics"],
  },
  {
    title: "AI",
    requiredPlan: "plus",
    keys: ["advanced_ai_coach", "unlimited_ai_messages", "advanced_analytics"],
  },
  {
    title: "Family",
    requiredPlan: "family",
    keys: ["family_dashboard"],
  },
  {
    title: "Group/Admin",
    requiredPlan: "group",
    keys: ["group_admin_tools", "leader_dashboard", "export_reports"],
  },
  {
    title: "Customization",
    requiredPlan: "plus",
    keys: ["premium_themes", "premium_templates"],
  },
];

export default function BillingSettingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [billing, setBilling] = useState(null);
  const [entitlements, setEntitlements] = useState({});
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadBilling();
    }, [])
  );

  async function loadBilling() {
    setError(null);
    try {
      const [plansData, billingData, entitlementData] = await Promise.all([
        api.getBillingPlans(),
        api.getBillingMe(),
        api.getBillingEntitlements(),
      ]);
      setPlans((plansData.plans || []).sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id)));
      setBilling(billingData);
      setEntitlements(entitlementData.entitlements || {});
    } catch (err) {
      setError(err?.message || "Unable to load billing settings.");
    } finally {
      setLoading(false);
    }
  }

  async function mockUpgrade(planId) {
    setBusyPlan(planId);
    try {
      await api.mockUpgradeBilling({ plan: planId });
      await loadBilling();
    } catch (err) {
      Alert.alert("Upgrade unavailable", err?.message || "Mock billing is not enabled.");
    } finally {
      setBusyPlan(null);
    }
  }

  async function mockCancel() {
    setBusyPlan("cancel");
    try {
      await api.mockCancelBilling({});
      await loadBilling();
    } catch (err) {
      Alert.alert("Cancel unavailable", err?.message || "Mock billing is not enabled.");
    } finally {
      setBusyPlan(null);
    }
  }

  function showLockedFeature(featureKey, requiredPlan) {
    const featureName = featureLabel(featureKey);
    Alert.alert(
      featureName,
      `${featureName} is planned for ${label(requiredPlan)}. Your current plan is ${label(userPlan)}. Payments are not live yet, so this is marked Coming soon and no existing core features are blocked.`
    );
  }

  const userPlan = billing?.user?.plan || "free";
  const status = billing?.user?.subscription_status || "none";
  const flags = billing?.flags || {};
  const mockMode = !!flags.billing_mock_mode;
  const devRuntime = globalThis.__DEV__ === true;
  const canShowMockControls = mockMode && (user?.is_admin || devRuntime);
  const renewalText = dateStatus(billing?.user);

  const mergedPlans = useMemo(() => {
    const byId = Object.fromEntries((plans || []).map((plan) => [plan.id, plan]));
    return PLAN_ORDER.map((id) => ({
      id,
      ...(byId[id] || {}),
      ...(PLAN_COPY[id] || {}),
      features: byId[id]?.features || [],
    }));
  }, [plans]);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: c.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Plan & Billing"
        subtitle="Plans are being prepared. Nothing is paywalled yet."
        right={<AppButton title="Back" variant="ghost" fullWidth={false} onPress={() => router.back()} />}
      />

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={[styles.planIcon, { backgroundColor: `${c.primary}14`, borderColor: c.border }]}>
            <MaterialCommunityIcons name="orbit" size={26} color={c.primary} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.kicker, { color: c.textSecondary }]}>Current plan</Text>
            <Text style={[styles.currentPlan, { color: c.text }]}>{label(userPlan)}</Text>
            <Text style={[styles.status, { color: c.textSecondary }]}>Status: {label(status)}</Text>
            {!!renewalText && <Text style={[styles.status, { color: c.textSecondary }]}>{renewalText}</Text>}
          </View>
        </View>
        <Text style={[styles.note, { color: c.textSecondary }]}>Core habits, tasks, projects, Orbits, rewards, milestones, verification basics, and Wear OS basics remain free.</Text>
      </AppCard>

      {!!error && (
        <AppCard style={[styles.errorCard, { borderColor: c.danger || "#EF4444" }]}>
          <Text style={[styles.errorText, { color: c.danger || "#EF4444" }]}>{error}</Text>
          <AppButton title="Retry" variant="secondary" onPress={loadBilling} style={styles.retryButton} />
        </AppCard>
      )}

      {loading ? (
        <AppCard>
          <Text style={[styles.note, { color: c.textSecondary }]}>Loading plan details...</Text>
        </AppCard>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Compare Plans</Text>
          <View style={styles.planList}>
            {mergedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={userPlan}
                colors={c}
                busyPlan={busyPlan}
                canShowMockControls={canShowMockControls}
                onMockUpgrade={mockUpgrade}
              />
            ))}
          </View>

          <EntitlementGroups
            colors={c}
            entitlements={entitlements}
            showRawKeys={!!user?.is_admin || devRuntime}
            onLockedFeature={showLockedFeature}
          />
        </>
      )}

      {canShowMockControls && (
        <AppCard style={[styles.mockCard, { borderColor: c.warning || c.primary }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Testing Controls</Text>
          <Text style={[styles.description, { color: c.textSecondary }]}>Mock billing is enabled for admin/dev testing only. These buttons do not charge cards or create real subscriptions.</Text>
          {userPlan !== "free" && (
            <AppButton
              title={busyPlan === "cancel" ? "Updating..." : "Mock Cancel"}
              variant="secondary"
              onPress={mockCancel}
              disabled={!!busyPlan}
              style={styles.cancelButton}
            />
          )}
        </AppCard>
      )}
    </ScrollView>
  );
}

function PlanCard({ plan, currentPlan, colors, busyPlan, canShowMockControls, onMockUpgrade }) {
  const isCurrent = plan.id === currentPlan;
  const isGroup = plan.id === "group";
  const showMockUpgrade = canShowMockControls && plan.id !== "free" && !isCurrent;
  const buttonTitle = isCurrent ? "Current Plan" : isGroup ? "Contact Us Later" : "Coming Soon";

  return (
    <AppCard style={[styles.planCard, isCurrent && { borderColor: colors.primary }]}>
      <View style={styles.planHeader}>
        <View style={styles.planHeading}>
          <View style={styles.nameRow}>
            <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
            {isCurrent && (
              <View style={[styles.badge, { backgroundColor: `${colors.primary}16`, borderColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>Current</Text>
              </View>
            )}
          </View>
          <Text style={[styles.price, { color: colors.text }]}>{plan.price}</Text>
          <Text style={[styles.planStatus, { color: colors.textSecondary }]}>{plan.audience}</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>{plan.description}</Text>

      <View style={styles.features}>
        {(plan.features || []).slice(0, 8).map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <MaterialCommunityIcons name="check" size={16} color={colors.success || colors.primary} />
            <Text style={[styles.featureText, { color: colors.text }]}>{featureLabel(feature)}</Text>
          </View>
        ))}
      </View>

      {showMockUpgrade ? (
        <AppButton
          title={busyPlan === plan.id ? "Updating..." : `Mock ${plan.name}`}
          onPress={() => onMockUpgrade(plan.id)}
          disabled={!!busyPlan}
          style={styles.planButton}
        />
      ) : (
        <AppButton
          title={buttonTitle}
          variant="secondary"
          disabled
          style={styles.planButton}
        />
      )}
    </AppCard>
  );
}

function EntitlementGroups({ colors, entitlements, showRawKeys, onLockedFeature }) {
  return (
    <View style={styles.entitlementWrap}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Included Access</Text>
      {FEATURE_GROUPS.map((group) => (
        <AppCard key={group.title}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>{group.title}</Text>
          <View style={styles.features}>
            {group.keys.map((featureKey) => {
              const enabled = group.requiredPlan === "free" || !!entitlements[featureKey];
              return (
                <Pressable
                  key={featureKey}
                  onPress={() => !enabled && onLockedFeature(featureKey, group.requiredPlan)}
                  style={({ pressed }) => [styles.featureRow, pressed && !enabled && styles.pressed]}
                >
                  <MaterialCommunityIcons
                    name={enabled ? "check-circle-outline" : "lock-outline"}
                    size={17}
                    color={enabled ? colors.success || colors.primary : colors.textMuted || colors.textSecondary}
                  />
                  <View style={styles.featureCopy}>
                    <Text style={[styles.featureText, { color: colors.text }]}>{featureLabel(featureKey)}</Text>
                    <Text style={[styles.featureMeta, { color: colors.textSecondary }]}>
                      {enabled ? "Included" : `${label(group.requiredPlan)} - Coming soon`}
                      {showRawKeys ? ` - ${featureKey}` : ""}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </AppCard>
      ))}
    </View>
  );
}

function dateStatus(subscription) {
  if (!subscription) return "";
  if (subscription.trial_ends_at) return `Trial ends ${formatDate(subscription.trial_ends_at)}`;
  if (subscription.subscription_expires_at) return `Expires ${formatDate(subscription.subscription_expires_at)}`;
  return "";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function featureLabel(value) {
  return FEATURE_LABELS[value] || label(value);
}

function label(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 120, gap: spacing.lg },
  summaryCard: { borderWidth: 1 },
  summaryRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  planIcon: { width: 54, height: 54, borderRadius: radii.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  summaryCopy: { flex: 1 },
  kicker: { ...typography.caption, fontWeight: "900", textTransform: "uppercase" },
  currentPlan: { ...typography.h2, marginTop: spacing.xs },
  status: { ...typography.caption, marginTop: spacing.xs },
  note: { ...typography.body, lineHeight: 22, marginTop: spacing.md },
  errorCard: { borderWidth: 1 },
  errorText: { ...typography.bodyBold },
  retryButton: { marginTop: spacing.md },
  sectionTitle: { ...typography.h3 },
  planList: { gap: spacing.lg },
  planCard: { borderWidth: 1 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  planHeading: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  planName: { ...typography.h3 },
  price: { ...typography.h2, marginTop: spacing.sm },
  planStatus: { ...typography.caption, fontWeight: "900", marginTop: spacing.xs },
  badge: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { ...typography.micro, fontWeight: "900" },
  description: { ...typography.body, lineHeight: 22, marginTop: spacing.md },
  features: { gap: spacing.sm, marginTop: spacing.md },
  featureRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", minHeight: 30 },
  featureCopy: { flex: 1 },
  featureText: { ...typography.caption, fontWeight: "800", flex: 1 },
  featureMeta: { ...typography.micro, marginTop: 2 },
  pressed: { opacity: 0.7 },
  planButton: { marginTop: spacing.lg },
  entitlementWrap: { gap: spacing.lg },
  groupTitle: { ...typography.bodyBold },
  mockCard: { borderWidth: 1 },
  cancelButton: { marginTop: spacing.lg },
});
