const REMINDER_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function normalizeReminderTime(value) {
  const trimmed = String(value || "").trim();

  if (!REMINDER_TIME_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
