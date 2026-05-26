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

async function resetAccountData() {
  const token = await getToken();

  const res = await fetch(`${API_URL}/account/reset-data`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || data.message || "Unable to reset account data.");
  }

  return data;
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
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;

  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (response.status === 401) {
    await clearSession();
    router.replace("/login");
    throw new Error("Session expired. Please log in again.");
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
export async function changePassword(currentPassword, newPassword) {
  return api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  
}
export const api = {
  // existing exports...
  resetAccountData,
};
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

  logout,
};