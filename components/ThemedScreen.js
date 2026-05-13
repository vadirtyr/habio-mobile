import { ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function ThemedScreen({
  children,
  style,
  contentContainerStyle,
  refreshControl,
}) {
  const { theme } = useTheme();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 120,
  },
});