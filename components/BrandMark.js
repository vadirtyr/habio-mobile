import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export function BrandHeader({ eyebrow, title, subtitle }) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View
          style={[
            styles.logoWrap,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.text,
            },
          ]}
        >
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textWrap}>
          {!!eyebrow && (
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
              {eyebrow}
            </Text>
          )}

          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>

          {!!subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export function BrandMark({ size = 56 }) {
  return (
    <Image
      source={require("../assets/images/icon.png")}
      style={{
        width: size,
        height: size,
      }}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",

    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },

  logo: {
    width: 78,
    height: 78,
  },

  textWrap: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 42,
    letterSpacing: -1.2,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
  },
});