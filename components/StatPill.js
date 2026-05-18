import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, shadows, spacing, typography } from "../lib/theme";

export function StatPill({ icon, label, value, accent = "cyan", style }) {
  const accentColor = colors[accent] || colors.cyan;

  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
          <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  copy: {
    flex: 1,
  },

  value: {
    ...typography.h2,
    color: colors.text,
  },

  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});