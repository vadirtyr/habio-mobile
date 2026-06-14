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
      shared_habits: [],
      shared_tasks: [],
      active_challenges: [],
      completed_challenges: [],
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

  patch: (path, body) =>
    request(path, {
      method: "PATCH",
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

  // Uploads
  createUploadUrl: (body) =>
    request("/uploads/presign", { method: "POST", body }),
  getViewUrl: (key) =>
    request(`/uploads/view-url?key=${encodeURIComponent(key)}`),
  updateAvatar: (body) =>
    request("/users/me/avatar", { method: "PATCH", body }),

  // Shared Orbits
  getOrbits: () => request("/orbits"),
  getOrbitTemplates: () => request("/orbit-templates"),
  getOrbit: (id) => request(`/orbits/${id}`),
  getOrbitDashboard,
  createOrbit: (body) => request("/orbits", { method: "POST", body }),
  createOrbitFromTemplate: (body) =>
    request("/orbits/from-template", { method: "POST", body }),
  deleteOrbit: (id) => request(`/orbits/${id}`, { method: "DELETE" }),
  getOrbitInvites: () => request("/orbits/invites/pending"),
  inviteOrbitMember: (orbitId, body) =>
    request(`/orbits/${orbitId}/invites`, { method: "POST", body }),
  createOrbitInviteLink: (orbitId, body = {}) =>
    request(`/orbits/${orbitId}/invites`, { method: "POST", body }),
  listOrbitInvites: (orbitId) =>
    request(`/orbits/${orbitId}/invites`),
  deactivateOrbitInvite: (orbitId, inviteId) =>
    request(`/orbits/${orbitId}/invites/${inviteId}/deactivate`, { method: "PATCH" }),
  getOrbitInvitePreview: (token) =>
    request(`/orbit-invites/${encodeURIComponent(token)}`),
  acceptOrbitInviteLink: (token) =>
    request(`/orbit-invites/${encodeURIComponent(token)}/accept`, { method: "POST" }),
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
  updateOrbitMemberRole: (orbitId, userId, role) =>
    request(`/orbits/${orbitId}/members/${userId}/role`, {
      method: "PATCH",
      body: { role },
    }),
  transferOrbitOwnership: (orbitId, userId) =>
    request(`/orbits/${orbitId}/members/${userId}/transfer-ownership`, {
      method: "POST",
    }),
  createOrbitGoal: (orbitId, body) =>
    request(`/orbits/${orbitId}/goals`, { method: "POST", body }),
  contributeOrbitGoal: (orbitId, goalId, body = { amount: 1 }) =>
    request(`/orbits/${orbitId}/goals/${goalId}/contribute`, {
      method: "POST",
      body,
    }),
  getOrbitHabits: (orbitId) => request(`/orbits/${orbitId}/habits`),
  createOrbitHabit: (orbitId, body) =>
    request(`/orbits/${orbitId}/habits`, { method: "POST", body }),
  updateOrbitHabit: (orbitId, habitId, body) =>
    request(`/orbits/${orbitId}/habits/${habitId}`, { method: "PATCH", body }),
  deleteOrbitHabit: (orbitId, habitId) =>
    request(`/orbits/${orbitId}/habits/${habitId}`, { method: "DELETE" }),
  completeOrbitHabit: (orbitId, habitId) =>
    request(`/orbits/${orbitId}/habits/${habitId}/complete`, { method: "POST" }),
  completeOrbitHabitWithProof: (orbitId, habitId, body) =>
    request(`/orbits/${orbitId}/habits/${habitId}/complete-with-proof`, { method: "POST", body }),
  getOrbitTasks: (orbitId) => request(`/orbits/${orbitId}/tasks`),
  createOrbitTask: (orbitId, body) =>
    request(`/orbits/${orbitId}/tasks`, { method: "POST", body }),
  updateOrbitTask: (orbitId, taskId, body) =>
    request(`/orbits/${orbitId}/tasks/${taskId}`, { method: "PATCH", body }),
  deleteOrbitTask: (orbitId, taskId) =>
    request(`/orbits/${orbitId}/tasks/${taskId}`, { method: "DELETE" }),
  completeOrbitTask: (orbitId, taskId) =>
    request(`/orbits/${orbitId}/tasks/${taskId}/complete`, { method: "POST" }),
  completeOrbitTaskWithProof: (orbitId, taskId, body) =>
    request(`/orbits/${orbitId}/tasks/${taskId}/complete-with-proof`, { method: "POST", body }),
  getPendingOrbitProofs: (orbitId) => request(`/orbits/${orbitId}/proofs/pending`),
  aiCheckOrbitProof: (orbitId, proofId) =>
    request(`/orbits/${orbitId}/proofs/${proofId}/ai-check`, { method: "POST" }),
  approveOrbitProof: (orbitId, proofId) =>
    request(`/orbits/${orbitId}/proofs/${proofId}/approve`, { method: "POST" }),
  rejectOrbitProof: (orbitId, proofId, body = {}) =>
    request(`/orbits/${orbitId}/proofs/${proofId}/reject`, { method: "POST", body }),
  getOrbitChallenges: (orbitId) => request(`/orbits/${orbitId}/challenges`),
  getOrbitChallenge: (orbitId, challengeId) =>
    request(`/orbits/${orbitId}/challenges/${challengeId}`),
  createOrbitChallenge: (orbitId, body) =>
    request(`/orbits/${orbitId}/challenges`, { method: "POST", body }),
  updateOrbitChallenge: (orbitId, challengeId, body) =>
    request(`/orbits/${orbitId}/challenges/${challengeId}`, { method: "PATCH", body }),
  deleteOrbitChallenge: (orbitId, challengeId) =>
    request(`/orbits/${orbitId}/challenges/${challengeId}`, { method: "DELETE" }),

  // Weekly Recaps
  getWeeklyRecaps: () =>
    request("/weekly-recaps"),

  generateWeeklyRecap: () =>
    request("/weekly-recaps/generate", {
      method: "POST",
    }),
  generateAIWeeklyRecap: () => request("/weekly-recaps/ai", { method: "POST" }),
  getOrbitWeeklyRecaps: (orbitId) => request(`/orbits/${orbitId}/weekly-recaps`),
  generateOrbitAIWeeklyRecap: (orbitId) =>
    request(`/orbits/${orbitId}/weekly-recap/ai`, { method: "POST" }),

  logout,


};
