import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, spacing, typography } from "../lib/theme";

export function AppButton({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
  },

  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  coral: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },

  cyan: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },

  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.45,
  },

  text: {
    ...typography.button,
  },

  primaryText: {
    color: colors.white,
  },

  secondaryText: {
    color: colors.text,
  },

  coralText: {
    color: colors.white,
  },

  cyanText: {
    color: colors.primary,
  },

  ghostText: {
    color: colors.primary,
  },
});