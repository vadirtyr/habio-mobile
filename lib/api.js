import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

async function getToken() {
  if (global.token) {
    return global.token;
  }

  const storedToken = await SecureStore.getItemAsync("token");

  if (storedToken) {
    global.token = storedToken;
    return storedToken;
  }

  return null;
}

async function clearSession() {
  global.token = null;
  await SecureStore.deleteItemAsync("token");
}

async function logout() {
  await clearSession();
  router.replace("/login");
}

async function registerPushToken(token, platform = "android", timezone = "UTC") {
  return request("/push/register", {
    method: "POST",
    body: {
      token,
      platform,
      timezone,
    },
  });
}

async function getOrbitDashboard(id) {
  try {
    return await request(`/orbits/${id}/dashboard`);
  } catch (error) {
    const dashboardUnavailable =
      error.message === "Not Found" ||
      error.message === "Request failed with status 404";

    if (!dashboardUnavailable) throw error;

    const orbit = await request(`/orbits/${id}`);
    return {
      orbit,
      stats: {
        member_count: orbit.member_count || 0,
        weekly_actions: 0,
        weekly_completion_rate: 0,
        habits_completed_this_week: 0,
        tasks_completed_this_week: 0,
        current_streak: 0,
      },
      members: orbit.members || [],
      recent_activity: orbit.activity || [],
    };
  }
}

async function request(path, options = {}) {
  const token = await getToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },

    body: options.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  let data = null;

  try {
    data = await response.json();
  } catch (_err) {
    data = null;
  }

  if (response.status === 401) {
    await clearSession();
    router.replace("/login");

    throw new Error(
      "Session expired. Please log in again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function resetAccountData() {
  return request("/account/reset-data", {
    method: "POST",
  });
}

export async function changePassword(
  currentPassword,
  newPassword
) {
  return request("/auth/change-password", {
    method: "POST",
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

export const api = {
  get: (path) => request(path),

  post: (path, body) =>
    request(path, {
      method: "POST",
      body,
    }),

  put: (path, body) =>
    request(path, {
      method: "PUT",
      body,
    }),

  delete: (path) =>
    request(path, {
      method: "DELETE",
    }),

    registerPushToken,

      // Social
    followUser: (targetId) =>
    request(`/users/${targetId}/follow`, {
      method: "POST",
    }),

    unfollowUser: (targetId) =>
    request(`/users/${targetId}/unfollow`, {
      method: "POST",
    }),
  // Notifications
  getNotifications: () =>
    request("/notifications"),

  getUnreadNotificationCount: () =>
    request("/notifications/unread-count"),

  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: "POST",
    }),

  markAllNotificationsRead: () =>
    request("/notifications/read-all", {
      method: "POST",
    }),

  getPendingCelebrations: () =>
    request("/celebrations/pending"),

  dismissCelebration: (id) =>
    request(`/celebrations/${id}/dismiss`, {
      method: "POST",
    }),

  // Shared Orbits
  getOrbits: () => request("/orbits"),
  getOrbit: (id) => request(`/orbits/${id}`),
  getOrbitDashboard,
  createOrbit: (body) => request("/orbits", { method: "POST", body }),
  deleteOrbit: (id) => request(`/orbits/${id}`, { method: "DELETE" }),
  getOrbitInvites: () => request("/orbits/invites/pending"),
  inviteOrbitMember: (orbitId, body) =>
    request(`/orbits/${orbitId}/invites`, { method: "POST", body }),
  acceptOrbitInvite: (inviteId) =>
    request(`/orbits/invites/${inviteId}/accept`, { method: "POST" }),
  declineOrbitInvite: (inviteId) =>
    request(`/orbits/invites/${inviteId}/decline`, { method: "POST" }),
  joinOrbitByCode: (code) =>
    request(`/orbits/join/${encodeURIComponent(code)}`, { method: "POST" }),
  leaveOrbit: (orbitId) =>
    request(`/orbits/${orbitId}/leave`, { method: "POST" }),
  removeOrbitMember: (orbitId, userId) =>
    request(`/orbits/${orbitId}/members/${userId}`, { method: "DELETE" }),
  createOrbitGoal: (orbitId, body) =>
    request(`/orbits/${orbitId}/goals`, { method: "POST", body }),
  contributeOrbitGoal: (orbitId, goalId, body = { amount: 1 }) =>
    request(`/orbits/${orbitId}/goals/${goalId}/contribute`, {
      method: "POST",
      body,
    }),

  // Weekly Recaps
  getWeeklyRecaps: () =>
    request("/weekly-recaps"),

  generateWeeklyRecap: () =>
    request("/weekly-recaps/generate", {
      method: "POST",
    }),

  logout,


};
