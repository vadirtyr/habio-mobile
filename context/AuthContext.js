import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        setToken(storedToken || null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadToken();
  }, []);

  async function login(newToken) {
    await SecureStore.setItemAsync("token", newToken);
    setToken(newToken);
  }

  async function logout() {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ token, authLoading, login, logout }}>
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