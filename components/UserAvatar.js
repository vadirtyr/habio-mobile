import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View } from "react-native";

export function UserAvatar({ user, size = 48, icon = "account-circle", color, backgroundColor, borderColor, style }) {
  const [failed, setFailed] = useState(false);
  const customUrl = user?.avatar_type === "custom" ? user?.custom_avatar_url : null;
  useEffect(() => setFailed(false), [customUrl]);
  const shell = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor,
    borderColor,
    borderWidth: borderColor ? 1 : 0,
  };

  return <View style={[shell, style]}>
    {customUrl && !failed
      ? <Image source={{ uri: customUrl }} style={{ width: size, height: size }} contentFit="cover" onError={() => setFailed(true)} />
      : <MaterialCommunityIcons name={icon} size={Math.round(size * 0.62)} color={color} />}
  </View>;
}
