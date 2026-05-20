import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { radii, spacing, typography } from "../lib/theme";
import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn’t load this right now. Please try again.",
  actionLabel = "Try Again",
  onRetry,
  icon = "alert-circle",
  compact = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <AppCard style={[styles.card, compact && styles.compactCard]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: `${c.danger}12`,
            borderColor: `${c.danger}30`,
          },
        ]}
      >
        <Feather name={icon} size={30} color={c.danger} />
      </View>

      <Text style={[styles.title, { color: c.text }]}>{title}</Text>

      <Text style={[styles.description, { color: c.textSecondary }]}>
        {description}
      </Text>

      {onRetry ? (
        <AppButton
          title={actionLabel}
          onPress={onRetry}
          style={styles.button}
        />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    marginTop: spacing.lg,
  },

  compactCard: {
    marginTop: spacing.md,
  },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: spacing.lg,
  },

  title: {
    ...typography.h3,
    textAlign: "center",
  },

  description: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },

  button: {
    marginTop: spacing.lg,
  },
});