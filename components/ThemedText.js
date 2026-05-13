import { Text } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function ThemedText({
  children,
  variant = "body",
  muted = false,
  style,
}) {
  const { theme } = useTheme();

  const baseStyle = {
    color: muted ? theme.colors.muted : theme.colors.text,
  };

  const variantStyle =
    variant === "title"
      ? { fontSize: 30, fontWeight: "900" }
      : variant === "section"
      ? { fontSize: 18, fontWeight: "900" }
      : variant === "caption"
      ? { fontSize: 13, fontWeight: "600" }
      : { fontSize: 15, fontWeight: "600" };

  return <Text style={[baseStyle, variantStyle, style]}>{children}</Text>;
}