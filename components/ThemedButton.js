import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { shadows } from "../lib/theme/shadows";

export default function ThemedButton({
  children,
  onPress,
  style,
  textStyle,
  disabled = false,
  variant = "primary",
}) {
  const { theme } = useTheme();

  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,

        {
          backgroundColor: isPrimary
            ? theme.colors.primary
            : theme.colors.surfaceAlt,

          borderColor: isPrimary
            ? theme.colors.primary
            : theme.colors.border,

          shadowColor: isPrimary
            ? theme.colors.primary
            : theme.colors.text,
        },

        isPrimary ? shadows.medium : shadows.soft,

        pressed && styles.pressed,
        disabled && styles.disabled,

        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text
          style={[
            styles.text,
            {
              color: isPrimary
                ? theme.colors.primaryText
                : theme.colors.text,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,

    alignItems: "center",
    justifyContent: "center",

    flexDirection: "row",
    gap: 10,
  },

  text: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },

  disabled: {
    opacity: 0.6,
  },
});