import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "./AnimatedPressable";
import { AppInput } from "./AppInput";
import { useTheme } from "../hooks/useTheme";
import { radii, spacing, typography } from "../lib/theme";

const TYPES = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "annual", label: "Annual" },
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VISIBILITY = [0, 1, 3, 7, 14, 30];

export function RecurrenceFields({ value, onChange, allowNone = false }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const types = allowNone ? [{ key: "none", label: "One-time" }, ...TYPES] : TYPES;
  const recurrence = value.recurrence_type || "daily";

  function update(patch) {
    onChange({ ...value, ...patch });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: c.textSecondary }]}>Repeat</Text>
      <ChipRow options={types} value={recurrence} onChange={(recurrence_type) => update({ recurrence_type })} />

      {recurrence !== "none" ? (
        <>
          <Text style={[styles.label, { color: c.textSecondary }]}>Interval</Text>
          <AppInput
            value={String(value.interval || 1)}
            onChangeText={(text) => update({ interval: text.replace(/\D/g, "") })}
            keyboardType="number-pad"
            placeholder="Every 1 cycle"
            maxLength={3}
          />

          {recurrence === "weekly" ? (
            <>
              <Text style={[styles.label, { color: c.textSecondary }]}>Days of week</Text>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((label, index) => {
                  const selected = (value.days_of_week || []).includes(index);
                  return (
                    <AnimatedPressable
                      key={label}
                      onPress={() => update({
                        days_of_week: selected
                          ? value.days_of_week.filter((day) => day !== index)
                          : [...(value.days_of_week || []), index].sort(),
                      })}
                      style={[
                        styles.dayChip,
                        {
                          borderColor: selected ? c.primary : c.border,
                          backgroundColor: selected ? c.primary + "16" : c.surfaceAlt,
                        },
                      ]}
                    >
                      <Text style={[styles.dayText, { color: selected ? c.primary : c.text }]}>{label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {recurrence === "monthly" ? (
            <>
              <Text style={[styles.label, { color: c.textSecondary }]}>Day of month</Text>
              <AppInput
                value={String(value.day_of_month || "")}
                onChangeText={(text) => update({ day_of_month: text.replace(/\D/g, "") })}
                keyboardType="number-pad"
                placeholder="1-31"
                maxLength={2}
              />
            </>
          ) : null}

          {recurrence === "annual" ? (
            <View style={styles.splitRow}>
              <View style={styles.flex}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Month</Text>
                <AppInput
                  value={String(value.annual_month || "")}
                  onChangeText={(text) => update({ annual_month: text.replace(/\D/g, "") })}
                  keyboardType="number-pad"
                  placeholder="1-12"
                  maxLength={2}
                />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Day</Text>
                <AppInput
                  value={String(value.annual_day || "")}
                  onChangeText={(text) => update({ annual_day: text.replace(/\D/g, "") })}
                  keyboardType="number-pad"
                  placeholder="1-31"
                  maxLength={2}
                />
              </View>
            </View>
          ) : null}

          <Text style={[styles.label, { color: c.textSecondary }]}>Show before due</Text>
          <ChipRow
            options={VISIBILITY.map((days) => ({
              key: String(days),
              label: days === 0 ? "Due day" : days + "d early",
            }))}
            value={String(value.show_days_before || 0)}
            onChange={(days) => update({ show_days_before: Number(days) })}
          />
        </>
      ) : null}
    </View>
  );
}

function ChipRow({ options, value, onChange }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <AnimatedPressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[
              styles.chip,
              {
                borderColor: selected ? c.primary : c.border,
                backgroundColor: selected ? c.primary + "16" : c.surfaceAlt,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: selected ? c.primary : c.text }]}>{option.label}</Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

export function recurrencePayload(value) {
  return {
    interval: Math.max(1, Number(value.interval) || 1),
    days_of_week: value.days_of_week || [],
    day_of_month: value.day_of_month ? Number(value.day_of_month) : null,
    annual_month: value.annual_month ? Number(value.annual_month) : null,
    annual_day: value.annual_day ? Number(value.annual_day) : null,
    show_days_before: Number(value.show_days_before) || 0,
  };
}

export function recurrenceFromParams(params, fallback = "daily") {
  let days = [];
  try {
    days = JSON.parse(params.days_of_week || "[]");
  } catch {
    days = [];
  }
  return {
    recurrence_type: params.recurrence_type || params.frequency || params.recurrence || fallback,
    interval: params.interval || "1",
    days_of_week: Array.isArray(days) ? days.map(Number) : [],
    day_of_month: params.day_of_month || "",
    annual_month: params.annual_month || "",
    annual_day: params.annual_day || "",
    show_days_before: Number(params.show_days_before) || 0,
  };
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginTop: spacing.lg },
  label: { ...typography.bodyBold, marginTop: spacing.sm },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, fontWeight: "800" },
  weekRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  dayChip: {
    minWidth: 44,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  dayText: { ...typography.caption, fontWeight: "800" },
  splitRow: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
});
