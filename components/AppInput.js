import { StyleSheet, TextInput, View } from "react-native";

import { colors, radii, spacing, typography } from "../lib/theme";

export function AppInput({
  multiline = false,
  style,
  inputStyle,
  ...props
}) {
  return (
    <View
      style={[
        styles.container,
        multiline && styles.multilineContainer,
        style,
      ]}
    >
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          inputStyle,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },

  multilineContainer: {
    minHeight: 120,
    paddingTop: spacing.md,
  },

  input: {
    ...typography.body,
    color: colors.text,
  },

  multilineInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
});