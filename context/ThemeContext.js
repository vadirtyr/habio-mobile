import * as SecureStore from "expo-secure-store";
import React, { createContext, useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";
import { DEFAULT_THEME, themes } from "../lib/theme/themes";
import { useAuth } from "./AuthContext";

export const ThemeContext = createContext(null);

const THEME_KEY = "OurOrbit_theme";
const DEFAULT_OWNED_THEMES = ["light", "dark", "nature", "focus"];

export function ThemeProvider({ children }) {
  const { token } = useAuth();

  const [themeName, setThemeNameState] = useState(DEFAULT_THEME);
  const [ownedThemes, setOwnedThemes] = useState(DEFAULT_OWNED_THEMES);
  const [unlockedThemesNow, setUnlockedThemesNow] = useState([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function loadLocalTheme() {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_KEY);

        if (savedTheme && themes[savedTheme]) {
          setThemeNameState(savedTheme);
        }
      } catch (error) {
        console.warn("Failed to load local theme:", error);
      } finally {
        setReady(true);
      }
    }

    loadLocalTheme();
  }, []);

  useEffect(() => {
    async function syncThemeFromBackend() {
      if (!token) return;

      setSyncing(true);

      try {
        const data = await api.get("/themes/me", token);

        const backendOwned = Array.isArray(data.owned_themes)
          ? data.owned_themes
          : DEFAULT_OWNED_THEMES;

        const backendSelected =
          data.selected_theme && themes[data.selected_theme]
            ? data.selected_theme
            : DEFAULT_THEME;

        const backendUnlockedNow = Array.isArray(data.unlocked_now)
          ? data.unlocked_now
          : [];

        setOwnedThemes(backendOwned);
        setThemeNameState(backendSelected);
        setUnlockedThemesNow(backendUnlockedNow);

        await SecureStore.setItemAsync(THEME_KEY, backendSelected);
      } catch (error) {
        console.warn("Failed to sync themes:", error.message || error);
      } finally {
        setSyncing(false);
      }
    }

    syncThemeFromBackend();
  }, [token]);

  const setThemeName = async (nextThemeName) => {
    if (!themes[nextThemeName]) {
      console.warn(`Invalid theme: ${nextThemeName}`);
      return;
    }

    if (!ownedThemes.includes(nextThemeName)) {
      console.warn(`Theme not owned: ${nextThemeName}`);
      return;
    }

    setThemeNameState(nextThemeName);

    try {
      await SecureStore.setItemAsync(THEME_KEY, nextThemeName);

      if (token) {
        await api.post("/themes/select", { theme_id: nextThemeName }, token);
      }
    } catch (error) {
      console.warn("Failed to save selected theme:", error.message || error);
    }
  };

  const purchaseTheme = async (themeId) => {
    if (!token) {
      throw new Error("You must be logged in to buy themes.");
    }

    if (!themes[themeId]) {
      throw new Error("Theme not found.");
    }

    if (ownedThemes.includes(themeId)) {
      return {
        ok: true,
        alreadyOwned: true,
        owned_themes: ownedThemes,
      };
    }

    const data = await api.post("/themes/purchase", { theme_id: themeId }, token);

    const updatedOwned = Array.isArray(data.owned_themes)
      ? data.owned_themes
      : [...ownedThemes, themeId];

    setOwnedThemes(updatedOwned);

    return data;
  };

  const clearUnlockedThemesNow = () => {
    setUnlockedThemesNow([]);
  };

  const theme = themes[themeName] || themes[DEFAULT_THEME];

  const value = useMemo(
    () => ({
      ready,
      syncing,
      themeName,
      theme,
      themes,
      ownedThemes,
      unlockedThemesNow,
      clearUnlockedThemesNow,
      setThemeName,
      purchaseTheme,
      isDark: themeName === "dark",
    }),
    [ready, syncing, themeName, ownedThemes, unlockedThemesNow]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}