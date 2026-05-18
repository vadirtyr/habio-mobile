import { StyleSheet, View } from "react-native";

import { colors, radii } from "../lib/theme";

export function OrbitProgressBar({ percent = 0, style }) {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fillWrap, { width: `${safePercent}%` }]}>
        <View style={styles.fill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },

  fillWrap: {
    height: "100%",
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.cyan,
  },

  fill: {
    flex: 1,
    backgroundColor: colors.cyan,
  },
});