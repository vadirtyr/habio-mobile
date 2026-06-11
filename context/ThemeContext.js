import * as SecureStore from "expo-secure-store";
import React, { createContext, useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";
import { DEFAULT_THEME, themes } from "../lib/theme/themes";
import { useAuth } from "./AuthContext";

export const ThemeContext = createContext(null);

const THEME_KEY = "OurOrbit_theme";
const DEFAULT_OWNED_THEMES = ["light", "dark", "nature", "focus"];

function normalizeOwnedThemes(value) {
  const owned = Array.isArray(value) ? value : DEFAULT_OWNED_THEMES;

  return Array.from(
    new Set([...DEFAULT_OWNED_THEMES, ...owned])
  ).filter((themeId) => themes[themeId]);
}

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
    let cancelled = false;

    async function syncThemeFromBackend() {
      if (!token) {
        setSyncing(false);
        setOwnedThemes(DEFAULT_OWNED_THEMES);
        return;
      }

      setSyncing(true);

      try {
        const data = await api.get("/themes/me");

        if (cancelled) return;

        const backendOwned = normalizeOwnedThemes(data?.owned_themes);

        const backendSelected =
          data?.selected_theme &&
          themes[data.selected_theme] &&
          backendOwned.includes(data.selected_theme)
            ? data.selected_theme
            : DEFAULT_THEME;

        const backendUnlockedNow = Array.isArray(data?.unlocked_now)
          ? data.unlocked_now.filter((themeId) => themes[themeId])
          : [];

        setOwnedThemes(backendOwned);
        setThemeNameState(backendSelected);
        setUnlockedThemesNow(backendUnlockedNow);

        await SecureStore.setItemAsync(THEME_KEY, backendSelected);
      } catch (error) {
        console.warn("Failed to sync themes:", error.message || error);
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    }

    syncThemeFromBackend();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const setThemeName = async (nextThemeName) => {
    if (!themes[nextThemeName]) {
      console.warn(`Invalid theme: ${nextThemeName}`);
      return;
    }

    const safeOwnedThemes = normalizeOwnedThemes(ownedThemes);

    if (!safeOwnedThemes.includes(nextThemeName)) {
      console.warn(`Theme not owned: ${nextThemeName}`);
      return;
    }

    setThemeNameState(nextThemeName);

    try {
      await SecureStore.setItemAsync(THEME_KEY, nextThemeName);

      if (token) {
        await api.post("/themes/select", {
          theme_id: nextThemeName,
        });
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

    const safeOwnedThemes = normalizeOwnedThemes(ownedThemes);

    if (safeOwnedThemes.includes(themeId)) {
      return {
        ok: true,
        alreadyOwned: true,
        owned_themes: safeOwnedThemes,
      };
    }

    const data = await api.post("/themes/purchase", {
      theme_id: themeId,
    });

    const updatedOwned = normalizeOwnedThemes(
      Array.isArray(data?.owned_themes)
        ? data.owned_themes
        : [...safeOwnedThemes, themeId]
    );

    setOwnedThemes(updatedOwned);

    return {
      ...data,
      owned_themes: updatedOwned,
    };
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
      ownedThemes: normalizeOwnedThemes(ownedThemes),
      unlockedThemesNow,
      clearUnlockedThemesNow,
      setThemeName,
      purchaseTheme,
      isDark: themeName === "dark",
    }),
    [ready, syncing, themeName, theme, ownedThemes, unlockedThemesNow]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}