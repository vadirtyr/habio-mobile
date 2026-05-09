import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    async function checkState() {
      try {
        const token = await SecureStore.getItemAsync("token");
        const seen = await SecureStore.getItemAsync("hasSeenOnboarding");

        if (token) {
          global.token = token; // harmless fallback, AuthContext will take over
          setHasToken(true);
        }

        if (seen === "true") {
          setHasSeenOnboarding(true);
        }
      } catch (e) {
        console.log("Startup check failed", e);
      } finally {
        setChecking(false);
      }
    }

    checkState();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // 🔥 FLOW CONTROL

  // 1. First time user → onboarding
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // 2. Logged in → app
  if (hasToken) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // 3. Default → login
  return <Redirect href="/login" />;
}