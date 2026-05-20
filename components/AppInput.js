import { StyleSheet, TextInput, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import {
    radii,
    shadows,
    spacing,
    typography,
} from "../lib/theme";

export function AppInput({
  multiline = false,
  style,
  inputStyle,
  focused = false,
  leftElement,
  rightElement,
  ...props
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.container,

        {
          borderColor: focused
            ? `${c.primary}90`
            : c.border,

          backgroundColor:
            c.surfaceAlt,

          shadowColor:
            focused
              ? theme.glow || c.primary
              : "#000000",
        },

        multiline &&
          styles.multilineContainer,

        focused &&
          styles.focused,

        style,
      ]}
    >
      {leftElement}

      <TextInput
        placeholderTextColor={
          c.textMuted || c.muted
        }
        multiline={multiline}
        selectionColor={
          c.primary
        }
        style={[
          styles.input,

          {
            color: c.text,
          },

          multiline &&
            styles.multilineInput,

          inputStyle,
        ]}
        {...props}
      />

      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,

    borderRadius:
      radii.xl,

    borderWidth: 1,

    paddingHorizontal:
      spacing.lg,

    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,

    ...shadows.soft,
  },

  focused: {
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },

  multilineContainer: {
    minHeight: 130,
    paddingTop: spacing.md,
    alignItems: "flex-start",
  },

  input: {
    flex: 1,

    ...typography.body,

    fontWeight: "600",
  },

  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});