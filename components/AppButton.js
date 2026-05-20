import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import {
    radii,
    shadows,
    spacing,
    typography,
} from "../lib/theme";

export function AppButton({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled = false,
  icon = null,
  fullWidth = true,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const variantStyles = getVariantStyles(
    variant,
    c,
    theme
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,

        {
          backgroundColor:
            variantStyles.backgroundColor,

          borderColor:
            variantStyles.borderColor,

          shadowColor:
            variantStyles.shadowColor,
        },

        variantStyles.glow && shadows.glow,

        fullWidth && styles.fullWidth,

        pressed &&
          !disabled &&
          styles.pressed,

        disabled &&
          styles.disabled,

        style,
      ]}
    >
      <View style={styles.content}>
        {icon}

        <Text
          style={[
            styles.text,
            {
              color:
                variantStyles.textColor,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}


function getVariantStyles(variant, c, theme) {
  switch (variant) {
    case "secondary":
      return {
        backgroundColor: c.surface,
        borderColor: c.border,
        textColor: c.text,
        shadowColor: "transparent",
      };

    case "coral":
      return {
        backgroundColor: c.coral,
        borderColor: c.coral,
        textColor: c.white || "#FFFFFF",
        shadowColor: c.coral,
      };

    case "cyan":
      return {
        backgroundColor: c.cyan,
        borderColor: c.cyan,
        textColor: c.primaryText || "#FFFFFF",
        shadowColor: c.cyan,
      };

    case "ghost":
      return {
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: c.primary,
        shadowColor: "transparent",
      };

    default:
      return {
        backgroundColor: c.primary,
        borderColor: c.primary,
        textColor: c.primaryText || "#FFFFFF",
        shadowColor: theme.glow || c.primary,
        glow: true,
      };
  }
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,

    borderRadius:
      radii.pill,

    alignItems: "center",
    justifyContent:
      "center",

    paddingHorizontal:
      spacing.xl,

    borderWidth: 1,

    ...shadows.soft,
  },

  fullWidth: {
    width: "100%",
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    gap: spacing.sm,
  },

  pressed: {
    opacity: 0.92,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  disabled: {
    opacity: 0.45,
  },

  text: {
    ...typography.button,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});