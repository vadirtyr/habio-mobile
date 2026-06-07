import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  try {
    alert("Starting push registration");

    if (!Device.isDevice) {
      alert("Not a physical device");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    alert("Existing permission: " + existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    alert("Final permission: " + finalStatus);

    if (finalStatus !== "granted") {
      alert("Push permission not granted");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    alert("Project ID: " + projectId);

    const tokenResult =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const token = tokenResult.data;

    alert("Token: " + token);

    await api.registerPushToken(token, Platform.OS);

    alert("Token sent to backend");

    return token;
  } catch (error) {
    alert("Push registration failed: " + String(error?.message || error));
    console.log("Push registration failed:", error);
    return null;
  }
}