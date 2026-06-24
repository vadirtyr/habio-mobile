import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { ORBIT_THEMES } from "../lib/orbitThemes";
import { gradientContrastInfo, radii, spacing, typography } from "../lib/theme";

export default function OrbitThemeSettingsScreen() {
  const { orbitId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [orbit, setOrbit] = useState(null);
  const [themes, setThemes] = useState(ORBIT_THEMES);
  const [selectedThemeId, setSelectedThemeId] = useState("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [orbitData, themeData] = await Promise.all([
        api.getOrbit(orbitId),
        api.getOrbitThemes().catch(() => ({ items: ORBIT_THEMES })),
      ]);
      setOrbit(orbitData);
      setThemes(themeData.items?.length ? themeData.items : ORBIT_THEMES);
      setSelectedThemeId(orbitData.theme_id || orbitData.theme?.id || "default");
    } catch (err) {
      setError(err.message || "Unable to load Orbit themes.");
    } finally {
      setLoading(false);
    }
  }, [orbitId]);

  useEffect(() => { load(); }, [load]);

  const selectedTheme = useMemo(
    () => themes.find((item) => item.id === selectedThemeId) || themes[0] || ORBIT_THEMES[0],
    [selectedThemeId, themes]
  );

  const save = async () => {
    try {
      setSaving(true);
      await api.updateOrbitTheme(orbitId, selectedThemeId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (err) {
      Alert.alert("Theme not saved", err.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={[styles.center, { backgroundColor: c.background }]}><Text style={{ color: c.textMuted }}>Loading themes...</Text></View>;
  if (error) return <View style={[styles.center, { backgroundColor: c.background }]}><ErrorState message={error} onRetry={load} /></View>;
  if (!orbit) return <View style={[styles.center, { backgroundColor: c.background }]}><EmptyState title="Orbit not found" description="This Orbit could not be loaded." /></View>;

  const canSave = selectedThemeId && selectedThemeId !== (orbit.theme_id || orbit.theme?.id || "default");
  const previewContrast = gradientContrastInfo(selectedTheme.gradient);
  const previewText = selectedTheme.text_color || previewContrast.textColor;
  const previewSecondary = previewContrast.secondaryTextColor || previewText;

  return <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
    <ScreenHeader title="Theme & Banner" subtitle="Choose a built-in banner style for this Orbit." />

    <LinearGradient colors={selectedTheme.gradient} style={styles.previewBanner}>
      {previewContrast.needsScrim ? <View style={styles.previewScrim} /> : null}
      <View style={styles.previewContent}>
        <View style={styles.previewCopy}>
          <Text style={[styles.smallLabel, { color: previewSecondary }]}>Current preview</Text>
          <Text style={[styles.previewTitle, { color: previewText }]}>{orbit.name}</Text>
          <Text style={[styles.previewMeta, { color: previewSecondary }]}>{selectedTheme.name} theme · Built-in banner</Text>
        </View>
        <MaterialCommunityIcons name="orbit" size={42} color={selectedTheme.accent || previewText} />
      </View>
    </LinearGradient>

    <Text style={[styles.sectionTitle, { color: c.text }]}>Built-in Themes</Text>
    <Text style={[styles.copy, { color: c.textSecondary }]}>Image banner uploads are reserved for a future release. For now, these built-in themes keep every Orbit polished and readable.</Text>

    <View style={styles.grid}>
      {themes.map((item) => (
        <ThemePreviewCard
          key={item.id}
          item={item}
          selected={item.id === selectedThemeId}
          onPress={() => setSelectedThemeId(item.id)}
          colors={c}
        />
      ))}
    </View>

    <View style={styles.footerActions}>
      <AppButton title="Cancel" variant="secondary" style={styles.footerButton} onPress={() => router.back()} disabled={saving} />
      <AppButton title={saving ? "Saving..." : "Save Theme"} style={styles.footerButton} onPress={save} disabled={saving || !canSave} />
    </View>
  </ScrollView>;
}

function ThemePreviewCard({ item, selected, onPress, colors }) {
  const contrast = gradientContrastInfo(item.gradient);
  const textColor = item.text_color || contrast.textColor;
  const secondaryColor = contrast.secondaryTextColor || textColor;
  return <Pressable onPress={onPress} style={[styles.themeCard, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
    <LinearGradient colors={item.gradient} style={styles.themeSwatch}>
      {contrast.needsScrim ? <View style={styles.previewScrim} /> : null}
      <Text style={[styles.themeNameOnGradient, { color: textColor }]}>{item.name}</Text>
      <Text style={[styles.themeMetaOnGradient, { color: secondaryColor }]}>{selected ? "Selected" : "Preview"}</Text>
    </LinearGradient>
    <View style={styles.themeBody}>
      <View style={styles.themeCopy}>
        <Text style={[styles.themeName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>{item.description}</Text>
      </View>
      {selected ? <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} /> : null}
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  container: { padding: spacing.xl, paddingBottom: 120 },
  previewBanner: { minHeight: 180, borderRadius: radii.xxl, padding: spacing.xl, overflow: "hidden", marginBottom: spacing.xl },
  previewScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
  previewContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  previewCopy: { flex: 1 },
  previewTitle: { ...typography.h1, marginTop: spacing.xs },
  previewMeta: { ...typography.body, marginTop: spacing.xs },
  smallLabel: { ...typography.caption },
  sectionTitle: { ...typography.h3, marginBottom: spacing.xs },
  copy: { ...typography.body, marginBottom: spacing.lg },
  grid: { gap: spacing.md },
  themeCard: { borderWidth: 1, borderRadius: radii.xl, overflow: "hidden" },
  themeSwatch: { minHeight: 112, padding: spacing.md, justifyContent: "flex-end", overflow: "hidden" },
  themeNameOnGradient: { ...typography.bodyBold },
  themeMetaOnGradient: { ...typography.caption, marginTop: spacing.xs },
  themeBody: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  themeCopy: { flex: 1 },
  themeName: { ...typography.bodyBold },
  themeDescription: { ...typography.caption, marginTop: spacing.xs },
  footerActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  footerButton: { flex: 1 },
});
