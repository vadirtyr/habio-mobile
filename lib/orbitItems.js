import { api } from "./api";

function list(data) {
  if (Array.isArray(data)) return data;
  return data?.items || [];
}

export async function getOrbitItems() {
  const orbitData = await api.getOrbits();
  const orbits = list(orbitData);
  const dashboards = await Promise.allSettled(
    orbits.map((orbit) => api.getOrbitDashboard(orbit.id))
  );
  const habits = [];
  const tasks = [];
  const summaries = [];
  const activity = [];

  dashboards.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const orbit = result.value?.orbit || orbits[index];
    const dashboard = result.value || {};
    const stats = dashboard.stats || {};
    const shared = {
      is_orbit_item: true,
      orbit_id: orbit.id,
      orbit_name: orbit.name || "Shared Orbit",
    };
    (result.value?.shared_habits || []).forEach((item) => habits.push({
      ...item,
      ...shared,
      orbit_item_type: "habit",
      _list_key: `orbit-habit-${orbit.id}-${item.id}`,
      coins_per_completion: 0,
    }));
    (result.value?.shared_tasks || []).forEach((item) => tasks.push({
      ...item,
      ...shared,
      orbit_item_type: "task",
      _list_key: `orbit-task-${orbit.id}-${item.id}`,
      coins_reward: 0,
    }));
    const recentActivity = dashboard.recent_activity || [];
    summaries.push({
      ...orbit,
      weekly_completion_rate: stats.weekly_completion_rate || 0,
      weekly_actions: stats.weekly_actions || 0,
      member_count: stats.member_count || orbit.member_count || 0,
      active_challenges_count: (dashboard.active_challenges || []).length,
      due_count: (dashboard.shared_habits || []).filter((item) => !item.completed_today).length +
        (dashboard.shared_tasks || []).filter((item) => !item.completed).length,
      last_activity_at: recentActivity[0]?.created_at || orbit.updated_at || orbit.created_at,
    });
    recentActivity.forEach((item) => activity.push({
      ...item,
      is_orbit_activity: true,
      orbit_id: orbit.id,
      orbit_name: orbit.name || "Shared Orbit",
      _list_key: `orbit-activity-${orbit.id}-${item.id}`,
    }));
  });

  summaries.sort((a, b) => String(b.last_activity_at || "").localeCompare(String(a.last_activity_at || "")));
  activity.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  return { habits, tasks, orbits: summaries, activity };
}

export function mergeUnique(personal, orbitItems, type) {
  const items = [
    ...personal.map((item) => ({ ...item, is_orbit_item: false, context_label: "Personal", _list_key: `personal-${type}-${item.id || item._id}` })),
    ...orbitItems,
  ];
  return [...new Map(items.map((item) => [item._list_key, item])).values()];
}
