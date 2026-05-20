import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import {
    spacing,
    typography,
} from "../lib/theme";

export function SectionTitle({
  title,
  subtitle,
  action,
  compact = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.container,
        compact &&
          styles.compactContainer,
      ]}
    >
      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            {
              color: c.text,
            },
          ]}
        >
          {title}
        </Text>

        {!!subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color:
                  c.textSecondary ||
                  c.muted,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {action ? (
        <View style={styles.action}>
          {action}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,

    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent:
      "space-between",

    gap: spacing.md,
  },

  compactContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  copy: {
    flex: 1,
  },

  title: {
    ...typography.h2,

    letterSpacing: -0.4,
  },

  subtitle: {
    ...typography.body,

    marginTop: spacing.xs,

    lineHeight: 21,
  },

  action: {
    justifyContent:
      "flex-end",
  },
});