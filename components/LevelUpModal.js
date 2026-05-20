import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { useTheme } from "../hooks/useTheme";

import {
    radii,
    spacing,
    typography,
} from "../lib/theme";

export function LevelUpModal({
  visible,
  oldLevel,
  newLevel,
  onClose,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const accent =
    c.cyan || c.primary;

  const scale =
    useSharedValue(0.75);

  const opacity =
    useSharedValue(0);

  const translateY =
    useSharedValue(24);

  const ringRotation =
    useSharedValue(0);

  const glowScale =
    useSharedValue(0.8);

  const badgeScale =
    useSharedValue(0.7);

  useEffect(() => {
    if (visible) {
      opacity.value =
        withTiming(1, {
          duration: 180,
        });

      translateY.value =
        withSpring(0, {
          damping: 15,
          stiffness: 180,
        });

      scale.value =
        withSequence(
          withSpring(1.08, {
            damping: 11,
            stiffness: 210,
          }),

          withSpring(1, {
            damping: 15,
            stiffness: 180,
          })
        );

      badgeScale.value =
        withDelay(
          120,
          withSequence(
            withSpring(1.18, {
              damping: 10,
              stiffness: 220,
            }),

            withSpring(1, {
              damping: 15,
              stiffness: 180,
            })
          )
        );

      glowScale.value =
        withRepeat(
          withSequence(
            withTiming(1.08, {
              duration: 900,
            }),

            withTiming(0.96, {
              duration: 900,
            })
          ),
          -1,
          true
        );

      ringRotation.value =
        withRepeat(
          withTiming(360, {
            duration: 7000,
            easing:
              Easing.linear,
          }),
          -1,
          false
        );
    } else {
      opacity.value =
        withTiming(0, {
          duration: 120,
        });

      translateY.value =
        withTiming(24, {
          duration: 120,
        });

      scale.value =
        withTiming(0.75, {
          duration: 120,
        });

      badgeScale.value =
        withTiming(0.7, {
          duration: 120,
        });

      glowScale.value =
        withTiming(0.8, {
          duration: 120,
        });

      ringRotation.value = 0;
    }
  }, [visible]);

  const cardAnimatedStyle =
    useAnimatedStyle(() => ({
      opacity:
        opacity.value,

      transform: [
        {
          translateY:
            translateY.value,
        },

        {
          scale:
            scale.value,
        },
      ],
    }));

  const ringAnimatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          rotate: `${ringRotation.value}deg`,
        },
      ],
    }));

  const glowAnimatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          scale:
            glowScale.value,
        },
      ],
    }));

  const badgeAnimatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          scale:
            badgeScale.value,
        },
      ],
    }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor:
              theme.isDark
                ? "rgba(0,0,0,0.82)"
                : "rgba(15,23,42,0.72)",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.card,
            cardAnimatedStyle,
            {
              borderColor:
                `${accent}60`,

              backgroundColor:
                c.surface,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.glow,
              glowAnimatedStyle,
              {
                backgroundColor:
                  `${accent}18`,
              },
            ]}
          />

          <View
            style={[
              styles.glowTwo,
              {
                backgroundColor:
                  `${c.coral || accent}10`,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.orbitRing,
              ringAnimatedStyle,
              {
                borderColor:
                  `${accent}38`,
              },
            ]}
          >
            <View
              style={[
                styles.orbitDot,
                {
                  backgroundColor:
                    accent,
                },
              ]}
            />
          </Animated.View>

          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  accent,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="orbit"
              size={38}
              color={c.white}
            />
          </View>

          <Text
            style={[
              styles.eyebrow,
              {
                color:
                  accent,
              },
            ]}
          >
            Orbit Level Up
          </Text>

          <Animated.View
            style={[
              styles.levelBadge,
              badgeAnimatedStyle,
              {
                backgroundColor:
                  `${accent}14`,

                borderColor:
                  `${accent}50`,
              },
            ]}
          >
            <Text
              style={[
                styles.levelLabel,
                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Level
            </Text>

            <Text
              style={[
                styles.levelNumber,
                {
                  color:
                    c.text,
                },
              ]}
            >
              {newLevel}
            </Text>
          </Animated.View>

          <Text
            style={[
              styles.title,
              {
                color:
                  c.text,
              },
            ]}
          >
            {oldLevel
              ? `Level ${oldLevel} → ${newLevel}`
              : `Level ${newLevel}`}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            Your momentum is growing.
            Keep showing up and your
            orbit keeps expanding.
          </Text>

          <View
            style={
              styles.rewardRow
            }
          >
            <View
              style={[
                styles.rewardPill,
                {
                  borderColor:
                    c.border,

                  backgroundColor:
                    c.surfaceAlt,
                },
              ]}
            >
              <Feather
                name="zap"
                size={15}
                color={accent}
              />

              <Text
                style={[
                  styles.rewardText,
                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                XP Progress
              </Text>
            </View>

            <View
              style={[
                styles.rewardPill,
                {
                  borderColor:
                    c.border,

                  backgroundColor:
                    c.surfaceAlt,
                },
              ]}
            >
              <Feather
                name="gift"
                size={15}
                color={
                  c.gold ||
                  accent
                }
              />

              <Text
                style={[
                  styles.rewardText,
                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Unlock Potential
              </Text>
            </View>
          </View>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.button,
              {
                backgroundColor:
                  accent,
              },

              pressed &&
                styles.buttonPressed,
            ]}
            onPress={onClose}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color:
                    c.white,
                },
              ]}
            >
              Keep Going
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },

  card: {
    width: "100%",
    overflow: "hidden",
    borderRadius:
      radii.xl,

    borderWidth: 1,

    padding: spacing.xl,

    alignItems: "center",
  },

  glow: {
    position: "absolute",

    width: 260,
    height: 260,

    borderRadius:
      radii.pill,

    top: -150,
    right: -100,
  },

  glowTwo: {
    position: "absolute",

    width: 190,
    height: 190,

    borderRadius:
      radii.pill,

    bottom: -120,
    left: -80,
  },

  orbitRing: {
    position: "absolute",

    top: 38,

    width: 116,
    height: 116,

    borderRadius: 999,

    borderWidth: 1,
  },

  orbitDot: {
    position: "absolute",

    top: 8,
    right: 18,

    width: 8,
    height: 8,

    borderRadius: 999,
  },

  iconCircle: {
    width: 78,
    height: 78,

    borderRadius:
      radii.pill,

    alignItems: "center",
    justifyContent: "center",

    marginBottom:
      spacing.lg,
  },

  eyebrow: {
    ...typography.caption,

    textTransform:
      "uppercase",

    letterSpacing: 1,

    fontWeight: "900",
  },

  levelBadge: {
    marginTop:
      spacing.lg,

    width: 112,
    height: 112,

    borderRadius:
      radii.pill,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
  },

  levelLabel: {
    ...typography.caption,

    textTransform:
      "uppercase",

    letterSpacing: 1,

    fontWeight: "900",
  },

  levelNumber: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: -2,
  },

  title: {
    ...typography.h1,

    textAlign: "center",

    marginTop:
      spacing.lg,
  },

  description: {
    ...typography.body,

    textAlign: "center",

    marginTop:
      spacing.sm,

    lineHeight: 22,
  },

  rewardRow: {
    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent:
      "center",

    gap: spacing.sm,

    marginTop:
      spacing.xl,
  },

  rewardPill: {
    flexDirection: "row",
    alignItems: "center",

    gap: spacing.xs,

    borderWidth: 1,

    borderRadius:
      radii.pill,

    paddingVertical: 8,
    paddingHorizontal:
      spacing.md,
  },

  rewardText: {
    ...typography.caption,
    fontWeight: "900",
  },

  button: {
    marginTop:
      spacing.xl,

    borderRadius:
      radii.pill,

    paddingVertical: 15,
    paddingHorizontal: 36,

    minWidth: 170,

    alignItems: "center",
  },

  buttonPressed: {
    opacity: 0.9,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  buttonText: {
    ...typography.bodyBold,
    fontWeight: "900",
  },
});