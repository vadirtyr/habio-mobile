import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import {
    radii,
    shadows,
    spacing,
    typography,
} from "../lib/theme";

export function StatPill({
  icon,
  label,
  value,
  accent = "cyan",
  style,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const accentColor =
    c[accent] ||
    c.primary;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor:
            c.border,

          backgroundColor:
            c.surface,

          shadowColor:
            accentColor,
        },
        style,
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor:
                `${accentColor}18`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={accentColor}
          />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text
          style={[
            styles.value,
            {
              color: c.text,
            },
          ]}
        >
          {value}
        </Text>

        <Text
          style={[
            styles.label,
            {
              color:
                c.textSecondary ||
                c.muted,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: "47%",

    flexDirection: "row",
    alignItems: "center",

    gap: spacing.md,

    padding: spacing.lg,

    borderRadius:
      radii.lg,

    borderWidth: 1,

    ...shadows.soft,
  },

  iconWrap: {
    width: 42,
    height: 42,

    borderRadius:
      radii.pill,

    alignItems: "center",
    justifyContent:
      "center",
  },

  copy: {
    flex: 1,
  },

  value: {
    ...typography.h2,
  },

  label: {
    ...typography.caption,

    marginTop: spacing.xs,
  },
});