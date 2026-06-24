import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { EmptyState } from "../components/EmptyState";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { getOrbitTheme } from "../lib/orbitThemes";
import { getTemplateById } from "../lib/orbitTemplates";
import { gradientContrastInfo, radii, spacing, typography } from "../lib/theme";

const SECTION_CONFIG = [
  ["roles", "Roles", "account-circle-outline"],
  ["habits", "Included Habits", "repeat"],
  ["rewards", "Included Rewards", "gift-outline"],
  ["projects", "Included Projects", "clipboard-list-outline"],
  ["milestones", "Included Milestones", "trophy-outline"],
];

export default function TemplateDetailScreen() {
  const { templateId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const template = getTemplateById(Array.isArray(templateId) ? templateId[0] : templateId);
  const orbitTheme = getOrbitTheme(template.theme_id);
  const contrast = gradientContrastInfo(orbitTheme.gradient);
  const textColor = orbitTheme.text_color || contrast.textColor;
  const secondaryColor = contrast.secondaryTextColor || textColor;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader title="Template Details" subtitle="Preview what this Orbit template gives your group." />

      <LinearGradient colors={orbitTheme.gradient} style={styles.hero}>
        {contrast.needsScrim ? <View style={styles.scrim} /> : null}
        <View style={styles.heroTop}>
          <MaterialCommunityIcons name={template.icon} size={32} color={textColor} />
          <Text style={[styles.heroMeta, { color: secondaryColor }]}>v{template.version} | {template.category}</Text>
        </View>
        <Text style={[styles.heroTitle, { color: textColor }]}>{template.name}</Text>
        <Text style={[styles.heroCopy, { color: secondaryColor }]}>{template.description}</Text>
      </LinearGradient>

      <AppCard style={styles.card}>
        <Text style={[styles.title, { color: c.text }]}>Default Theme</Text>
        <Text style={[styles.copy, { color: c.textSecondary }]}>{orbitTheme.name || template.theme_id}</Text>
        <View style={styles.summaryRow}>
          {(template.starter_summary || []).map((item) => (
            <Text key={item} style={[styles.summaryPill, { color: c.textSecondary, borderColor: c.border }]}>{item}</Text>
          ))}
        </View>
      </AppCard>

      {SECTION_CONFIG.map(([key, title, icon]) => (
        <IncludedSection key={key} title={title} icon={icon} items={template.included?.[key] || []} />
      ))}

      <View style={styles.actions}>
        <AppButton title="Back" variant="secondary" style={styles.action} onPress={() => router.back()} />
        <AppButton title="Create Orbit" style={styles.action} onPress={() => router.push({ pathname: "/create-orbit", params: { template: template.id } })} />
      </View>
    </ScrollView>
  );
}

function IncludedSection({ title, icon, items }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <AppCard style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={22} color={c.primary} />
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      </View>
      {items.length ? items.map((item) => (
        <View key={item} style={styles.itemRow}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={c.success || c.primary} />
          <Text style={[styles.copy, { color: c.textSecondary, flex: 1 }]}>{item}</Text>
        </View>
      )) : (
        <EmptyState compact title="Not prefilled" description="This template leaves this area open for your group to customize." />
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  hero: { borderRadius: radii.xxl, padding: spacing.xl, minHeight: 210, overflow: "hidden", justifyContent: "flex-end", marginBottom: spacing.lg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.24)" },
  heroTop: { position: "absolute", top: spacing.lg, left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroMeta: { ...typography.caption, fontWeight: "900" },
  heroTitle: { ...typography.h1 },
  heroCopy: { ...typography.bodyBold, marginTop: spacing.sm },
  card: { marginBottom: spacing.md },
  title: { ...typography.h3 },
  copy: { ...typography.body, marginTop: spacing.xs },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  summaryPill: { ...typography.caption, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  action: { flex: 1 },
});
