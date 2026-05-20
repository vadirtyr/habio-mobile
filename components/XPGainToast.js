import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { useTheme } from "../hooks/useTheme";
import { radii, spacing, typography } from "../lib/theme";

export function XPGainToast({ xp }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const accent = c.cyan || c.primary;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    if (xp) {
      opacity.value = withTiming(1, { duration: 140 });
      translateY.value = withTiming(-10, { duration: 650 });

      scale.value = withSequence(
        withSpring(1.08, { damping: 12, stiffness: 240 }),
        withSpring(1, { damping: 14, stiffness: 220 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      translateY.value = 14;
      scale.value = 0.92;
    }
  }, [xp]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!xp) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: c.surface,
          borderColor: `${accent}70`,
          shadowColor: accent,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: `${accent}14`,
          },
        ]}
      >
        <MaterialCommunityIcons name="orbit" size={17} color={accent} />
      </View>

      <Text style={[styles.text, { color: accent }]}>+{xp} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 92,
    alignSelf: "center",
    zIndex: 20,

    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,

    paddingVertical: 10,
    paddingHorizontal: spacing.lg,

    borderRadius: radii.pill,

    borderWidth: 1,

    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },

  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    ...typography.bodyBold,
    fontWeight: "900",
  },
});