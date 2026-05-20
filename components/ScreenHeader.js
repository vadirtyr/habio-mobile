import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../hooks/useTheme";

import {
    spacing,
    typography,
} from "../lib/theme";

export function ScreenHeader({
  title,
  subtitle,
  right,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
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

        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? (
        <View>
          {right}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },

  left: {
    flex: 1,
  },

  title: {
    ...typography.h1,
  },

  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
});