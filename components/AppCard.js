import { StyleSheet, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { radii, shadows, spacing } from "../lib/theme";

export function AppCard({
  children,
  style,
  padded = true,
  elevated = false,
  glow = false,
}) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        padded && styles.padded,
        elevated && styles.elevated,
        glow && {
          shadowColor: theme.glow || themeColors.primary,
          shadowOpacity: 0.14,
          shadowRadius: 18,
          elevation: 10,
        },
        style,
      ]}
    >
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.soft,
  },

  inner: {
    position: "relative",
  },

  padded: {
    padding: spacing.lg,
  },

  elevated: {
    transform: [{ translateY: -1 }],
    ...shadows.card,
  },
});