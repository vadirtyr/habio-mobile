import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { useTheme } from "../hooks/useTheme";
import { configureGoogleSignIn } from "../lib/googleAuth";

function AppShell() {
  const { theme, themeName, ready } = useTheme();

  if (!ready) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.loadingLogoWrap,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.text,
            },
          ]}
        >
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.loadingTitle, { color: theme.colors.text }]}>
          OurOrbit
        </Text>

        <Text style={[styles.loadingSubtitle, { color: theme.colors.muted }]}>
          Preparing your orbit...
        </Text>

        <ActivityIndicator
          color={theme.colors.primary}
          style={styles.loader}
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={themeName === "dark" ? "light" : "dark"} />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen name="index" />

        <Stack.Screen name="login" />
        <Stack.Screen name="register" />

        <Stack.Screen name="onboarding" />
        <Stack.Screen name="choose-habit" />

        <Stack.Screen name="create-habit" />
        <Stack.Screen name="create-task" />
        <Stack.Screen name="create-reward" />

        <Stack.Screen name="edit-habit" />
        <Stack.Screen name="edit-task" />
        <Stack.Screen name="edit-reward" />

        <Stack.Screen name="theme-store" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="delete-account" />
        <Stack.Screen name="privacy" />

        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    configureGoogleSignIn();

    function handleNotificationResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data;

      if (data?.type === "streak_reminder") {
        router.push("/(tabs)/habits");
        return;
      }

      if (data?.type === "weekly_recap") {
        router.push("/weekly-recap");
        return;
      }

      router.push("/notifications");
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingLogoWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },

  loadingLogo: {
    width: 72,
    height: 72,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  loadingSubtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
  },

  loader: {
    marginTop: 22,
  },
});
