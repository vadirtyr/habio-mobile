import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";

import { colors, radii, spacing, typography } from "../lib/theme";

export function LevelUpModal({ visible, oldLevel, newLevel, onClose }) {
  const scale = useSharedValue(0.75);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(withSpring(1.12), withSpring(1));
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.glow} />

          <View style={styles.iconCircle}>
            <Feather name="zap" size={36} color={colors.white} />
          </View>

          <Text style={styles.eyebrow}>Orbit Level Up</Text>

          <Text style={styles.title}>
            Level {oldLevel} → {newLevel}
          </Text>

          <Text style={styles.description}>
            Your momentum is growing. Keep your orbit moving.
          </Text>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Nice</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },

  card: {
    width: "100%",
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cyan,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: "center",
  },

  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    top: -130,
    right: -90,
    backgroundColor: `${colors.cyan}18`,
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    backgroundColor: colors.cyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  eyebrow: {
    ...typography.caption,
    color: colors.cyan,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "900",
  },

  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.cyan,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 34,
  },

  buttonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});