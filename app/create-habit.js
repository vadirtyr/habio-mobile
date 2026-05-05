import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { api } from "../lib/api";

export default function CreateHabitScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function createHabit() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Enter a habit name.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      await api.post("/habits", {
        name: name.trim(),
        description: description.trim(),
        frequency: "daily",
        difficulty: "medium",
        icon: "flame",
      });

      router.replace("/(tabs)/habits");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>New habit</Text>
        <Text style={styles.title}>Create Habit</Text>
        <Text style={styles.subtitle}>
          Build a repeatable daily action and earn coins every time you complete it.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Habit name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Drink water"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Optional notes"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.previewBox}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🔥</Text>
          </View>

          <View style={styles.previewText}>
            <Text style={styles.previewTitle}>{name.trim() || "Your habit"}</Text>
            <Text style={styles.previewSubtitle}>Daily • Medium • 10 coins</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={createHabit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Creating..." : "Create Habit"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace("/(tabs)/habits")}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  container: {
    padding: 20,
    paddingTop: 34,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#111827",
    marginTop: 2,
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 21,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  label: {
    color: "#374151",
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    color: "#111827",
    fontWeight: "600",
  },
  textarea: {
    height: 96,
    textAlignVertical: "top",
  },
  previewBox: {
    marginTop: 4,
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 24,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
  },
  previewSubtitle: {
    marginTop: 3,
    color: "#6B7280",
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
  },
  cancelText: {
    color: "#6B7280",
    fontWeight: "800",
  },
});