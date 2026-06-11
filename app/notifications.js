import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { api } from "../lib/api";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadNotifications() {
    try {
      const response = await api.getNotifications();

      setNotifications(
        response.notifications || []
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Unable to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function markRead(notificationId) {
    try {
      await api.markNotificationRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.log(error);
    }
  }

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Unable to mark notifications read."
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  function renderItem({ item }) {
    return (
      <View
        style={[
          styles.card,
          !item.read && styles.unreadCard,
        ]}
      >
        <Text style={styles.message}>
          {item.message}
        </Text>

        <Text style={styles.date}>
         {item.created_at
            ? new Date(item.created_at).toLocaleString()
            : ""}
        </Text>

        {!item.read && (
          <Text
            style={styles.markRead}
            onPress={() =>
              markRead(item.id)
            }
          >
            Mark Read
          </Text>
        )}
      </View>
    );
  }

  if (loading) {
    return (
        <View style={styles.container}>
            <ActivityIndicator />
        </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Notifications
      </Text>

      <Text
        style={styles.markAll}
        onPress={markAllRead}
      >
        Mark All Read
      </Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
          />
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>
              No notifications yet.
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },

  markAll: {
    color: "#3b82f6",
    fontWeight: "600",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  unreadCard: {
    borderWidth: 2,
    borderColor: "#3b82f6",
  },

  message: {
    fontSize: 16,
    fontWeight: "500",
  },

  date: {
    marginTop: 8,
    color: "#666",
    fontSize: 12,
  },

  markRead: {
    marginTop: 10,
    color: "#3b82f6",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
});