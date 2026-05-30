import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AnimatedScreen } from "../components/AnimatedScreen";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { BrandHeader } from "../components/BrandMark";
import { ErrorState } from "../components/ErrorState";
import { SkeletonCard } from "../components/SkeletonCard";

import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function loadProfile() {
    setError(null);

    try {
      const data = await api.get("/profile/me");
      setProfile(data);
    } catch (error) {
      setError(error?.message || "Unable to load profile.");
    } finally {
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProfile();
  }

  if (!profile && !error) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View style={styles.container}>
          <BrandHeader
            eyebrow="OurOrbit"
            title="Profile"
            subtitle="Loading your orbit identity..."
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
            title="Profile"
            subtitle="Your public orbit identity."
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

  const level = profile?.level_data?.level || 1;
  const featuredAchievement = profile?.featured_achievement || null;

  const joinedYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : "-";

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <AnimatedScreen style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
            />
          }
        >
          <BrandHeader
            eyebrow="OurOrbit"
            title="Profile"
            subtitle="Your public orbit identity."
            compact
          />

          <AppCard style={styles.heroCard}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: `${c.cyan || c.primary}18`,
                  borderColor: c.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getAvatarIcon(profile)}
                size={58}
                color={c.cyan || c.primary}
                />
            </View>

            <Text style={[styles.displayName, { color: c.text }]}>
              {profile?.display_name || "Explorer"}
            </Text>

            <Text style={[styles.username, { color: c.textSecondary }]}>
              {profile?.username ? `@${profile.username}` : "No username set"}
            </Text>

            <Text style={[styles.bio, { color: c.textSecondary }]}>
              {profile?.bio || "Add a short bio to personalize your orbit."}
            </Text>

            <View style={styles.badgeRow}>
            <ProfileBadge icon="orbit" label={`Level ${level}`} />

            <ProfileBadge
                icon="fire"
                label={`${profile?.streak_days || 0} Day Streak`}
            />

            <ProfileBadge
                icon={getAvatarIcon(profile)}
                label={
                profile?.avatar_store?.find(
                (item) => item.id === profile?.avatar
                )?.name || "Explorer"
                }
            />

            <ProfileBadge
                icon={profile?.is_public ? "earth" : "lock-outline"}
                label={profile?.is_public ? "Public" : "Private"}
            />
            </View>

            <AppButton
              title="Edit Profile"
              onPress={() => router.push("/edit-profile")}
              style={styles.editButton}
            />
          </AppCard>

          <View style={styles.statsGrid}>
            <ProfileStat
              icon="star-four-points"
              label="XP"
              value={profile?.level_data?.progress || 0}
            />

            <ProfileStat
              icon="cash"
              label="Coins"
              value={profile?.coin_balance || 0}
            />

            <ProfileStat
              icon="palette-outline"
              label="Theme"
              value={profile?.selected_theme || "light"}
            />
          </View>

          <View style={styles.statsGrid}>
            <ProfileStat
              icon="fire"
              label="Streak"
              value={profile?.streak_days || 0}
            />

            <ProfileStat
              icon="trophy-outline"
              label="Wins"
              value={profile?.achievement_count || 0}
            />

            <ProfileStat
              icon="calendar-check"
              label="Joined"
              value={joinedYear}
            />
          </View>
          <View style={styles.statsGrid}>
            <ProfileStat
                icon="account-group-outline"
                label="Followers"
                value={profile?.followers_count || 0}
            />

            <ProfileStat
                icon="account-arrow-right-outline"
                label="Following"
                value={profile?.following_count || 0}
            />

            <ProfileStat
                icon="earth"
                label="Visibility"
                value={profile?.is_public ? "Public" : "Private"}
            />
            </View>
          <AppCard style={styles.showcaseCard}>
            <Text style={[styles.showcaseTitle, { color: c.text }]}>
              Orbit Showcase
            </Text>

            <View style={styles.badgeRow}>
              <ProfileBadge
                icon="fire"
                label={`${profile?.streak_days || 0} Day Streak`}
              />

              <ProfileBadge
                icon="palette-outline"
                label={profile?.selected_theme || "Light"}
              />

              <ProfileBadge
                icon="star-four-points"
                label={`Level ${level}`}
              />
            </View>
          </AppCard>

          <AppCard style={styles.showcaseCard}>
            <Text style={[styles.showcaseTitle, { color: c.text }]}>
              Featured Achievement
            </Text>

            <View
              style={[
                styles.featuredAchievement,
                {
                  backgroundColor: c.surfaceAlt,
                  borderColor: c.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={featuredAchievement?.icon || "trophy-outline"}
                size={36}
                color={c.gold || c.primary}
              />

              <View style={styles.featuredCopy}>
                <Text style={[styles.featuredTitle, { color: c.text }]}>
                  {featuredAchievement?.name || "No achievement featured yet"}
                </Text>

                <Text
                  style={[
                    styles.featuredText,
                    {
                      color: c.textSecondary,
                    },
                  ]}
                >
                  {featuredAchievement?.description ||
                    "Complete habits, tasks, and quests to earn your first featured win."}
                </Text>

                {featuredAchievement?.earned_at ? (
                  <Text
                    style={[
                      styles.earnedText,
                      {
                        color: c.textMuted || c.textSecondary,
                      },
                    ]}
                  >
                    Earned{" "}
                    {new Date(
                      featuredAchievement.earned_at
                    ).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            </View>
          </AppCard>
        </ScrollView>
      </AnimatedScreen>
    </View>
  );
}

function ProfileBadge({ icon, label }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.profileBadge,
        {
          backgroundColor: c.surfaceAlt,
          borderColor: c.border,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={17} color={c.primary} />

      <Text style={[styles.profileBadgeText, { color: c.text }]}>
        {label}
      </Text>
    </View>
  );
}

function ProfileStat({ icon, label, value }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <AppCard style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={28} color={c.primary} />

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.statValue, { color: c.text }]}
      >
        {value}
      </Text>

      <Text style={[styles.statLabel, { color: c.textSecondary }]}>
        {label}
      </Text>
    </AppCard>
  );
}
    function getAvatarIcon(profile) {
        const avatarId = profile?.avatar || "explorer";
        const avatarStore = profile?.avatar_store || [];

        const avatar = avatarStore.find((item) => item.id === avatarId);

    return avatar?.icon || "account-circle-outline";
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  heroCard: {
    alignItems: "center",
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  displayName: {
    ...typography.h1,
    textAlign: "center",
  },

  username: {
    ...typography.bodyBold,
    marginTop: spacing.xs,
  },

  bio: {
    ...typography.body,
    marginTop: spacing.md,
    textAlign: "center",
    lineHeight: 22,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
  },

  profileBadge: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  profileBadgeText: {
    ...typography.caption,
    fontWeight: "900",
  },

  editButton: {
    marginTop: spacing.xl,
    width: "100%",
  },

  statsGrid: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
  },

  statCard: {
    flex: 1,
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    ...typography.h3,
    marginTop: spacing.md,
    textAlign: "center",
  },

  statLabel: {
    ...typography.caption,
    fontWeight: "900",
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },

  showcaseCard: {
    marginTop: spacing.lg,
  },

  showcaseTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },

  featuredAchievement: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },

  featuredCopy: {
    flex: 1,
  },

  featuredTitle: {
    ...typography.bodyBold,
  },

  featuredText: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  earnedText: {
    ...typography.caption,
    marginTop: spacing.sm,
    fontWeight: "800",
  },
});