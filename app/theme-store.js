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

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { colors, radii, spacing, typography } from "../lib/theme";

const ACHIEVEMENT_LABELS = {
  "streak-7": "Reach a 7-day streak",
  "streak-30": "Reach a 30-day streak",
  "coins-500": "Earn 500 total coins",
  "tasks-50": "Complete 50 tasks",
  "habits-25": "Complete habits 25 total times",
  "quests-10": "Claim 10 quest rewards",
};

const RARITY_COLORS = {
  common: "#94A3B8",
  rare: "#06B6D4",
  epic: "#8B5CF6",
  legendary: "#F59E0B",
};

function getAchievementLabel(id) {
  return ACHIEVEMENT_LABELS[id] || "Complete the required achievement";
}

function getRarityColor(item) {
  return RARITY_COLORS[item.rarity || "common"] || RARITY_COLORS.common;
}

export default function ThemeStoreScreen() {
  const { token } = useAuth();

  const {
    themeName,
    setThemeName,
    themes,
    ownedThemes,
    purchaseTheme,
    syncing,
    unlockedThemesNow,
    clearUnlockedThemesNow,
  } = useTheme();

  const [coinBalance, setCoinBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [equippedMessage, setEquippedMessage] = useState(null);

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
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Personalize OurOrbit</Text>
            <Text style={styles.title}>Theme Store</Text>
          </View>
        </View>

        <AppCard style={styles.heroCard}>
          <View style={styles.heroGlow} />

          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>Available Coins</Text>

              <Text style={styles.heroValue}>
                {loadingBalance ? "..." : coinBalance}
              </Text>

              <Text style={styles.heroSub}>
                Earn coins by completing habits, tasks, and quests.
              </Text>
            </View>

            <View style={styles.coinIcon}>
              <MaterialCommunityIcons
                name="palette-outline"
                size={32}
                color={colors.cyan}
              />
            </View>
          </View>
        </AppCard>

        {equippedMessage ? (
          <AppCard style={styles.equippedToast}>
            <Text style={styles.equippedText}>{equippedMessage}</Text>
          </AppCard>
        ) : null}

        {syncing ? (
          <AppCard style={styles.syncCard}>
            <Text style={styles.syncText}>Syncing theme ownership...</Text>
          </AppCard>
        ) : null}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionHint}>{section.subtitle}</Text>

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
              const rarityColor = getRarityColor(item);

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
        onCancel={() => setPurchaseTarget(null)}
        onConfirm={confirmPurchase}
      />

      <UnlockModal
        visible={!!unlockTarget}
        unlockTarget={unlockTarget}
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
  onPress,
}) {
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
          selected && { borderColor: colors.cyan },
          !selected && { borderColor: locked ? colors.warning : rarityColor },
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
              <Text style={styles.themeName}>{item.name}</Text>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: selected ? colors.cyan : colors.surfaceAlt,
                    borderColor: selected ? colors.cyan : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    selected
                      ? { color: colors.white }
                      : { color: colors.textMuted },
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

            <Text style={styles.description}>{item.description}</Text>

            {level && !owned ? (
              <View style={styles.achievementRow}>
                <MaterialCommunityIcons
                  name="orbit"
                  size={16}
                  color={colors.warning}
                />

                <Text style={styles.achievementText}>
                  Reach Orbit Level {item.unlockLevel}
                </Text>
              </View>
            ) : null}

            {achievement && !owned ? (
              <View style={styles.achievementRow}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={16}
                  color={colors.warning}
                />

                <Text style={styles.achievementText}>
                  {getAchievementLabel(item.unlockAchievement)}
                </Text>
              </View>
            ) : null}

            {notEnoughCoins ? (
              <Text style={styles.shortText}>
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
  onCancel,
  onConfirm,
}) {
  if (!purchaseTarget) return null;

  const item = purchaseTarget.theme;
  const remaining = coinBalance - item.price;
  const rarityColor = getRarityColor(item);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { borderColor: rarityColor }]}>
          <ThemePreview item={item} large />

          <Text style={styles.modalEyebrow}>
            {(item.rarity || "common").toUpperCase()} THEME
          </Text>

          <Text style={styles.modalTitle}>Buy {item.name}?</Text>

          <Text style={styles.modalDescription}>
            This permanently unlocks and equips the theme.
          </Text>

          <View style={styles.costBox}>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Cost</Text>
              <Text style={styles.costValue}>{item.price} coins</Text>
            </View>

            <View style={styles.costItem}>
              <Text style={styles.costLabel}>After</Text>
              <Text style={styles.costValue}>{remaining} coins</Text>
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

function UnlockModal({ visible, unlockTarget, onDismiss, onEquip }) {
  if (!unlockTarget) return null;

  const item = unlockTarget.theme;
  const rarityColor = getRarityColor(item);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { borderColor: rarityColor }]}>
          <View style={[styles.unlockIcon, { borderColor: rarityColor }]}>
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

          <Text style={styles.modalTitle}>{item.name}</Text>

          <Text style={styles.modalDescription}>
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },

  eyebrow: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  title: {
    ...typography.h1,
    color: colors.text,
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
    backgroundColor: `${colors.cyan}18`,
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
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  heroValue: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.text,
    marginTop: spacing.xs,
  },

  heroSub: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  coinIcon: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: `${colors.cyan}12`,
    borderColor: colors.border,
  },

  equippedToast: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: `${colors.success}12`,
  },

  equippedText: {
    ...typography.bodyBold,
    color: colors.success,
    textAlign: "center",
  },

  syncCard: {
    marginTop: spacing.md,
  },

  syncText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  section: {
    marginTop: spacing.xl,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },

  sectionHint: {
    ...typography.caption,
    color: colors.textSecondary,
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
    color: colors.white,
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
    color: colors.text,
    flex: 1,
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
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
    color: colors.warning,
    fontWeight: "900",
  },

  shortText: {
    ...typography.caption,
    color: colors.danger,
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
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },

  modalTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center",
  },

  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  costBox: {
    width: "100%",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
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
    color: colors.textMuted,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  costValue: {
    ...typography.h3,
    color: colors.text,
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
    backgroundColor: colors.surfaceAlt,
  },

  unlockEyebrow: {
    ...typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});