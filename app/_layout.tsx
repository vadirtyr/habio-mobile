import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { useTheme } from "../hooks/useTheme";

function AppShell() {
  const { theme, themeName, ready } = useTheme();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={themeName === "dark" ? "light" : "dark"} />

      <Stack screenOptions={{ headerShown: false }}>
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

        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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