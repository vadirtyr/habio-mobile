import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api";
import { radii, spacing, typography } from "../lib/theme";

const PROMPTS = [
  "What should I focus on today?",
  "What am I falling behind on?",
  "How is my Orbit doing?",
  "What can I complete quickly?",
  "How do I reach my weekly goals?",
  "What is putting my streaks at risk?",
];

export default function AICoachScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const params = useLocalSearchParams();
  const orbitId = safeText(params.orbitId);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const subtitle = useMemo(
    () => orbitId ? "Ask for Orbit-aware guidance." : "Plan the next useful action.",
    [orbitId]
  );

  async function sendMessage(text = input) {
    const message = safeText(text);
    if (!message || loading) return;

    setInput("");
    setError(null);
    setLoading(true);
    const userMessage = { role: "user", content: message };
    setMessages((items) => [...items, userMessage]);

    try {
      const result = await api.chatWithCoach({
        message,
        orbit_id: orbitId || undefined,
        conversation_id: conversationId || undefined,
      });
      setConversationId(result.conversation_id || conversationId);
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content: safeText(result.response),
          suggested_actions: Array.isArray(result.suggested_actions) ? result.suggested_actions : [],
        },
      ]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd?.({ animated: true }));
    } catch (err) {
      setError(err?.message || "Unable to reach AI Coach.");
      setMessages((items) => items.filter((item) => item !== userMessage));
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    const target = action?.target || {};
    api.trackCoachAction({
      conversation_id: conversationId || undefined,
      orbit_id: action?.orbit_id || orbitId || undefined,
      action_type: action?.type || "open",
      target,
    }).catch(() => {});

    if (target.path === "/orbit-detail" || action?.orbit_id) {
      router.push({ pathname: "/orbit-detail", params: { orbitId: action.orbit_id || orbitId || target.params?.orbitId } });
      return;
    }
    if (target.path) {
      router.push(target.path);
      return;
    }
    if (action?.project_id) {
      router.push({ pathname: "/project-detail", params: { projectId: action.project_id } });
      return;
    }
    if (action?.type === "open_task") {
      router.push("/tasks");
      return;
    }
    if (action?.type === "open_habit" || action?.type === "complete_habit") {
      router.push("/habits");
      return;
    }
    router.push("/(tabs)/dashboard");
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="AI Coach"
          subtitle={subtitle}
          right={<AppButton title="Back" variant="ghost" fullWidth={false} onPress={() => router.back()} />}
        />

        {!messages.length && (
          <AppCard>
            <Text style={[styles.introTitle, { color: c.text }]}>What do you want to move forward?</Text>
            <Text style={[styles.introCopy, { color: c.textSecondary }]}>
              Ask for a focused plan based on your habits, tasks, projects, Orbits, streaks, milestones, and current risks.
            </Text>
            <View style={styles.promptWrap}>
              {PROMPTS.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => sendMessage(prompt)}
                  style={({ pressed }) => [
                    styles.prompt,
                    { borderColor: c.border, backgroundColor: c.surfaceAlt },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.promptText, { color: c.text }]}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </AppCard>
        )}

        {!!messages.length && (
          <View style={styles.thread}>
            {messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}`}
                message={message}
                colors={c}
                onAction={handleAction}
              />
            ))}
          </View>
        )}

        {!!error && (
          <AppCard style={[styles.errorCard, { borderColor: c.danger || "#EF4444" }]}>
            <Text style={[styles.errorText, { color: c.danger || "#EF4444" }]}>{error}</Text>
          </AppCard>
        )}
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        <AppInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask your coach..."
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
          editable={!loading}
          style={styles.input}
          rightElement={
            <Pressable
              onPress={() => sendMessage()}
              disabled={loading || !safeText(input)}
              style={[styles.sendButton, { backgroundColor: c.primary }, (loading || !safeText(input)) && styles.disabled]}
              accessibilityLabel="Send message"
            >
              <MaterialCommunityIcons name={loading ? "dots-horizontal" : "send"} size={20} color={c.primaryText || "#FFFFFF"} />
            </Pressable>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, colors, onAction }) {
  const isUser = message.role === "user";
  const actions = Array.isArray(message.suggested_actions) ? message.suggested_actions.filter((item) => safeText(item?.label)) : [];

  return (
    <View style={[styles.messageRow, isUser && styles.userRow]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.surface,
            borderColor: isUser ? colors.primary : colors.border,
          },
        ]}
      >
        <Text style={[styles.messageText, { color: isUser ? colors.primaryText || "#FFFFFF" : colors.text }]}>
          {safeText(message.content)}
        </Text>
        {!isUser && !!actions.length && (
          <View style={styles.actions}>
            {actions.slice(0, 3).map((action, index) => (
              <AppButton
                key={`${action.type || "action"}-${index}`}
                title={safeText(action.label) || "Open"}
                variant="secondary"
                onPress={() => onAction(action)}
                style={styles.actionButton}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 120, gap: spacing.lg },
  introTitle: { ...typography.h3, marginBottom: spacing.xs },
  introCopy: { ...typography.body, lineHeight: 22 },
  promptWrap: { gap: spacing.sm, marginTop: spacing.lg },
  prompt: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md },
  promptText: { ...typography.bodyBold },
  pressed: { opacity: 0.75 },
  thread: { gap: spacing.md },
  messageRow: { flexDirection: "row" },
  userRow: { justifyContent: "flex-end" },
  bubble: { maxWidth: "88%", borderWidth: 1, borderRadius: radii.xl, padding: spacing.md },
  messageText: { ...typography.body, lineHeight: 22 },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  actionButton: { minHeight: 46 },
  errorCard: { borderWidth: 1 },
  errorText: { ...typography.bodyBold },
  composer: { borderTopWidth: 1, padding: spacing.md },
  input: { minHeight: 54 },
  sendButton: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.45 },
});
