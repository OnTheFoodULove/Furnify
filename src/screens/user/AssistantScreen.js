/**
 * AssistantScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The Furnify Shopping Assistant (Fern) Chat UI
 *
 * Features:
 *  - Chat bubbles (user right / Fern left)
 *  - Typing indicator (animated dots)
 *  - Markdown-style bold rendering
 *  - Quick suggestion chips
 *  - Clear chat button
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgent } from '../../context/AgentContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

// ─── Quick Suggestion Chips ───────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  "Show me living room furniture",
  "What's in my cart?",
  "Find sofas under ₱10,000",
  "My order history",
  "Show bedroom items",
];

// ─── Typing Indicator Component ───────────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dotStyle = (anim) => ({
    ...styles.typingDot,
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.typingBubble}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

// ─── Simple Markdown-like renderer ───────────────────────────────────────────
// Handles **bold**, ## headings, and bullet points (*, •, -)
function RenderMessageText({ text, isUser }) {
  const textColor = isUser ? Colors.textInverse : Colors.text;
  const lines = text.split('\n');

  return (
    <View>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={idx} style={{ height: 4 }} />;
        }

        // Handle ## headings
        if (trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <Text
              key={idx}
              style={[
                styles.messageText,
                { color: textColor, fontWeight: '700', fontSize: 15, marginTop: idx > 0 ? 6 : 0, marginBottom: 2 },
              ]}
            >
              {renderInlineBold(headingText)}
            </Text>
          );
        }

        // Handle bullet points (*, •, -)
        const bulletMatch = trimmed.match(/^([*•\-])\s+(.*)/);
        if (bulletMatch) {
          const bulletContent = bulletMatch[2];
          return (
            <View key={idx} style={{ flexDirection: 'row', paddingLeft: 4, marginVertical: 1 }}>
              <Text style={[styles.messageText, { color: textColor }]}>{'•  '}</Text>
              <Text style={[styles.messageText, { color: textColor, flex: 1 }]}>
                {renderInlineBold(bulletContent)}
              </Text>
            </View>
          );
        }

        // Regular line with inline **bold**
        return (
          <Text key={idx} style={[styles.messageText, { color: textColor }]}>
            {renderInlineBold(line)}
          </Text>
        );
      })}
    </View>
  );
}

// Helper: render **bold** segments within a string
function renderInlineBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700' }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowFern]}>
      {!isUser && (
        <View style={styles.fernAvatar}>
          <Text style={styles.fernAvatarText}>🌿</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleFern,
          message.isError && styles.bubbleError,
        ]}
      >
        <RenderMessageText text={message.text} isUser={isUser} />
        <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.65)' : Colors.textMuted }]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AssistantScreen() {
  const { messages, isTyping, sendMessage, clearChat } = useAgent();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const showSuggestions = messages.length <= 1;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>🌿</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Fern</Text>
            <Text style={styles.headerSubtitle}>AI Shopping Assistant</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn} accessibilityLabel="Clear chat">
          <Ionicons name="refresh-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── MCP Badge ── */}
      <View style={styles.mcpBadgeRow}>
        <View style={styles.mcpBadge}>
          <Ionicons name="flash" size={10} color={Colors.primary} />
          <Text style={styles.mcpBadgeText}>MCP • 5 Skills Active</Text>
        </View>
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowFern]}>
            <View style={styles.fernAvatar}>
              <Text style={styles.fernAvatarText}>🌿</Text>
            </View>
            <TypingIndicator />
          </View>
        )}

        {/* Quick Suggestions */}
        {showSuggestions && !isTyping && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Try asking:</Text>
            {QUICK_SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => handleSuggestion(s)}
                accessibilityLabel={`Suggestion: ${s}`}
              >
                <Text style={styles.suggestionText}>{s}</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Input Bar ── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask Fern anything about furniture..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          accessibilityLabel="Chat input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isTyping}
          accessibilityLabel="Send message"
        >
          {isTyping ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Ionicons name="send" size={18} color={Colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  headerAvatarText: { fontSize: 20 },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },

  // MCP Badge
  mcpBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primarySurface,
  },
  mcpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mcpBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    letterSpacing: 0.5,
  },

  // Message list
  messageList: { flex: 1 },
  messageListContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },

  // Message rows
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowFern: { justifyContent: 'flex-start' },

  // Fern avatar
  fernAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  fernAvatarText: { fontSize: 14 },

  // Bubbles
  bubble: {
    maxWidth: '78%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    ...Shadows.sm,
  },
  bubbleFern: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadows.sm,
  },
  bubbleError: {
    backgroundColor: Colors.errorSurface,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  messageText: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-end',
  },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: 5,
    ...Shadows.sm,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },

  // Suggestions
  suggestionsContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  suggestionsLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  suggestionText: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    flex: 1,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.size.sm,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textMuted,
    ...Shadows.sm,
  },
});
