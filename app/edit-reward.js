import { router, useLocalSearchParams } from "expo-router";
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

export default function EditRewardScreen() {
  const params = useLocalSearchParams();

  const [name, setName] = useState(params.name || "");
  const [description, setDescription] = useState(params.description || "");
  const [cost, setCost] = useState(params.cost ? String(params.cost) : "");
  const [submitting, setSubmitting] = useState(false);

  async function updateReward() {
    const parsedCost = Number(cost);

    if (!name.trim()) {
      Alert.alert("Missing name", "Enter a reward name.");
      return;
    }

    if (!parsedCost || parsedCost <= 0) {
      Alert.alert("Invalid cost", "Enter a coin cost greater than 0.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      await api.put(`/rewards/${params.id}`, {
        name: name.trim(),
        description: description.trim(),
        cost: parsedCost,
        icon: params.icon || "gift",
      });

      router.replace("/(tabs)/rewards");
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
        <Text style={styles.eyebrow}>Edit reward</Text>
        <Text style={styles.title}>Update Reward</Text>
        <Text style={styles.subtitle}>
          Adjust the reward name, notes, or coin cost.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Reward name</Text>
        <TextInput
          style={styles.input}
          placeholder="Reward name"
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

        <Text style={styles.label}>Coin cost</Text>
        <TextInput
          style={styles.input}
          placeholder="Coin cost"
          placeholderTextColor="#9CA3AF"
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
        />
      </View>

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={updateReward}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Saving..." : "Save Changes"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace("/(tabs)/rewards")}
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