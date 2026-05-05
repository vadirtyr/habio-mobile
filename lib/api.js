import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

async function getToken() {
  if (global.token) return global.token;

  const stored = await SecureStore.getItemAsync("token");
  if (stored) {
    global.token = stored;
    return stored;
  }

  return null;
}

async function logout() {
  global.token = null;
  await SecureStore.deleteItemAsync("token");
  router.replace("/login");
}

async function request(path, options = {}) {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    await logout();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(data?.detail || "Request failed");
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
  logout,
};