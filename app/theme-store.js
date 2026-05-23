import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import { AnimatedScreen } from "../components/AnimatedScreen";
import { ScreenHeader } from "../components/ScreenHeader";
import { SkeletonCard } from "../components/SkeletonCard";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const ACHIEVEMENT_LABELS = {
  "streak-7": "Reach a 7-day streak",
  "streak-30": "Reach a 30-day streak",
  "coins-500": "Earn 500 total coins",
  "tasks-50": "Complete 50 tasks",
  "habits-25": "Complete habits 25 total times",
  "quests-10": "Claim 10 quest rewards",
};

function getAchievementLabel(id) {
  return ACHIEVEMENT_LABELS[id] || "Complete the required achievement";
}

function getRarityColor(item, c) {
  switch (item.rarity) {
    case "legendary":
      return c.gold || c.primary;

    case "epic":
      return c.coral || c.primary;

    case "rare":
      return c.cyan || c.primary;

    default:
      return c.textMuted || c.muted;
  }
}

export default function ThemeStoreScreen() {
  const { token } = useAuth();

  const {
    themeName,
    theme,
    setThemeName,
    themes,
    ownedThemes,
    purchaseTheme,
    syncing,
    unlockedThemesNow,
    clearUnlockedThemesNow,
  } = useTheme();

  const c = theme.colors;

  const [coinBalance, setCoinBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [equippedMessage, setEquippedMessage] = useState(null);
if (loadingBalance || syncing) {
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: c.background,
        },
      ]}
    >
      <View style={styles.container}>
        <ScreenHeader
          title="Theme Store"
          subtitle="Loading your orbit themes..."
        />

        <AnimatedScreen delay={40}>
          <SkeletonCard lines={2} />
        </AnimatedScreen>

        <AnimatedScreen delay={80}>
          <SkeletonCard />
        </AnimatedScreen>

        <AnimatedScreen delay={120}>
          <SkeletonCard />
        </AnimatedScreen>

        <AnimatedScreen delay={160}>
          <SkeletonCard compact />
        </AnimatedScreen>
      </View>
    </View>
  );
}
  const sections = useMemo(() => {
    const entries = Object.entries(themes);

    return [
      {
        title: "Included Themes",
        subtitle: "Ready to use anytime.",
        data: entries.filter(([, item]) => item.type === "included"),
      },
      {
        title: "Premium Themes",
        subtitle: "Buy with coins you earn.",
        data: entries.filter(([, item]) => item.type === "store"),
      },
      {
        title: "Level Themes",
        subtitle: "Unlock by increasing your Orbit Level.",
        data: entries.filter(([, item]) => item.type === "level"),
      },
      {
        title: "Achievement Themes",
        subtitle: "Unlock through progress.",
        data: entries.filter(([, item]) => item.type === "achievement"),
      },
    ].filter((section) => section.data.length > 0);
  }, [themes]);

  useEffect(() => {
    if (unlockedThemesNow?.length > 0) {
      const firstUnlocked = unlockedThemesNow[0];
      const unlockedTheme = themes[firstUnlocked];

      if (unlockedTheme) {
        setUnlockTarget({
          key: firstUnlocked,
          theme: unlockedTheme,
        });
      }
    }
  }, [unlockedThemesNow, themes]);

  async function loadBalance() {
    if (!token) return;

    try {
      const data = await api.get("/stats", token);
      setCoinBalance(data.coin_balance || 0);
    } catch (error) {
      console.warn("Failed to load coin balance:", error.message || error);
    } finally {
      setLoadingBalance(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadBalance();
    }, [token])
  );

  async function equipTheme(key, item) {
    await setThemeName(key);
    await Haptics.selectionAsync();

    setEquippedMessage(`${item.name} equipped`);
    setTimeout(() => setEquippedMessage(null), 1600);
  }

  async function handleThemePress(key) {
    const selectedTheme = themes[key];
    const owned = ownedThemes.includes(key);
    const selected = themeName === key;

    if (selected) return;

    if (owned || selectedTheme.type === "included") {
      await equipTheme(key, selectedTheme);
      return;
    }

    if (selectedTheme.type === "level") {
      Alert.alert(
        "Theme Locked",
        `Reach Orbit Level ${selectedTheme.unlockLevel} to unlock ${selectedTheme.name}.`
      );
      return;
    }

    if (selectedTheme.type === "achievement") {
      Alert.alert(
        "Theme Locked",
        selectedTheme.description ||
          "Complete the required achievement to unlock this theme."
      );
      return;
    }

    if (coinBalance < selectedTheme.price) {
      Alert.alert(
        "Not enough coins",
        `You need ${selectedTheme.price - coinBalance} more coins to buy ${
          selectedTheme.name
        }.`
      );
      return;
    }

    setPurchaseTarget({ key, theme: selectedTheme });
  }

  async function confirmPurchase() {
    if (!purchaseTarget || purchasing) return;

    const { key, theme: selectedTheme } = purchaseTarget;

    setPurchasing(true);

    try {
      const result = await purchaseTheme(key);

      if (typeof result?.new_balance === "number") {
        setCoinBalance(result.new_balance);
      } else {
        setCoinBalance((current) => Math.max(0, current - selectedTheme.price));
      }

      await equipTheme(key, selectedTheme);
      setPurchaseTarget(null);
    } catch (error) {
      Alert.alert("Could not buy theme", error.message);
    } finally {
      setPurchasing(false);
    }
  }

  async function equipUnlockedTheme() {
    if (!unlockTarget) return;

    await equipTheme(unlockTarget.key, unlockTarget.theme);
    setUnlockTarget(null);
    clearUnlockedThemesNow();
  }

  function dismissUnlockModal() {
    setUnlockTarget(null);
    clearUnlockedThemesNow();
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: c.surfaceAlt,
                borderColor: c.border,
              },
            ]}
          >
            <Feather name="arrow-left" size={20} color={c.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: c.textSecondary }]}>
              Personalize OurOrbit
            </Text>
            <Text style={[styles.title, { color: c.text }]}>Theme Store</Text>
          </View>
        </View>

        <AppCard style={styles.heroCard}>
          <View
            style={[
              styles.heroGlow,
              { backgroundColor: c.surfaceGlow || `${c.cyan || c.primary}18` },
            ]}
          />

          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={[styles.heroLabel, { color: c.textSecondary }]}>
                Available Coins
              </Text>

              <Text style={[styles.heroValue, { color: c.text }]}>
                {loadingBalance ? "..." : coinBalance}
              </Text>

              <Text style={[styles.heroSub, { color: c.textSecondary }]}>
                Earn coins by completing habits, tasks, and quests.
              </Text>
            </View>

            <View
              style={[
                styles.coinIcon,
                {
                  backgroundColor: `${c.cyan || c.primary}12`,
                  borderColor: c.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="palette-outline"
                size={32}
                color={c.cyan || c.primary}
              />
            </View>
          </View>
        </AppCard>

        {equippedMessage ? (
          <AppCard
            style={[
              styles.equippedToast,
              {
                borderColor: c.success,
                backgroundColor: `${c.success}12`,
              },
            ]}
          >
            <Text style={[styles.equippedText, { color: c.success }]}>
              {equippedMessage}
            </Text>
          </AppCard>
        ) : null}

        {syncing ? (
          <AppCard style={styles.syncCard}>
            <Text style={[styles.syncText, { color: c.textSecondary }]}>
              Syncing theme ownership...
            </Text>
          </AppCard>
        ) : null}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionHint, { color: c.textSecondary }]}>
              {section.subtitle}
            </Text>

            {section.data.map(([key, item]) => {
              const selected = themeName === key;
              const owned = ownedThemes.includes(key);
              const included = item.type === "included";
              const achievement = item.type === "achievement";
              const level = item.type === "level";
              const affordable =
                included ||
                owned ||
                achievement ||
                level ||
                coinBalance >= item.price;

              const rarityColor = getRarityColor(item, c);

              return (
                <ThemeCard
                  key={key}
                  item={item}
                  selected={selected}
                  owned={owned}
                  included={included}
                  achievement={achievement}
                  level={level}
                  affordable={affordable}
                  coinBalance={coinBalance}
                  rarityColor={rarityColor}
                  themeColors={c}
                  onPress={() => handleThemePress(key)}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      <PurchaseModal
        visible={!!purchaseTarget}
        purchaseTarget={purchaseTarget}
        coinBalance={coinBalance}
        purchasing={purchasing}
        themeColors={c}
        onCancel={() => setPurchaseTarget(null)}
        onConfirm={confirmPurchase}
      />

      <UnlockModal
        visible={!!unlockTarget}
        unlockTarget={unlockTarget}
        themeColors={c}
        onDismiss={dismissUnlockModal}
        onEquip={equipUnlockedTheme}
      />
    </View>
  );
}

function ThemeCard({
  item,
  selected,
  owned,
  included,
  achievement,
  level,
  affordable,
  coinBalance,
  rarityColor,
  themeColors,
  onPress,
}) {
  const c = themeColors;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      scale.value = withSequence(withSpring(1.025), withSpring(1));
    }
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const locked = (achievement || level) && !owned;
  const notEnoughCoins =
    !owned && !included && !achievement && !level && !affordable;

  return (
    <Animated.View style={animatedStyle}>
      <AppCard
        style={[
          styles.themeCard,
          selected && { borderColor: c.cyan || c.primary },
          !selected && { borderColor: locked ? c.warning : rarityColor },
          notEnoughCoins && styles.unaffordableCard,
        ]}
      >
        <LinearGradient
          colors={item.gradient || [item.colors.background, item.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientStrip}
        >
          <View style={styles.gradientOverlay}>
            <View>
              <Text style={styles.gradientTitle}>{item.name}</Text>
              <Text style={styles.gradientSubtitle}>
                {item.tagline || item.description}
              </Text>
            </View>

            <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {(item.rarity || "common").toUpperCase()}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.themeBody}>
          <ThemePreview item={item} />

          <View style={styles.themeInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.themeName, { color: c.text }]}>
                {item.name}
              </Text>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: selected
                      ? c.cyan || c.primary
                      : c.surfaceAlt,
                    borderColor: selected ? c.cyan || c.primary : c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: selected ? "#FFFFFF" : c.textMuted || c.muted,
                    },
                  ]}
                >
                  {selected
                    ? "Equipped"
                    : owned
                    ? "Owned"
                    : included
                    ? "Included"
                    : level
                    ? `Level ${item.unlockLevel}`
                    : achievement
                    ? "Achievement"
                    : `${item.price} coins`}
                </Text>
              </View>
            </View>

            <Text style={[styles.description, { color: c.textSecondary }]}>
              {item.description}
            </Text>

            {level && !owned ? (
              <View style={styles.achievementRow}>
                <MaterialCommunityIcons
                  name="orbit"
                  size={16}
                  color={c.warning}
                />

                <Text style={[styles.achievementText, { color: c.warning }]}>
                  Reach Orbit Level {item.unlockLevel}
                </Text>
              </View>
            ) : null}

            {achievement && !owned ? (
              <View style={styles.achievementRow}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={16}
                  color={c.warning}
                />

                <Text style={[styles.achievementText, { color: c.warning }]}>
                  {getAchievementLabel(item.unlockAchievement)}
                </Text>
              </View>
            ) : null}

            {notEnoughCoins ? (
              <Text style={[styles.shortText, { color: c.danger }]}>
                {item.price - coinBalance} coins short
              </Text>
            ) : null}
          </View>
        </View>

        <AppButton
          variant={selected ? "secondary" : "primary"}
          title={
            selected
              ? "Current Theme"
              : owned || included
              ? "Use Theme"
              : level || achievement
              ? "Locked"
              : affordable
              ? "Buy Theme"
              : "Not Enough Coins"
          }
          onPress={onPress}
          style={styles.actionButton}
          disabled={locked}
        />
      </AppCard>
    </Animated.View>
  );
}

function ThemePreview({ item, large = false }) {
  return (
    <View
      style={[
        large ? styles.modalPreview : styles.preview,
        {
          backgroundColor: item.colors.background,
          borderColor: item.colors.border,
        },
      ]}
    >
      <View
        style={[
          large ? styles.modalPreviewCard : styles.previewCard,
          { backgroundColor: item.colors.surface },
        ]}
      >
        <View
          style={[
            large ? styles.modalPreviewBar : styles.previewBar,
            { backgroundColor: item.colors.primary },
          ]}
        />

        <View
          style={[
            large ? styles.modalPreviewLine : styles.previewLine,
            { backgroundColor: item.colors.surfaceAlt },
          ]}
        />

        <View
          style={[
            large ? styles.modalPreviewLineSmall : styles.previewLineSmall,
            { backgroundColor: item.colors.border },
          ]}
        />
      </View>

      <View
        style={[
          large ? styles.modalPreviewButton : styles.previewButton,
          { backgroundColor: item.colors.primary },
        ]}
      />
    </View>
  );
}

function PurchaseModal({
  visible,
  purchaseTarget,
  coinBalance,
  purchasing,
  themeColors,
  onCancel,
  onConfirm,
}) {
  if (!purchaseTarget) return null;

  const c = themeColors;
  const item = purchaseTarget.theme;
  const remaining = coinBalance - item.price;
  const rarityColor = getRarityColor(item, c);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              borderColor: rarityColor,
              backgroundColor: c.surface,
            },
          ]}
        >
          <ThemePreview item={item} large />

          <Text style={[styles.modalEyebrow, { color: c.textSecondary }]}>
            {(item.rarity || "common").toUpperCase()} THEME
          </Text>

          <Text style={[styles.modalTitle, { color: c.text }]}>
            Buy {item.name}?
          </Text>

          <Text style={[styles.modalDescription, { color: c.textSecondary }]}>
            This permanently unlocks and equips the theme.
          </Text>

          <View
            style={[
              styles.costBox,
              {
                borderColor: c.border,
                backgroundColor: c.surfaceAlt,
              },
            ]}
          >
            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: c.textMuted || c.muted }]}>
                Cost
              </Text>
              <Text style={[styles.costValue, { color: c.text }]}>
                {item.price} coins
              </Text>
            </View>

            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: c.textMuted || c.muted }]}>
                After
              </Text>
              <Text style={[styles.costValue, { color: c.text }]}>
                {remaining} coins
              </Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            <AppButton
              variant="secondary"
              style={styles.modalButton}
              title="Cancel"
              onPress={onCancel}
              disabled={purchasing}
            />

            <AppButton
              style={styles.modalButton}
              title={purchasing ? "Buying..." : "Buy Theme"}
              onPress={onConfirm}
              disabled={purchasing}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UnlockModal({ visible, unlockTarget, themeColors, onDismiss, onEquip }) {
  if (!unlockTarget) return null;

  const c = themeColors;
  const item = unlockTarget.theme;
  const rarityColor = getRarityColor(item, c);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              borderColor: rarityColor,
              backgroundColor: c.surface,
            },
          ]}
        >
          <View
            style={[
              styles.unlockIcon,
              {
                borderColor: rarityColor,
                backgroundColor: c.surfaceAlt,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.type === "level" ? "orbit" : "trophy-award"}
              size={38}
              color={rarityColor}
            />
          </View>

          <ThemePreview item={item} large />

          <Text style={[styles.unlockEyebrow, { color: rarityColor }]}>
            Theme Unlocked
          </Text>

          <Text style={[styles.modalTitle, { color: c.text }]}>{item.name}</Text>

          <Text style={[styles.modalDescription, { color: c.textSecondary }]}>
            {item.type === "level"
              ? `You reached Orbit Level ${item.unlockLevel}.`
              : "You earned this theme through achievement progress."}
          </Text>

          <View style={styles.modalActions}>
            <AppButton
              variant="secondary"
              style={styles.modalButton}
              title="Later"
              onPress={onDismiss}
            />

            <AppButton
              style={styles.modalButton}
              title="Equip Now"
              onPress={onEquip}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingTop: 48,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  eyebrow: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  title: {
    ...typography.h1,
    marginTop: spacing.xs,
  },

  heroCard: {
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.pill,
    top: -130,
    right: -90,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  heroCopy: {
    flex: 1,
  },

  heroLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  heroValue: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: spacing.xs,
  },

  heroSub: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
  },

  coinIcon: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  equippedToast: {
    marginTop: spacing.md,
    borderWidth: 1,
  },

  equippedText: {
    ...typography.bodyBold,
    textAlign: "center",
  },

  syncCard: {
    marginTop: spacing.md,
  },

  syncText: {
    ...typography.body,
  },

  section: {
    marginTop: spacing.xl,
  },

  sectionTitle: {
    ...typography.h3,
  },

  sectionHint: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  themeCard: {
    marginBottom: spacing.md,
    overflow: "hidden",
  },

  unaffordableCard: {
    opacity: 0.72,
  },

  gradientStrip: {
    minHeight: 96,
    borderRadius: radii.xl,
    padding: spacing.lg,
    justifyContent: "flex-end",
    marginBottom: spacing.lg,
  },

  gradientOverlay: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  gradientTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  gradientSubtitle: {
    color: "rgba(255,255,255,0.9)",
    marginTop: spacing.xs,
    fontWeight: "800",
  },

  rarityBadge: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  rarityText: {
    fontSize: 11,
    fontWeight: "900",
  },

  themeBody: {
    flexDirection: "row",
    gap: spacing.md,
  },

  preview: {
    width: 82,
    height: 94,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 9,
    justifyContent: "space-between",
  },

  previewCard: {
    borderRadius: radii.lg,
    padding: 7,
    gap: 5,
  },

  previewBar: {
    height: 10,
    width: "55%",
    borderRadius: radii.pill,
  },

  previewLine: {
    height: 8,
    width: "90%",
    borderRadius: radii.pill,
  },

  previewLineSmall: {
    height: 8,
    width: "65%",
    borderRadius: radii.pill,
  },

  previewButton: {
    height: 14,
    borderRadius: radii.pill,
  },

  themeInfo: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  themeName: {
    ...typography.h3,
    flex: 1,
  },

  description: {
    ...typography.body,
    marginTop: spacing.sm,
  },

  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  achievementText: {
    flex: 1,
    ...typography.caption,
    fontWeight: "900",
  },

  shortText: {
    ...typography.caption,
    fontWeight: "900",
    marginTop: spacing.sm,
  },

  badge: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  actionButton: {
    marginTop: spacing.lg,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },

  modalCard: {
    width: "100%",
    borderRadius: radii.xxl || radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
  },

  modalPreview: {
    width: 128,
    height: 146,
    borderRadius: 32,
    borderWidth: 1,
    padding: 14,
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },

  modalPreviewCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },

  modalPreviewBar: {
    height: 14,
    width: "55%",
    borderRadius: radii.pill,
  },

  modalPreviewLine: {
    height: 12,
    width: "90%",
    borderRadius: radii.pill,
  },

  modalPreviewLineSmall: {
    height: 12,
    width: "65%",
    borderRadius: radii.pill,
  },

  modalPreviewButton: {
    height: 22,
    borderRadius: radii.pill,
  },

  modalEyebrow: {
    ...typography.caption,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },

  modalTitle: {
    ...typography.h1,
    textAlign: "center",
  },

  modalDescription: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  costBox: {
    width: "100%",
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  costItem: {
    flex: 1,
  },

  costLabel: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  costValue: {
    ...typography.h3,
    marginTop: spacing.xs,
  },

  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
    marginTop: spacing.lg,
  },

  modalButton: {
    flex: 1,
  },

  unlockIcon: {
    width: 74,
    height: 74,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  unlockEyebrow: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});