import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

import { api } from "../lib/api";
import { googleSignOut } from "../lib/googleAuth";
import { registerForPushNotifications } from "../lib/pushNotifications";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function refresh() {
    try {
      const data = await api.get("/auth/me");
      setUser(data?.user || data || null);
      return data?.user || data || null;
    } catch (error) {
      console.log("Failed to refresh auth user:", error.message || error);
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await SecureStore.getItemAsync("token");

        if (storedToken) {
          global.token = storedToken;
          setToken(storedToken);

          await refresh();
          registerForPushNotifications().catch(console.log);
        } else {
          global.token = null;
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.log("Failed to load auth token:", error);
        global.token = null;
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadToken();
  }, []);

  async function login(newToken) {
    try {
      await SecureStore.setItemAsync("token", newToken);
      global.token = newToken;
      setToken(newToken);

      const refreshedUser = await refresh();

      registerForPushNotifications().catch(console.log);

      return refreshedUser;
    } catch (error) {
      console.log("Failed to save auth token:", error);
      throw error;
    }
  }

  async function logout() {
    try {
      await SecureStore.deleteItemAsync("token");
    } catch (error) {
      console.log("Failed to delete auth token:", error);
    } finally {
      await googleSignOut();
      global.token = null;
      setToken(null);
      setUser(null);
      router.replace("/login");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        authLoading,
        isLoggedIn: !!token,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}