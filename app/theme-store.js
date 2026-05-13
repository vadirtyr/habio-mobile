import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";

import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";
import ThemedScreen from "../components/ThemedScreen";
import ThemedText from "../components/ThemedText";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";

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
  } = useTheme();

  const [coinBalance, setCoinBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

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

  async function handleThemePress(key) {
    const selectedTheme = themes[key];
    const owned = ownedThemes.includes(key);
    const selected = themeName === key;

    if (selected) return;

    if (owned) {
      await setThemeName(key);
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

      await setThemeName(key);
      setPurchaseTarget(null);

      Alert.alert(
        "Theme Purchased",
        `${selectedTheme.name} has been added to your themes.`
      );
    } catch (error) {
      Alert.alert("Could not buy theme", error.message);
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <ThemedScreen contentContainerStyle={styles.container}>
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

      <ThemedCard style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <ThemedText muted style={styles.balanceLabel}>
              Available Coins
            </ThemedText>
            <ThemedText style={styles.balanceValue}>
              {loadingBalance ? "..." : coinBalance}
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
              name="circle-multiple"
              size={30}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <ThemedText muted style={styles.balanceSub}>
          Earn coins by completing habits, tasks, and quests.
        </ThemedText>
      </ThemedCard>

      <ThemedText muted style={styles.subtitle}>
        Use your earned coins to unlock new looks. Included themes are always
        available.
      </ThemedText>

      {syncing && (
        <ThemedCard style={styles.syncCard}>
          <ThemedText muted>Syncing theme ownership...</ThemedText>
        </ThemedCard>
      )}

      {Object.entries(themes).map(([key, item]) => {
        const selected = themeName === key;
        const owned = ownedThemes.includes(key);
        const included = item.type === "included";
        const affordable = included || owned || coinBalance >= item.price;

        return (
          <ThemedCard
            key={key}
            style={[
              styles.themeCard,
              selected && { borderColor: theme.colors.primary },
              !owned && !included && !affordable && styles.unaffordableCard,
            ]}
          >
            <View style={styles.themeTop}>
              <View
                style={[
                  styles.preview,
                  {
                    backgroundColor: item.colors.background,
                    borderColor: item.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.previewSurface,
                    { backgroundColor: item.colors.surface },
                  ]}
                />
                <View
                  style={[
                    styles.previewAccent,
                    { backgroundColor: item.colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.previewAlt,
                    { backgroundColor: item.colors.surfaceAlt },
                  ]}
                />
              </View>

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
                        borderColor: selected
                          ? theme.colors.primary
                          : theme.colors.border,
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
                        : `${item.price} coins`}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText muted style={styles.description}>
                  {item.description}
                </ThemedText>

                {!owned && !included && !affordable && (
                  <ThemedText
                    style={[styles.shortText, { color: theme.colors.danger }]}
                  >
                    {item.price - coinBalance} coins short
                  </ThemedText>
                )}
              </View>
            </View>

            <ThemedButton
              variant={selected ? "secondary" : "primary"}
              onPress={() => handleThemePress(key)}
              style={styles.actionButton}
              disabled={!included && !owned && !affordable}
            >
              {selected
                ? "Current Theme"
                : owned || included
                ? "Use Theme"
                : affordable
                ? "Buy Theme"
                : "Not Enough Coins"}
            </ThemedButton>

            {!owned && !included && (
              <View style={styles.lockRow}>
                <MaterialCommunityIcons
                  name={affordable ? "lock-open-outline" : "lock-outline"}
                  size={15}
                  color={theme.colors.muted}
                />
                <ThemedText muted style={styles.lockText}>
                  Purchase with earned coins
                </ThemedText>
              </View>
            )}
          </ThemedCard>
        );
      })}

      <PurchaseModal
        visible={!!purchaseTarget}
        purchaseTarget={purchaseTarget}
        coinBalance={coinBalance}
        purchasing={purchasing}
        theme={theme}
        onCancel={() => setPurchaseTarget(null)}
        onConfirm={confirmPurchase}
      />
    </ThemedScreen>
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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.modalPreview,
              {
                backgroundColor: item.colors.background,
                borderColor: item.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.modalPreviewSurface,
                { backgroundColor: item.colors.surface },
              ]}
            />
            <View
              style={[
                styles.modalPreviewAccent,
                { backgroundColor: item.colors.primary },
              ]}
            />
            <View
              style={[
                styles.modalPreviewAlt,
                { backgroundColor: item.colors.surfaceAlt },
              ]}
            />
          </View>

          <ThemedText style={styles.modalTitle}>Buy {item.name}?</ThemedText>

          <ThemedText muted style={styles.modalDescription}>
            This will unlock the theme permanently and equip it now.
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
                After Purchase
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
  balanceCard: {
    marginTop: 10,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: 2,
  },
  balanceSub: {
    marginTop: 8,
    fontWeight: "700",
  },
  coinIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  subtitle: {
    lineHeight: 21,
    marginBottom: 18,
  },
  syncCard: {
    marginBottom: 14,
  },
  themeCard: {
    marginBottom: 14,
  },
  unaffordableCard: {
    opacity: 0.72,
  },
  themeTop: {
    flexDirection: "row",
    gap: 14,
  },
  preview: {
    width: 76,
    height: 76,
    borderRadius: 20,
    borderWidth: 1,
    padding: 9,
    gap: 6,
  },
  previewSurface: {
    height: 18,
    borderRadius: 999,
  },
  previewAccent: {
    height: 18,
    width: "70%",
    borderRadius: 999,
  },
  previewAlt: {
    height: 18,
    width: "85%",
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
    marginTop: 14,
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  lockText: {
    fontSize: 12,
    fontWeight: "700",
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
    width: 112,
    height: 112,
    borderRadius: 30,
    borderWidth: 1,
    padding: 14,
    gap: 9,
    marginBottom: 18,
  },
  modalPreviewSurface: {
    height: 24,
    borderRadius: 999,
  },
  modalPreviewAccent: {
    height: 24,
    width: "70%",
    borderRadius: 999,
  },
  modalPreviewAlt: {
    height: 24,
    width: "85%",
    borderRadius: 999,
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
});