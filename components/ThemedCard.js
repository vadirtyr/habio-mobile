import { StyleSheet, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { shadows } from "../lib/theme/shadows";

export default function ThemedCard({ children, style }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.text,
        },
        shadows.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
  },
});