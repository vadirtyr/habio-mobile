import { StyleSheet, Text, View } from "react-native";

import {
    colors,
    spacing,
    typography,
} from "../lib/theme";

export function EmptyState({
  title,
  description,
  icon,
}) {
  return (
    <View style={styles.container}>
      {icon ? (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      ) : null}

      <Text style={styles.title}>
        {title}
      </Text>

      {description ? (
        <Text style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },

  iconContainer: {
    marginBottom: spacing.lg,
  },

  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
});