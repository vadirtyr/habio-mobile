import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { getOrbitTheme } from "../lib/orbitThemes";
import { TEMPLATE_CATALOG } from "../lib/orbitTemplates";
import { gradientContrastInfo, radii, spacing, typography } from "../lib/theme";

export default function TemplateMarketplaceScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const featured = TEMPLATE_CATALOG.filter((template) => template.featured);
  const allTemplates = TEMPLATE_CATALOG;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader
        title="Template Marketplace"
        subtitle="Start with a proven Orbit setup, then customize it for your group."
      />

      <Text style={[styles.sectionTitle, { color: c.text }]}>Featured templates</Text>
      {featured.map((template) => <TemplateCard key={`featured-${template.id}`} template={template} featured />)}

      <Text style={[styles.sectionTitle, { color: c.text }]}>All templates</Text>
      {allTemplates.map((template) => <TemplateCard key={template.id} template={template} />)}
    </ScrollView>
  );
}

function TemplateCard({ template, featured = false }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const orbitTheme = getOrbitTheme(template.theme_id);
  const contrast = gradientContrastInfo(orbitTheme.gradient);
  const textColor = orbitTheme.text_color || contrast.textColor;
  const secondaryColor = contrast.secondaryTextColor || textColor;
  const summary = template.starter_summary || [];

  return (
    <Pressable onPress={() => router.push({ pathname: "/template-detail", params: { templateId: template.id } })}>
      <AppCard style={[styles.card, featured && { borderColor: c.primary }]}>
        <LinearGradient colors={orbitTheme.gradient} style={styles.preview}>
          {contrast.needsScrim ? <View style={styles.scrim} /> : null}
          <View style={styles.previewTop}>
            <MaterialCommunityIcons name={template.icon} size={26} color={textColor} />
            <Text style={[styles.previewBadge, { color: secondaryColor }]}>{template.category}</Text>
          </View>
          <Text style={[styles.previewTitle, { color: textColor }]}>{template.name}</Text>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <View style={styles.copyWrap}>
              <Text style={[styles.title, { color: c.text }]}>{template.name}</Text>
              <Text style={[styles.copy, { color: c.textSecondary }]}>{template.description}</Text>
            </View>
            {template.premium ? <Text style={[styles.pill, { color: c.warning, borderColor: c.warning }]}>Premium</Text> : null}
          </View>

          <View style={styles.summaryRow}>
            {summary.slice(0, 4).map((item) => (
              <Text key={item} style={[styles.summaryPill, { color: c.textSecondary, borderColor: c.border }]}>{item}</Text>
            ))}
          </View>

          <View style={styles.actions}>
            <AppButton title="Details" variant="secondary" style={styles.action} onPress={() => router.push({ pathname: "/template-detail", params: { templateId: template.id } })} />
            <AppButton title="Create Orbit" style={styles.action} onPress={() => router.push({ pathname: "/create-orbit", params: { template: template.id } })} />
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md },
  card: { marginBottom: spacing.md, padding: 0, overflow: "hidden", borderWidth: 1 },
  preview: { minHeight: 132, padding: spacing.lg, justifyContent: "space-between" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.24)" },
  previewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewBadge: { ...typography.caption, fontWeight: "900" },
  previewTitle: { ...typography.h2, marginTop: spacing.lg },
  cardBody: { padding: spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  copyWrap: { flex: 1 },
  title: { ...typography.h3 },
  copy: { ...typography.body, marginTop: spacing.xs },
  pill: { ...typography.caption, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, overflow: "hidden" },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  summaryPill: { ...typography.caption, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  action: { flex: 1 },
});
