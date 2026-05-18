import { StyleSheet, View } from "react-native";

import {
    colors,
    radii,
    shadows,
    spacing,
} from "../lib/theme";

export function AppCard({
  children,
  style,
  padded = true,
}) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.soft,
  },

  padded: {
    padding: spacing.lg,
  },
});