import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";

import { useTheme } from "../hooks/useTheme";
import {
    radii,
    spacing,
    typography,
} from "../lib/theme";

export function MomentumBadge({
  score = 72,
  label,
  compact = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const scale = useSharedValue(1);

  scale.value = withSequence(
    withSpring(1.04, {
      damping: 12,
      stiffness: 220,
    }),
    withSpring(1)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const state = getMomentumState(score, c);

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.compactContainer,
        {
          borderColor: state.color,
          backgroundColor: `${state.color}12`,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          compact && styles.compactIconWrap,
          {
            backgroundColor: `${state.color}18`,
          },
        ]}
      >
        <Feather
          name={state.icon}
          size={compact ? 16 : 18}
          color={state.color}
        />
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.eyebrow,
            {
              color: state.color,
            },
          ]}
        >
          Momentum
        </Text>

        <View style={styles.row}>
          <Text
            style={[
              styles.score,
              {
                color: c.text,
              },
            ]}
          >
            {score}
          </Text>

          <Text
            style={[
              styles.label,
              {
                color: state.color,
              },
            ]}
          >
            {label || state.label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function getMomentumState(score, c) {
  if (score >= 90) {
    return {
      label: "Unstoppable",
      color: c.gold,
      icon: "zap",
    };
  }

  if (score >= 75) {
    return {
      label: "Locked In",
      color: c.success,
      icon: "trending-up",
    };
  }

  if (score >= 55) {
    return {
      label: "Stable",
      color: c.cyan || c.primary,
      icon: "activity",
    };
  }

  if (score >= 35) {
    return {
      label: "Building",
      color: c.coral || c.warning,
      icon: "target",
    };
  }

  return {
    label: "Starting",
    color: c.textMuted || c.muted,
    icon: "moon",
  };
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  compactContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  compactIconWrap: {
    width: 42,
    height: 42,
  },

  copy: {
    flex: 1,
  },

  eyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "900",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginTop: 2,
  },

  score: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
  },

  label: {
    ...typography.bodyBold,
    marginBottom: 4,
  },
});