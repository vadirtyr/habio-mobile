import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

const LOGO = require("../assets/images/icon.png");

export function BrandHeader({
  eyebrow,
  title = "OurOrbit",
  subtitle,
  centered = false,
  compact = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.wrapper, centered && styles.centeredWrapper]}>
      <View style={[styles.row, centered && styles.centeredRow, compact && styles.compactRow]}>
        <View
          style={[
            styles.logoWrap,
            compact && styles.compactLogoWrap,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              shadowColor: theme.glow || c.primary,
            },
          ]}
        >
          <Image source={LOGO} style={[styles.logo, compact && styles.compactLogo]} resizeMode="contain" />
        </View>

        <View style={[styles.textWrap, centered && styles.centeredText]}>
          {!!eyebrow && <Text style={[styles.eyebrow, { color: c.primary }]}>{eyebrow}</Text>}

          {!!title && (
            <Text style={[styles.title, compact && styles.compactTitle, centered && styles.centeredTitle, { color: c.text }]}>
              {title}
            </Text>
          )}

          {!!subtitle && (
            <Text style={[styles.subtitle, centered && styles.centeredSubtitle, { color: c.textSecondary || c.muted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export function BrandMark({ size = 56, framed = false }) {
  const { theme } = useTheme();
  const c = theme.colors;

  if (framed) {
    return (
      <View
        style={[
          styles.markFrame,
          {
            width: size,
            height: size,
            borderRadius: size * 0.28,
            backgroundColor: c.surface,
            borderColor: c.border,
            shadowColor: theme.glow || c.primary,
          },
        ]}
      >
        <Image source={LOGO} style={{ width: size * 0.78, height: size * 0.78 }} resizeMode="contain" />
      </View>
    );
  }

  return <Image source={LOGO} style={{ width: size, height: size }} resizeMode="contain" />;
}

export function BrandBadge({ label = "OurOrbit" }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          shadowColor: theme.glow || c.primary,
        },
      ]}
    >
      <BrandMark size={26} />
      <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },

  centeredWrapper: {
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  centeredRow: {
    flexDirection: "column",
    gap: 14,
  },

  compactRow: {
    gap: 12,
  },

  logoWrap: {
    width: 82,
    height: 82,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },

  compactLogoWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },

  logo: {
    width: 66,
    height: 66,
  },

  compactLogo: {
    width: 46,
    height: 46,
  },

  markFrame: {
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },

  textWrap: {
    flex: 1,
  },

  centeredText: {
    flex: 0,
    alignItems: "center",
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
    letterSpacing: -1,
  },

  compactTitle: {
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.5,
  },

  centeredTitle: {
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },

  centeredSubtitle: {
    textAlign: "center",
    maxWidth: 320,
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },

  badgeText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
});