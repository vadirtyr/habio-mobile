import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppCard } from "../components/AppCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

export default function UserSearchScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setUsers([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchUsers(trimmed);
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  async function searchUsers(text) {
    setLoading(true);

    try {
      const results = await api.get(
        `/users/search?q=${encodeURIComponent(text)}`
      );

      setUsers(Array.isArray(results) ? results : []);
    } catch (error) {
      Alert.alert("Search failed", error.message);
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
      style={[styles.screen, { backgroundColor: c.background }]}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Find People"
        subtitle="Search public OurOrbit profiles."
      />

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: c.surface,
            borderColor: c.border,
          },
        ]}
      >
        <Feather name="search" size={20} color={c.textMuted} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username or name"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: c.text }]}
        />
      </View>

      {query.trim().length < 2 ? (
        <AppCard style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="account-search-outline"
            size={42}
            color={c.textMuted}
          />

          <Text style={[styles.emptyTitle, { color: c.text }]}>
            Search for people
          </Text>

          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Enter at least two characters to find public profiles.
          </Text>
        </AppCard>
      ) : loading ? (
        <Text style={[styles.statusText, { color: c.textSecondary }]}>
          Searching...
        </Text>
      ) : users.length === 0 ? (
        <AppCard style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="account-off-outline"
            size={42}
            color={c.textMuted}
          />

          <Text style={[styles.emptyTitle, { color: c.text }]}>
            No users found
          </Text>

          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Try another username or display name.
          </Text>
        </AppCard>
      ) : (
        <View style={styles.results}>
          {users.map((user) => (
            <Pressable key={user.id} onPress={() => openProfile(user)}>
              <AppCard style={styles.userCard}>
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
                    name={user.avatar || "compass-outline"}
                    size={26}
                    color={c.primary}
                  />
                </View>

                <View style={styles.userCopy}>
                  <Text style={[styles.displayName, { color: c.text }]}>
                    {user.display_name || user.name || user.username}
                  </Text>

                  <Text style={[styles.username, { color: c.textSecondary }]}>
                    @{user.username}
                  </Text>
                </View>

                <Feather name="chevron-right" size={22} color={c.textMuted} />
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
    paddingBottom: 80,
  },

  searchBox: {
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: 4,
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