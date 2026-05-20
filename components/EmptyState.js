import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import {
    radii,
    spacing,
    typography,
} from "../lib/theme";

export function EmptyState({
  title,
  description,
  icon,
  compact = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.container,
        compact &&
          styles.compactContainer,
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                c.surfaceAlt,

              borderColor:
                c.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconGlow,
              {
                backgroundColor:
                  c.surfaceGlow ||
                  `${c.primary}12`,
              },
            ]}
          />

          {icon}
        </View>
      ) : null}

      <Text
        style={[
          styles.title,
          {
            color: c.text,
          },
        ]}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={[
            styles.description,
            {
              color:
                c.textSecondary ||
                c.muted,
            },
          ]}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",

    paddingVertical:
      spacing.xxxl,

    paddingHorizontal:
      spacing.xl,
  },

  compactContainer: {
    paddingVertical:
      spacing.xl,
  },

  iconContainer: {
    width: 88,
    height: 88,

    borderRadius:
      radii.pill,

    alignItems: "center",
    justifyContent:
      "center",

    marginBottom:
      spacing.xl,

    borderWidth: 1,

    overflow: "hidden",
  },

  iconGlow: {
    position: "absolute",

    width: 120,
    height: 120,

    borderRadius:
      radii.pill,
  },

  title: {
    ...typography.h2,

    textAlign: "center",

    letterSpacing: -0.4,
  },

  description: {
    ...typography.body,

    textAlign: "center",

    maxWidth: 300,

    marginTop:
      spacing.sm,

    lineHeight: 22,
  },
});