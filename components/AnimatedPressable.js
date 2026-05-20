import { Pressable } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  children,
  style,
  onPress,
  disabled = false,
  scaleTo = 0.975,
  fadeTo = 0.9,
  springConfig = {
    damping: 16,
    stiffness: 260,
    mass: 0.7,
  },
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  function pressIn() {
    if (disabled) return;

    scale.value = withSpring(scaleTo, springConfig);
    opacity.value = withTiming(fadeTo, { duration: 90 });
  }

  function pressOut() {
    if (disabled) return;

    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, { duration: 120 });
  }

  return (
    <AnimatedPressableBase
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[animatedStyle, disabled && { opacity: 0.5 }, style]}
    >
      {children}
    </AnimatedPressableBase>
  );
}