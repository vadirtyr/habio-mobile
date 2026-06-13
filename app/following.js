import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { UserAvatar } from "../components/UserAvatar";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function FollowingScreen() {
  const { userId, username } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;

  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  async function loadFollowing() {
    if (!userId) return;

    setLoading(true);

    try {
      const data = await api.get(`/users/${userId}/following`);

      setFollowing(
        Array.isArray(data?.following)
          ? data.following
          : []
      );
    } catch (error) {
      Alert.alert(
        "Following error",
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  function openProfile(user) {
    if (!user?.username) return;

    router.push({
      pathname: "/public-profile",
      params: {
        username: user.username,
        userId: user.id,
      },
    });
  }

  return (
    <ScrollView
      style={[
        styles.screen,
        { backgroundColor: c.background },
      ]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Following"
        subtitle={
          username
            ? `@${username}`
            : "People this orbit follows"
        }
      />

      {loading ? (
        <Text
          style={[
            styles.statusText,
            { color: c.textSecondary },
          ]}
        >
          Loading following...
        </Text>
      ) : following.length === 0 ? (
        <AppCard style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="account-check-outline"
            size={42}
            color={c.textMuted}
          />

          <Text
            style={[
              styles.emptyTitle,
              { color: c.text },
            ]}
          >
            Not following anyone yet
          </Text>

          <Text
            style={[
              styles.emptyText,
              { color: c.textSecondary },
            ]}
          >
            Follow other users to build your orbit.
          </Text>
        </AppCard>
      ) : (
        <View style={styles.results}>
          {following.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => openProfile(user)}
            >
              <AppCard style={styles.userCard}>
                <UserAvatar user={user} size={48} icon="compass-outline" color={c.primary} backgroundColor={c.surfaceAlt} borderColor={c.border} style={styles.avatar} />

                <View style={styles.userCopy}>
                  <Text
                    style={[
                      styles.displayName,
                      { color: c.text },
                    ]}
                  >
                    {user.display_name ||
                      user.name ||
                      user.username}
                  </Text>

                  <Text
                    style={[
                      styles.username,
                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    @{user.username}
                  </Text>
                </View>

                <Feather
                  name="chevron-right"
                  size={22}
                  color={c.textMuted}
                />
              </AppCard>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 90,
  },

  results: {
    gap: spacing.md,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  userCopy: {
    flex: 1,
  },

  displayName: {
    ...typography.bodyBold,
  },

  username: {
    ...typography.caption,
    marginTop: 2,
  },

  emptyCard: {
    alignItems: "center",
    gap: spacing.sm,
  },

  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
  },

  emptyText: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 22,
  },

  statusText: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
