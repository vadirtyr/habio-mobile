import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="create-habit" />
          <Stack.Screen name="create-task" />
          <Stack.Screen name="create-reward" />
          <Stack.Screen name="edit-habit" />
          <Stack.Screen name="edit-task" />
          <Stack.Screen name="edit-reward" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}