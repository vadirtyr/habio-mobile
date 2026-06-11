import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;

  const [profile, setProfile] = useState(null);
  const [me, setMe] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isMe = me?.id && profile?.id === me.id;

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function loadProfile() {
    if (!username) return;

    setLoading(true);

    try {
      const data = await api.get(`/profile/${username}`);
      const myProfile = await api.get("/profile/me");

      setProfile(data);
      setMe(myProfile);

      const followingData = await api.get(`/users/${myProfile.id}/following`);

    setFollowing(
        Array.isArray(followingData?.following) &&
        followingData.following.some((item) => item.id === data.id)
    );
    } catch (error) {
      Alert.alert("Profile error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function followUser() {
    if (!profile?.id || submitting) return;

    setSubmitting(true);

    try {
      await api.post(`/users/${profile.id}/follow`, {});
      setFollowing(true);

      setProfile((current) =>
        current
          ? {
              ...current,
              followers_count: (current.followers_count || 0) + 1,
            }
          : current
      );
    } catch (error) {
      Alert.alert("Follow failed", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function unfollowUser() {
    if (!profile?.id || submitting) return;

    setSubmitting(true);

    try {
      await api.post(`/users/${profile.id}/unfollow`, {});
      setFollowing(false);

      setProfile((current) =>
        current
          ? {
              ...current,
              followers_count: Math.max(
                0,
                (current.followers_count || 0) - 1
              ),
            }
          : current
      );
    } catch (error) {
      Alert.alert("Unfollow failed", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={[styles.statusText, { color: c.textSecondary }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={[styles.statusText, { color: c.textSecondary }]}>
          Profile not found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: c.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Profile"
        subtitle={`@${profile.username || username}`}
      />

      <AppCard style={styles.heroCard}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: c.surfaceAlt,
              borderColor: c.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={profile.avatar || "compass-outline"}
            size={42}
            color={c.primary}
          />
        </View>

        <Text style={[styles.displayName, { color: c.text }]}>
          {profile.display_name || profile.username}
        </Text>

        <Text style={[styles.username, { color: c.textSecondary }]}>
          @{profile.username}
        </Text>

        {profile.bio ? (
          <Text style={[styles.bio, { color: c.textSecondary }]}>
            {profile.bio}
          </Text>
        ) : null}

        {!isMe ? (
          <AppButton
            title={
              submitting
                ? "Working..."
                : following
                  ? "Following"
                  : "Follow"
            }
            variant={following ? "secondary" : "primary"}
            onPress={following ? unfollowUser : followUser}
            disabled={submitting}
            style={styles.followButton}
          />
        ) : (
          <AppButton
            title="Edit Profile"
            variant="secondary"
            onPress={() => router.push("/edit-profile")}
            style={styles.followButton}
          />
        )}
      </AppCard>

      <View style={styles.statGrid}>
        <StatCard
          icon="star"
          label="Level"
          value={profile.level_data?.level || 1}
        />

        <StatCard
          icon="award"
          label="Achievements"
          value={profile.achievement_count || 0}
        />

        <StatCard
          icon="account-group-outline"
          label="Followers"
          value={profile.followers_count || 0}
          onPress={() =>
            router.push({
              pathname: "/followers",
              params: {
                userId: profile.id,
                username: profile.username,
              },
            })
          }
        />

        <StatCard
          icon="account-check-outline"
          label="Following"
          value={profile.following_count || 0}
          onPress={() =>
            router.push({
              pathname: "/following",
              params: {
                userId: profile.id,
                username: profile.username,
              },
            })
          }
        />
      </View>

      {profile.featured_achievement ? (
        <AppCard style={styles.featuredCard}>
          <View style={styles.featuredHeader}>
            <Feather name="award" size={20} color={c.primary} />

            <Text style={[styles.featuredLabel, { color: c.textSecondary }]}>
              Latest Achievement
            </Text>
          </View>

          <Text style={[styles.featuredTitle, { color: c.text }]}>
            {profile.featured_achievement.name}
          </Text>

          <Text style={[styles.featuredText, { color: c.textSecondary }]}>
            {profile.featured_achievement.description}
          </Text>
        </AppCard>
      ) : null}

      <AppButton
        title="View Activity"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/public-activity",
            params: {
              userId: profile.id,
              username: profile.username,
            },
          })
        }
        style={styles.activityButton}
      />
    </ScrollView>
  );
}

function StatCard({ icon, label, value, onPress }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const content = (
    <AppCard style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={22} color={c.primary} />

      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>

      <Text style={[styles.statLabel, { color: c.textSecondary }]}>
        {label}
      </Text>
    </AppCard>
  );

  if (!onPress) {
    return content;
  }

  return (
    <View style={styles.statPress}>
      <Text onPress={onPress}>{content}</Text>
    </View>
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

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },

  statusText: {
    ...typography.body,
  },

  heroCard: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  displayName: {
    ...typography.h2,
    textAlign: "center",
  },

  username: {
    ...typography.body,
    marginTop: spacing.xs,
  },

  bio: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.md,
  },

  followButton: {
    marginTop: spacing.lg,
    width: "100%",
  },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  statPress: {
    width: "47%",
  },

  statCard: {
    width: "47%",
    alignItems: "center",
    gap: spacing.xs,
  },

  statValue: {
    ...typography.h2,
  },

  statLabel: {
    ...typography.caption,
  },

  featuredCard: {
    marginBottom: spacing.lg,
  },

  featuredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  featuredLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  featuredTitle: {
    ...typography.h3,
  },

  featuredText: {
    ...typography.body,
    marginTop: spacing.xs,
    lineHeight: 22,
  },

  activityButton: {
    marginTop: spacing.sm,
  },
});