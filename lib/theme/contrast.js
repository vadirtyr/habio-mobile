function normalizeHex(color) {
  if (typeof color !== "string") return null;
  const value = color.trim();
  if (!value.startsWith("#")) return null;
  const hex = value.slice(1);
  if (hex.length === 3) {
    return hex.split("").map((char) => char + char).join("");
  }
  if (hex.length === 6) return hex;
  return null;
}

export function hexToRgb(color) {
  const hex = normalizeHex(color);
  if (!hex) return null;
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function channelLuminance(value) {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color) {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

export function readableTextForColor(color) {
  return relativeLuminance(color) > 0.42 ? "#111827" : "#FFFFFF";
}

export function gradientContrastInfo(colors = []) {
  const luminances = colors
    .map(relativeLuminance)
    .filter((value) => Number.isFinite(value));
  const lightest = luminances.length ? Math.max(...luminances) : 0;
  const darkest = luminances.length ? Math.min(...luminances) : 0;
  const useDarkText = lightest > 0.62;
  const mixed = lightest - darkest > 0.42;
  return {
    lightest,
    darkest,
    mixed,
    textColor: useDarkText ? "#111827" : "#FFFFFF",
    secondaryTextColor: useDarkText ? "rgba(17,24,39,0.76)" : "rgba(255,255,255,0.9)",
    needsScrim: !useDarkText && lightest > 0.38,
  };
}
