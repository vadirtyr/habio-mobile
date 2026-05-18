import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AnimatedPressable } from "../../components/AnimatedPressable";
import { AppCard } from "../../components/AppCard";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonCard } from "../../components/SkeletonCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

import {
  colors,
  radii,
  spacing,
  typography,
} from "../../lib/theme";

export default function QuestsScreen() {
  const { token } = useAuth();

  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function fetchQuests() {
    if (!token) return;

    try {
      const data = await api.get("/quests", token);
      setQuests(data.items || []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function claimQuest(quest) {
    if (!token) return;

    try {
      const data = await api.post(
        `/quests/${quest.id}/claim`,
        {},
        token
      );

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      setMessage(`+${data.coins_earned} coins claimed`);

      fetchQuests();

      setTimeout(() => {
        setMessage(null);
      }, 2200);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  useEffect(() => {
    fetchQuests();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchQuests();
    }, [token])
  );

  const claimableCount = useMemo(
    () =>
      quests.filter(
        (q) => q.claimable && !q.claimed
      ).length,
    [quests]
  );

  if (loading) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Quests"
        subtitle="Loading quests..."
      />

      <SkeletonCard lines={2} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard compact />
    </View>
  );
}

  return (
    <View style={styles.container}>
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchQuests}
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title="Quests"
              subtitle="Complete challenges and earn bonus rewards."
            />

            <AppCard
              style={styles.summaryCard}
            >
              <View
                style={
                  styles.summaryGlowPrimary
                }
              />

              <View
                style={
                  styles.summaryGlowSecondary
                }
              />

              <View
                style={styles.summaryTop}
              >
                <View>
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Ready to Claim
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {claimableCount}
                  </Text>
                </View>

                <View
                  style={
                    styles.summaryIcon
                  }
                >
                  <MaterialCommunityIcons
                    name="flag-checkered"
                    size={34}
                    color={colors.cyan}
                  />
                </View>
              </View>

              <Text
                style={styles.summarySub}
              >
                Complete quests to
                accelerate your orbit.
              </Text>
            </AppCard>

            <RewardToast
              message={message}
            />

            {quests.length > 0 ? (
              <SectionTitle
                title="Active Quests"
                action={
                  <Text
                    style={
                      styles.sectionHint
                    }
                  >
                    Daily & Weekly
                  </Text>
                }
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <AppCard
            style={styles.emptyCard}
          >
            <EmptyState
              title="No quests available"
              description="Complete habits and tasks to unlock challenges."
              icon={
                <Feather
                  name="flag"
                  size={42}
                  color={colors.cyan}
                />
              }
            />
          </AppCard>
        }
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <QuestCard
              item={item}
              onClaim={() =>
                claimQuest(item)
              }
            />
          </AnimatedCard>
        )}
      />
    </View>
  );
}

function QuestCard({ item, onClaim }) {
  const completed =
    item.completed ||
    item.claimed;

  const claimable =
    item.claimable &&
    !item.claimed;

  return (
    <AppCard
      style={[
        styles.card,
        claimable && {
          borderColor:
            colors.success,
        },
      ]}
    >
      <View
        style={styles.cardGlow}
      />

      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor:
                completed
                  ? `${colors.success}16`
                  : colors.surfaceAlt,

              borderColor:
                completed
                  ? colors.success
                  : colors.border,
            },
          ]}
        >
          <Feather
            name={
              item.claimed
                ? "check-circle"
                : claimable
                ? "target"
                : "flag"
            }
            size={22}
            color={
              completed
                ? colors.success
                : colors.textMuted
            }
          />
        </View>

        <View style={styles.cardText}>
          <Text style={styles.name}>
            {item.name}
          </Text>

          <Text
            style={styles.description}
          >
            {item.description}
          </Text>
        </View>
      </View>

      <View
        style={styles.progressOuter}
      >
        <View
          style={[
            styles.progressInner,
            {
              width: `${
                item.percent || 0
              }%`,

              backgroundColor:
                completed
                  ? colors.success
                  : colors.cyan,
            },
          ]}
        />
      </View>

      <View style={styles.metaRow}>
        <MetaPill
          icon={
            <Feather
              name="trending-up"
              size={14}
              color={
                colors.textMuted
              }
            />
          }
          text={`${
            item.progress || 0
          } / ${item.target}`}
        />

        <MetaPill
          icon={
            <Feather
              name="gift"
              size={14}
              color={
                colors.textMuted
              }
            />
          }
          text={`${item.reward} coins`}
        />

        <MetaPill
          icon={
            <Feather
              name="calendar"
              size={14}
              color={
                colors.textMuted
              }
            />
          }
          text={
            item.period === "daily"
              ? "Daily"
              : "Weekly"
          }
        />
      </View>

      <AnimatedPressable
        style={[
          styles.claimButton,
          {
            backgroundColor:
              claimable
                ? colors.success
                : colors.surfaceAlt,

            borderColor:
              claimable
                ? colors.success
                : colors.border,

            opacity:
              !claimable ||
              item.claimed
                ? 0.75
                : 1,
          },
        ]}
        disabled={
          !claimable || item.claimed
        }
        onPress={onClaim}
      >
        <Feather
          name={
            item.claimed
              ? "check-circle"
              : claimable
              ? "gift"
              : "clock"
          }
          size={17}
          color={
            claimable
              ? colors.white
              : colors.textMuted
          }
        />

        <Text
          style={[
            styles.claimButtonText,
            {
              color: claimable
                ? colors.white
                : colors.textMuted,
            },
          ]}
        >
          {item.claimed
            ? "Claimed"
            : claimable
            ? "Claim Reward"
            : "In Progress"}
        </Text>
      </AnimatedPressable>
    </AppCard>
  );
}

function MetaPill({ icon, text }) {
  return (
    <View style={styles.metaPill}>
      {icon}

      <Text style={styles.metaText}>
        {text}
      </Text>
    </View>
  );
}

function AnimatedCard({
  children,
  index = 0,
}) {
  const opacity = useSharedValue(0);
  const translateY =
    useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(
      index * 55,
      withTiming(1, {
        duration: 260,
      })
    );

    translateY.value = withDelay(
      index * 55,
      withTiming(0, {
        duration: 260,
      })
    );
  }, []);

  const animatedStyle =
    useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        {
          translateY:
            translateY.value,
        },
      ],
    }));

  return (
    <Animated.View
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  );
}

function RewardToast({ message }) {
  const scale =
    useSharedValue(0.9);

  const opacity =
    useSharedValue(0);

  useEffect(() => {
    if (message) {
      opacity.value = withTiming(1, {
        duration: 180,
      });

      scale.value = withSequence(
        withSpring(1.08),
        withSpring(1)
      );
    } else {
      opacity.value = withTiming(0, {
        duration: 150,
      });

      scale.value = withTiming(0.9, {
        duration: 150,
      });
    }
  }, [message]);

  const animatedStyle =
    useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        {
          scale: scale.value,
        },
      ],
    }));

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        animatedStyle,
      ]}
    >
      <Text style={styles.toastText}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      colors.background,
    paddingHorizontal:
      spacing.xl,
    paddingTop: spacing.xl,
  },

  listContent: {
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      colors.background,
  },

  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  summaryCard: {
    overflow: "hidden",
  },

  summaryGlowPrimary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius:
      radii.pill,
    top: -130,
    right: -90,
    backgroundColor:
      `${colors.cyan}16`,
  },

  summaryGlowSecondary: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius:
      radii.pill,
    bottom: -100,
    left: -70,
    backgroundColor:
      `${colors.success}10`,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    ...typography.caption,
    color:
      colors.textSecondary,
    textTransform:
      "uppercase",
    letterSpacing: 0.8,
  },

  summaryValue: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.text,
    marginTop: spacing.xs,
  },

  summarySub: {
    ...typography.bodyBold,
    color:
      colors.textSecondary,
    marginTop: spacing.md,
  },

  summaryIcon: {
    width: 72,
    height: 72,
    borderRadius:
      radii.pill,
    alignItems: "center",
    justifyContent:
      "center",
    backgroundColor:
      `${colors.cyan}16`,
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },

  toast: {
    marginTop: spacing.md,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius:
      radii.lg,
    alignItems: "center",
    backgroundColor:
      `${colors.success}12`,
    borderColor:
      colors.success,
  },

  toastText: {
    ...typography.bodyBold,
    color: colors.success,
  },

  emptyCard: {
    marginTop: spacing.xl,
    alignItems: "center",
  },

  card: {
    marginBottom: spacing.md,
    overflow: "hidden",
  },

  cardGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius:
      radii.pill,
    top: -100,
    right: -70,
    backgroundColor:
      `${colors.cyan}08`,
  },

  cardTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius:
      radii.pill,
    justifyContent:
      "center",
    alignItems: "center",
    borderWidth: 1,
  },

  cardText: {
    flex: 1,
  },

  name: {
    ...typography.h3,
    color: colors.text,
  },

  description: {
    ...typography.body,
    color:
      colors.textSecondary,
    marginTop: spacing.xs,
  },

  progressOuter: {
    marginTop: spacing.lg,
    height: 10,
    borderRadius:
      radii.pill,
    overflow: "hidden",
    backgroundColor:
      colors.surfaceAlt,
  },

  progressInner: {
    height: "100%",
    borderRadius:
      radii.pill,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  metaPill: {
    borderRadius:
      radii.pill,
    paddingVertical: 7,
    paddingHorizontal:
      spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    backgroundColor:
      colors.surfaceAlt,
    borderColor:
      colors.border,
  },

  metaText: {
    fontWeight: "900",
    fontSize: 12,
    color:
      colors.textSecondary,
  },

  claimButton: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius:
      radii.lg,
    alignItems: "center",
    justifyContent:
      "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
  },

  claimButtonText: {
    ...typography.bodyBold,
  },
});