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

  dashboards.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const orbit = result.value?.orbit || orbits[index];
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
  });

  return { habits, tasks };
}

export function mergeUnique(personal, orbitItems, type) {
  const items = [
    ...personal.map((item) => ({ ...item, _list_key: `personal-${type}-${item.id || item._id}` })),
    ...orbitItems,
  ];
  return [...new Map(items.map((item) => [item._list_key, item])).values()];
}
