export const colors = {
  background: "#0F172A",
  backgroundSoft: "#111C33",
  surface: "#17223A",
  surfaceElevated: "#1E2B45",

  primary: "#1E3A8A",
  primaryBright: "#2563EB",
  accent: "#22C55E",
  accentSoft: "#DCFCE7",

  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textDark: "#0F172A",

  border: "rgba(148, 163, 184, 0.18)",
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#22C55E",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const typography = {
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: colors.text,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.text,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
};