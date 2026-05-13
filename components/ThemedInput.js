import { StyleSheet, TextInput } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function ThemedInput({
  style,
  placeholderTextColor,
  multiline = false,
  ...props
}) {
  const { theme } = useTheme();

  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={placeholderTextColor || theme.colors.muted}
      style={[
        styles.input,
        multiline && styles.multiline,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.text,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: "600",
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
});