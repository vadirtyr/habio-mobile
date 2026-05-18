import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../lib/theme";

export function SectionTitle({ title, action }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    ...typography.h3,
    color: colors.text,
  },
});