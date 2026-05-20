import { useEffect } from "react";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

export function AnimatedScreen({
  children,
  style,
  delay = 0,
  duration = 320,
  distance = 10,
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(delay, withTiming(0, { duration }));
  }, [delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}