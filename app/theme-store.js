import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring
} from "react-native-reanimated";

import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";
import ThemedScreen from "../components/ThemedScreen";
import ThemedText from "../components/ThemedText";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";

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
    theme,
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
    <ThemedScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <ThemedText muted style={styles.eyebrow}>
              Personalize Habio
            </ThemedText>

            <ThemedText variant="title">Theme Store</ThemedText>
          </View>
        </View>

        <ThemedCard style={styles.heroCard}>
          <View
            style={[
              styles.heroGlow,
              { backgroundColor: `${theme.colors.primary}18` },
            ]}
          />

          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <ThemedText muted style={styles.heroLabel}>
                Available Coins
              </ThemedText>

              <ThemedText style={styles.heroValue}>
                {loadingBalance ? "..." : coinBalance}
              </ThemedText>

              <ThemedText muted style={styles.heroSub}>
                Earn coins by completing habits, tasks, and quests.
              </ThemedText>
            </View>

            <View
              style={[
                styles.coinIcon,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="palette-outline"
                size={32}
                color={theme.colors.primary}
              />
            </View>
          </View>
        </ThemedCard>

        {equippedMessage && (
          <ThemedCard style={styles.equippedToast}>
            <ThemedText style={[styles.equippedText, { color: theme.colors.success }]}>
              {equippedMessage}
            </ThemedText>
          </ThemedCard>
        )}

        {syncing && (
          <ThemedCard style={styles.syncCard}>
            <ThemedText muted>Syncing theme ownership...</ThemedText>
          </ThemedCard>
        )}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText variant="section">{section.title}</ThemedText>

            <ThemedText muted style={styles.sectionHint}>
              {section.subtitle}
            </ThemedText>

            {section.data.map(([key, item]) => {
              const selected = themeName === key;
              const owned = ownedThemes.includes(key);
              const included = item.type === "included";
              const achievement = item.type === "achievement";
              const affordable =
                included || owned || achievement || coinBalance >= item.price;
              const rarityColor = getRarityColor(item);

              return (
                <ThemeCard
                  key={key}
                  itemKey={key}
                  item={item}
                  theme={theme}
                  selected={selected}
                  owned={owned}
                  included={included}
                  achievement={achievement}
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
        theme={theme}
        onCancel={() => setPurchaseTarget(null)}
        onConfirm={confirmPurchase}
      />

      <UnlockModal
        visible={!!unlockTarget}
        unlockTarget={unlockTarget}
        theme={theme}
        onDismiss={dismissUnlockModal}
        onEquip={equipUnlockedTheme}
      />
    </ThemedScreen>
  );
}

function ThemeCard({
  item,
  theme,
  selected,
  owned,
  included,
  achievement,
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

  const locked = achievement && !owned;
  const notEnoughCoins = !owned && !included && !achievement && !affordable;

  return (
    <Animated.View style={animatedStyle}>
      <ThemedCard
        style={[
          styles.themeCard,
          selected && { borderColor: theme.colors.primary },
          !selected && { borderColor: locked ? theme.colors.warning : rarityColor },
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
              <ThemedText style={styles.gradientTitle}>{item.name}</ThemedText>
              <ThemedText style={styles.gradientSubtitle}>
                {item.tagline || item.description}
              </ThemedText>
            </View>

            <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
              <ThemedText style={[styles.rarityText, { color: rarityColor }]}>
                {(item.rarity || "common").toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.themeBody}>
          <ThemePreview item={item} />

          <View style={styles.themeInfo}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.themeName}>{item.name}</ThemedText>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surfaceAlt,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <ThemedText
                  muted={!selected}
                  style={[
                    styles.badgeText,
                    selected && { color: theme.colors.primaryText },
                  ]}
                >
                  {selected
                    ? "Equipped"
                    : owned
                    ? "Owned"
                    : included
                    ? "Included"
                    : achievement
                    ? "Achievement"
                    : `${item.price} coins`}
                </ThemedText>
              </View>
            </View>

            <ThemedText muted style={styles.description}>
              {item.description}
            </ThemedText>

            {achievement && !owned && (
              <View style={styles.achievementRow}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={16}
                  color={theme.colors.warning || "#EAB308"}
                />

                <ThemedText
                  style={[
                    styles.achievementText,
                    { color: theme.colors.warning || "#EAB308" },
                  ]}
                >
                  {getAchievementLabel(item.unlockAchievement)}
                </ThemedText>
              </View>
            )}

            {notEnoughCoins && (
              <ThemedText style={[styles.shortText, { color: theme.colors.danger }]}>
                {item.price - coinBalance} coins short
              </ThemedText>
            )}
          </View>
        </View>

        <ThemedButton
          variant={selected ? "secondary" : "primary"}
          onPress={onPress}
          style={styles.actionButton}
          disabled={locked}
        >
          {selected
            ? "Current Theme"
            : owned || included
            ? "Use Theme"
            : achievement
            ? "Locked"
            : affordable
            ? "Buy Theme"
            : "Not Enough Coins"}
        </ThemedButton>
      </ThemedCard>
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
  theme,
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
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: rarityColor,
            },
          ]}
        >
          <ThemePreview item={item} large />

          <ThemedText style={styles.modalEyebrow}>
            {(item.rarity || "common").toUpperCase()} THEME
          </ThemedText>

          <ThemedText style={styles.modalTitle}>Buy {item.name}?</ThemedText>

          <ThemedText muted style={styles.modalDescription}>
            This permanently unlocks and equips the theme.
          </ThemedText>

          <View
            style={[
              styles.costBox,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.costItem}>
              <ThemedText muted style={styles.costLabel}>
                Cost
              </ThemedText>

              <ThemedText style={styles.costValue}>{item.price} coins</ThemedText>
            </View>

            <View style={styles.costItem}>
              <ThemedText muted style={styles.costLabel}>
                After
              </ThemedText>

              <ThemedText style={styles.costValue}>{remaining} coins</ThemedText>
            </View>
          </View>

          <View style={styles.modalActions}>
            <ThemedButton
              variant="secondary"
              style={styles.modalButton}
              onPress={onCancel}
              disabled={purchasing}
            >
              Cancel
            </ThemedButton>

            <ThemedButton
              style={styles.modalButton}
              onPress={onConfirm}
              disabled={purchasing}
            >
              {purchasing ? "Buying..." : "Buy Theme"}
            </ThemedButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UnlockModal({ visible, unlockTarget, theme, onDismiss, onEquip }) {
  if (!unlockTarget) return null;

  const item = unlockTarget.theme;
  const rarityColor = getRarityColor(item);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: rarityColor,
            },
          ]}
        >
          <View
            style={[
              styles.unlockIcon,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: rarityColor,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="trophy-award"
              size={38}
              color={rarityColor}
            />
          </View>

          <ThemePreview item={item} large />

          <ThemedText style={[styles.unlockEyebrow, { color: rarityColor }]}>
            Theme Unlocked
          </ThemedText>

          <ThemedText style={styles.modalTitle}>{item.name}</ThemedText>

          <ThemedText muted style={styles.modalDescription}>
            You earned this theme through achievement progress.
          </ThemedText>

          <View style={styles.modalActions}>
            <ThemedButton
              variant="secondary"
              style={styles.modalButton}
              onPress={onDismiss}
            >
              Later
            </ThemedButton>

            <ThemedButton style={styles.modalButton} onPress={onEquip}>
              Equip Now
            </ThemedButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  heroCard: {
    marginTop: 10,
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -130,
    right: -90,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },

  heroCopy: {
    flex: 1,
  },

  heroLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  heroValue: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: 2,
  },

  heroSub: {
    marginTop: 8,
    fontWeight: "700",
    lineHeight: 20,
  },

  coinIcon: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  equippedToast: {
    marginTop: 12,
    borderWidth: 1,
  },

  equippedText: {
    fontWeight: "900",
    textAlign: "center",
  },

  syncCard: {
    marginTop: 12,
  },

  section: {
    marginTop: 28,
  },

  sectionHint: {
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 18,
  },

  themeCard: {
    marginBottom: 14,
    overflow: "hidden",
  },

  unaffordableCard: {
    opacity: 0.72,
  },

  gradientStrip: {
    minHeight: 96,
    borderRadius: 24,
    padding: 16,
    justifyContent: "flex-end",
    marginBottom: 16,
  },

  gradientOverlay: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },

  gradientTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowRadius: 6,
  },

  gradientSubtitle: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowRadius: 6,
  },

  rarityBadge: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  rarityText: {
    fontSize: 11,
    fontWeight: "900",
  },

  themeBody: {
    flexDirection: "row",
    gap: 14,
  },

  preview: {
    width: 82,
    height: 94,
    borderRadius: 22,
    borderWidth: 1,
    padding: 9,
    justifyContent: "space-between",
  },

  previewCard: {
    borderRadius: 16,
    padding: 7,
    gap: 5,
  },

  previewBar: {
    height: 10,
    width: "55%",
    borderRadius: 999,
  },

  previewLine: {
    height: 8,
    width: "90%",
    borderRadius: 999,
  },

  previewLineSmall: {
    height: 8,
    width: "65%",
    borderRadius: 999,
  },

  previewButton: {
    height: 14,
    borderRadius: 999,
  },

  themeInfo: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  themeName: {
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
  },

  description: {
    marginTop: 6,
    lineHeight: 20,
  },

  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },

  achievementText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },

  shortText: {
    marginTop: 8,
    fontWeight: "900",
    fontSize: 13,
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  actionButton: {
    marginTop: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    borderRadius: 30,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },

  modalPreview: {
    width: 128,
    height: 146,
    borderRadius: 32,
    borderWidth: 1,
    padding: 14,
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalPreviewCard: {
    borderRadius: 22,
    padding: 12,
    gap: 8,
  },

  modalPreviewBar: {
    height: 14,
    width: "55%",
    borderRadius: 999,
  },

  modalPreviewLine: {
    height: 12,
    width: "90%",
    borderRadius: 999,
  },

  modalPreviewLineSmall: {
    height: 12,
    width: "65%",
    borderRadius: 999,
  },

  modalPreviewButton: {
    height: 22,
    borderRadius: 999,
  },

  modalEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
  },

  modalTitle: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },

  modalDescription: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
  },

  costBox: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  costItem: {
    flex: 1,
  },

  costLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  costValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 18,
  },

  modalButton: {
    flex: 1,
  },

  unlockIcon: {
    width: 74,
    height: 74,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  unlockEyebrow: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 6,
  },
});