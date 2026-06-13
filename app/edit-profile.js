import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import { AnimatedScreen } from "../components/AnimatedScreen";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { BrandHeader } from "../components/BrandMark";
import { ErrorState } from "../components/ErrorState";
import { SkeletonCard } from "../components/SkeletonCard";
import { UserAvatar } from "../components/UserAvatar";

import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { refresh } = useAuth();
  const c = theme.colors;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [avatar, setAvatar] = useState("explorer");
  const [ownedAvatars, setOwnedAvatars] = useState(["explorer"]);
  const [avatarStore, setAvatarStore] = useState([]);
  const [avatarType, setAvatarType] = useState("preset");
  const [customAvatarKey, setCustomAvatarKey] = useState(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);

  async function loadProfile() {
    setError(null);

    try {
      const data = await api.get("/profile/me");

      setUsername(data?.username || "");
      setDisplayName(data?.display_name || "");
      setBio(data?.bio || "");
      setIsPublic(data?.is_public ?? true);

      setAvatar(data?.avatar || "explorer");
      setOwnedAvatars(data?.owned_avatars || ["explorer"]);
      setAvatarStore(data?.avatar_store || []);
      setAvatarType(data?.avatar_type || "preset");
      setCustomAvatarKey(data?.custom_avatar_key || null);
      setCustomAvatarUrl(data?.custom_avatar_url || null);
    } catch (error) {
      setError(error?.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function handleSave() {
    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    const cleanBio = bio.trim();

    if (cleanUsername && cleanUsername.length < 3) {
      Alert.alert(
        "Username too short",
        "Usernames must be at least 3 characters."
      );
      return;
    }

    if (cleanUsername && !/^[a-z0-9_]+$/.test(cleanUsername)) {
      Alert.alert(
        "Invalid username",
        "Usernames can only contain letters, numbers, and underscores."
      );
      return;
    }

    if (!cleanDisplayName) {
      Alert.alert("Display name required", "Please enter a display name.");
      return;
    }

    if (avatarType === "preset" && !ownedAvatars.includes(avatar)) {
      Alert.alert(
        "Avatar Locked",
        "Choose an unlocked avatar before saving."
      );
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      await api.put("/profile/me", {
        username: cleanUsername || null,
        display_name: cleanDisplayName,
        bio: cleanBio,
        is_public: isPublic,
      });

      if (avatarType === "custom" && avatarImage) {
        const upload = await api.createUploadUrl({
          upload_type: "avatar",
          filename: avatarImage.fileName,
          content_type: avatarImage.mimeType,
        });
        const imageResponse = await fetch(avatarImage.uri);
        const imageBlob = await imageResponse.blob();
        const putResponse = await fetch(upload.upload_url, {
          method: "PUT",
          headers: upload.headers,
          body: imageBlob,
        });
        if (!putResponse.ok) throw new Error("Avatar upload failed. Please try again.");
        await api.updateAvatar({ avatar_type: "custom", custom_avatar_key: upload.key });
      } else if (avatarType === "preset") {
        await api.updateAvatar({ avatar_type: "preset", avatar });
      } else if (!customAvatarKey) {
        throw new Error("Choose a custom avatar image before saving.");
      }
      await refresh();

      Alert.alert("Profile Updated", "Your profile has been saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Save Failed",
        error?.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo access to choose a custom avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };
    const extension = extensions[mimeType] || "jpg";
    const fileName = asset.fileName?.toLowerCase().endsWith(`.${extension}`) ? asset.fileName : `avatar.${extension}`;
    setAvatarImage({ uri: asset.uri, mimeType, fileName });
    setAvatarType("custom");
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View style={styles.container}>
          <BrandHeader
            eyebrow="OurOrbit"
            title="Edit Profile"
            subtitle="Loading your profile..."
            compact
          />

          <SkeletonCard lines={3} />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View style={styles.container}>
          <BrandHeader
            eyebrow="OurOrbit"
            title="Edit Profile"
            subtitle="Customize your orbit identity."
            compact
          />

          <ErrorState
            title="Profile unavailable"
            description={error}
            onRetry={loadProfile}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AnimatedScreen style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BrandHeader
            eyebrow="OurOrbit"
            title="Edit Profile"
            subtitle="Customize your orbit identity."
            compact
          />

          <AppCard style={styles.card}>
            <UserAvatar
              user={{ avatar_type: avatarType, custom_avatar_url: avatarImage?.uri || customAvatarUrl }}
              size={96}
              icon={getAvatarIcon(avatar, avatarStore)}
              color={c.cyan || c.primary}
              backgroundColor={`${c.cyan || c.primary}18`}
              borderColor={c.border}
              style={styles.avatar}
            />

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.text }]}>
                Display Name
              </Text>

              <AppInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Matt"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.text }]}>Username</Text>

              <AppInput
                value={username}
                onChangeText={setUsername}
                placeholder="matt"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={[styles.helper, { color: c.textSecondary }]}>
                Letters, numbers, and underscores only.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.text }]}>Bio</Text>

              <AppInput
                value={bio}
                onChangeText={setBio}
                placeholder="Building better days."
                multiline
                maxLength={160}
              />

              <Text style={[styles.helper, { color: c.textSecondary }]}>
                {bio.length}/160 characters
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.text }]}>Avatar</Text>

              <Text style={[styles.helper, { color: c.textSecondary }]}>
                Unlock avatars through achievements, then choose one for your
                profile.
              </Text>

              <AppButton title="Upload custom avatar" variant="secondary" onPress={pickAvatar} style={styles.uploadAvatarButton} disabled={saving} />

              <View style={styles.avatarGrid}>
                {(avatarStore.length > 0
                  ? avatarStore
                  : fallbackAvatarStore
                ).map((item) => {
                  const unlocked = ownedAvatars.includes(item.id);
                  const selected = avatarType === "preset" && avatar === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      disabled={!unlocked}
                      onPress={() => { setAvatar(item.id); setAvatarType("preset"); setAvatarImage(null); }}
                      style={({ pressed }) => [
                        styles.avatarOption,
                        {
                          borderColor: selected
                            ? c.cyan || c.primary
                            : c.border,
                          backgroundColor: selected
                            ? `${c.cyan || c.primary}14`
                            : c.surfaceAlt,
                          opacity: unlocked ? 1 : 0.45,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.avatarIconWrap,
                          {
                            backgroundColor: `${c.cyan || c.primary}12`,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.icon || "account-circle-outline"}
                          size={28}
                          color={unlocked ? c.cyan || c.primary : c.textMuted}
                        />
                      </View>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.avatarName,
                          {
                            color: c.text,
                          },
                        ]}
                      >
                        {item.name}
                      </Text>

                      <View style={styles.avatarStatusRow}>
                        <MaterialCommunityIcons
                          name={
                            unlocked
                              ? selected
                                ? "check-circle"
                                : "lock-open-outline"
                              : "lock-outline"
                          }
                          size={15}
                          color={
                            unlocked
                              ? c.success || c.primary
                              : c.textMuted || c.textSecondary
                          }
                        />

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.avatarStatus,
                            {
                              color: unlocked
                                ? c.success || c.primary
                                : c.textSecondary,
                            },
                          ]}
                        >
                          {unlocked
                            ? selected
                              ? "Selected"
                              : "Unlocked"
                            : unlockText(item)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              style={[
                styles.visibilityRow,
                {
                  borderColor: c.border,
                  backgroundColor: c.surfaceAlt,
                },
              ]}
            >
              <View style={styles.visibilityCopy}>
                <Text style={[styles.visibilityTitle, { color: c.text }]}>
                  Public Profile
                </Text>

                <Text
                  style={[
                    styles.visibilityText,
                    {
                      color: c.textSecondary,
                    },
                  ]}
                >
                  Let others view your profile once social features are enabled.
                </Text>
              </View>

              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: c.border,
                  true: c.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <AppButton
              title={saving ? "Saving..." : "Save Profile"}
              onPress={handleSave}
              disabled={saving}
              style={styles.saveButton}
            />

            <AppButton
              title="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              disabled={saving}
              style={styles.cancelButton}
            />
          </AppCard>
        </ScrollView>
      </AnimatedScreen>
    </KeyboardAvoidingView>
  );
}

function getAvatarIcon(avatarId, avatarStore) {
  const avatar = avatarStore.find((item) => item.id === avatarId);

  return avatar?.icon || "account-circle-outline";
}

function unlockText(item) {
  return item?.unlockText || "Locked";
}

const fallbackAvatarStore = [
  {
    id: "explorer",
    name: "Explorer",
    icon: "compass-outline",
    type: "included",
  },
];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  card: {
    alignItems: "stretch",
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  uploadAvatarButton: { marginTop: spacing.md },

  field: {
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },

  helper: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  avatarGrid: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  avatarOption: {
    width: "47%",
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 148,
    alignItems: "center",
  },

  avatarIconWrap: {
    width: 54,
    height: 54,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },

  avatarName: {
    ...typography.bodyBold,
    textAlign: "center",
  },

  avatarStatusRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  avatarStatus: {
    ...typography.caption,
    fontWeight: "900",
    maxWidth: 96,
  },

  pressed: {
    opacity: 0.72,
  },

  visibilityRow: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  visibilityCopy: {
    flex: 1,
  },

  visibilityTitle: {
    ...typography.bodyBold,
  },

  visibilityText: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  saveButton: {
    marginTop: spacing.xl,
  },

  cancelButton: {
    marginTop: spacing.md,
  },
});
