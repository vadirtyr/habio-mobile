import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, View } from "react-native";
import { AppButton } from "./AppButton";

import { useTheme } from "../hooks/useTheme";
import { radii, spacing, typography } from "../lib/theme";

export function AvatarUnlockModal({
  visible,
  avatar,
  onClose,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  if (!avatar) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: c.surface,
              borderColor: c.success,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: c.success,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={avatar.icon || "account-circle-outline"}
              size={42}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={[
              styles.eyebrow,
              {
                color: c.success,
              },
            ]}
          >
            AVATAR UNLOCKED
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: c.text,
              },
            ]}
          >
            {avatar.name}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: c.textSecondary,
              },
            ]}
          >
            This avatar is now available in your profile.
          </Text>

          <AppButton
            title="Awesome!"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },

  card: {
    width: "100%",
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    alignItems: "center",
  },

  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  eyebrow: {
    ...typography.caption,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  title: {
    ...typography.h1,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  description: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});