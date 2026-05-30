import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DAILY_REMINDER_ID_KEY = "daily_orbit_reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-orbit", {
      name: "Daily Orbit Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }

  const existing = await Notifications.getPermissionsAsync();

  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  return status === "granted";
}

export async function scheduleDailyOrbitReminder({
  hour = 20,
  minute = 0,
}) {
  const allowed = await configureNotifications();

  if (!allowed) {
    throw new Error("Notifications permission was not granted.");
  }

  await cancelDailyOrbitReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID_KEY,
    content: {
      title: "Your orbit is waiting",
      body: "Complete one small action to keep your momentum going.",
      sound: "default",
    },
    trigger: {
      type: "daily",
      hour,
      minute,
      channelId: "daily-orbit",
    },
  });

  return true;
}

export async function cancelDailyOrbitReminder() {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  const existing = scheduled.find(
    (item) => item.identifier === DAILY_REMINDER_ID_KEY
  );

  if (existing) {
    await Notifications.cancelScheduledNotificationAsync(
      DAILY_REMINDER_ID_KEY
    );
  }
}

export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}