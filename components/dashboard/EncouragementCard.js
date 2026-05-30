import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { radii, spacing, typography } from "../../lib/theme";
import { AppCard } from "../AppCard";

export function EncouragementCard({ momentum = 0 }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const message =
    momentum >= 90
      ? "You're operating at peak momentum."
      : momentum >= 75
      ? "Consistency is becoming a habit."
      : momentum >= 50
      ? "Progress is compounding."
      : momentum >= 25
      ? "Small wins create big change."
      : "Start with one action today.";

  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: `${c.cyan || c.primary}14`,
              borderColor: c.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={24}
            color={c.cyan || c.primary}
          />
        </View>

        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: c.cyan || c.primary }]}>
            Momentum Message
          </Text>

          <Text style={[styles.message, { color: c.text }]}>
            {message}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  copy: {
    flex: 1,
  },

  eyebrow: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },

  message: {
    ...typography.h3,
    lineHeight: 24,
  },
});