import { StyleSheet, Text, View } from "react-native";
import { colors, shadows } from "../lib/theme";

export function BrandMark({ size = 44 }) {
  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
        },
      ]}
    >
      <Text style={[styles.h, { fontSize: size * 0.55 }]}>H</Text>
      <View
        style={[
          styles.leaf,
          {
            width: size * 0.18,
            height: size * 0.32,
            right: size * 0.22,
            top: size * 0.2,
          },
        ]}
      />
    </View>
  );
}

export function BrandHeader({ eyebrow, title }) {
  return (
    <View style={styles.headerRow}>
      <BrandMark size={42} />
      <View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    backgroundColor: colors.primaryBright,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow,
  },
  h: {
    color: colors.text,
    fontWeight: "900",
    letterSpacing: -1,
  },
  leaf: {
    position: "absolute",
    backgroundColor: colors.accent,
    borderTopLeftRadius: 999,
    borderBottomRightRadius: 999,
    transform: [{ rotate: "35deg" }],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    marginTop: 2,
  },
});