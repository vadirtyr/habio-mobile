import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

import { googleSignOut } from "../lib/googleAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await SecureStore.getItemAsync("token");

        if (storedToken) {
          global.token = storedToken;
          setToken(storedToken);
        } else {
          global.token = null;
          setToken(null);
        }
      } catch (error) {
        console.log("Failed to load auth token:", error);
        global.token = null;
        setToken(null);
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
      router.replace("/login");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        authLoading,
        isLoggedIn: !!token,
        login,
        logout,
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