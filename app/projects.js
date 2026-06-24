import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { OrbitProgressBar } from "../components/OrbitProgressBar";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { spacing, typography } from "../lib/theme";

export default function ProjectsScreen() {
  const { orbitId, orbitName } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getProjects(orbitId || null);
      setProjects(data.items || []);
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, [orbitId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const projectGroups = useMemo(() => {
    const sorted = [...projects].sort((a, b) => getProjectGroupLabel(a, orbitName).localeCompare(getProjectGroupLabel(b, orbitName)));
    return sorted.reduce((groups, project) => {
      const label = getProjectGroupLabel(project, orbitName);
      const existing = groups.find((group) => group.label === label);
      if (existing) existing.items.push(project);
      else groups.push({ label, items: [project] });
      return groups;
    }, []);
  }, [projects, orbitName]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.container}>
      <ScreenHeader
        title={orbitId ? "Orbit Projects" : "Projects"}
        subtitle={orbitName ? `${orbitName} multi-step goals` : "Break large goals into rewarding subtasks."}
        right={<AppButton title="Create" fullWidth={false} onPress={() => router.push({ pathname: "/create-project", params: { orbitId, orbitName } })} />}
      />

      {error ? <ErrorState title="Projects unavailable" description={error} onRetry={load} /> : null}

      {loading ? (
        <Text style={[styles.copy, { color: c.textSecondary }]}>Loading projects...</Text>
      ) : projects.length === 0 ? (
        <AppCard>
          <EmptyState
            title="No projects yet"
            description="Create a project for a bigger goal, then complete it one subtask at a time."
            icon={<MaterialCommunityIcons name="clipboard-list-outline" size={44} color={c.primary} />}
          />
        </AppCard>
      ) : projectGroups.map((group) => (
        <View key={group.label}>
          <View style={styles.groupHeader}>
            <Text style={[styles.groupTitle, { color: c.text }]}>{group.label}</Text>
            <Text style={[styles.groupCount, { color: c.textMuted }]}>{group.items.length}</Text>
          </View>
          {group.items.map((project) => (
            <Pressable key={project.id} onPress={() => router.push({ pathname: "/project-detail", params: { projectId: project.id } })}>
              <AppCard style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.copyWrap}>
                    <Text style={[styles.title, { color: c.text }]}>{project.title}</Text>
                    {!!project.description && <Text style={[styles.copy, { color: c.textSecondary }]} numberOfLines={2}>{project.description}</Text>}
                    <Text style={[styles.meta, { color: c.textMuted }]}> 
                      {project.orbit_id ? (project.orbit_name || orbitName || "Orbit project") : "Personal project"} | {project.completed_subtasks || 0}/{project.total_subtasks || 0} subtasks
                    </Text>
                  </View>
                  <Text style={[styles.percent, { color: project.completed ? c.success : c.primary }]}> 
                    {project.completion_percent || 0}%
                  </Text>
                </View>
                <OrbitProgressBar percent={project.completion_percent || 0} style={styles.progress} />
              </AppCard>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function getProjectGroupLabel(project, routeOrbitName) {
  if (project?.orbit_id) return `Orbit: ${project.orbit_name || routeOrbitName || "Shared Orbit"}`;
  return "Personal";
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 100 },
  card: { marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  copyWrap: { flex: 1 },
  title: { ...typography.h3 },
  copy: { ...typography.body, marginTop: spacing.xs },
  meta: { ...typography.caption, marginTop: spacing.sm },
  percent: { ...typography.h3 },
  progress: { marginTop: spacing.md },
  groupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg, marginBottom: spacing.sm },
  groupTitle: { ...typography.bodyBold },
  groupCount: { ...typography.caption, fontWeight: "800" },
});
