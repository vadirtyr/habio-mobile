import { StyleSheet, View } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { radii } from "../lib/theme";

export function OrbitProgressBar({
  percent = 0,
  style,
  color,
  glow = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const safePercent = Math.max(
    0,
    Math.min(100, percent)
  );

  const fillColor =
    color ||
    c.cyan ||
    c.primary;

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor:
            c.surfaceAlt,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fillWrap,
          {
            width: `${safePercent}%`,
            backgroundColor:
              fillColor,

            shadowColor:
              glow
                ? fillColor
                : "transparent",

            shadowOpacity:
              glow ? 0.22 : 0,

            shadowRadius:
              glow ? 12 : 0,

            elevation:
              glow ? 6 : 0,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor:
                fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,

    borderRadius:
      radii.pill,

    overflow: "hidden",
  },

  fillWrap: {
    height: "100%",

    borderRadius:
      radii.pill,

    overflow: "hidden",
  },

  fill: {
    flex: 1,
  },
});