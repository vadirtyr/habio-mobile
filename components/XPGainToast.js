import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { colors, radii, spacing, typography } from "../lib/theme";

export function XPGainToast({ xp }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    if (xp) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withTiming(-8, { duration: 650 });
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      translateY.value = 14;
    }
  }, [xp]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!xp) return null;

  return (
    <Animated.View style={[styles.toast, animatedStyle]}>
      <Text style={styles.text}>+{xp} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 92,
    alignSelf: "center",
    zIndex: 20,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: `${colors.cyan}18`,
    borderWidth: 1,
    borderColor: colors.cyan,
  },

  text: {
    ...typography.bodyBold,
    color: colors.cyan,
  },
});