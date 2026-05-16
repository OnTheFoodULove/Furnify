/**
 * AgentContext.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React Context for the Furnify Shopping Assistant (Fern)
 *
 * Manages:
 *  - Chat message history
 *  - Loading/typing state
 *  - Exposing sendMessage() to the UI
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { sendToAgent } from '../agent/geminiAgent';
import { useAuth } from './AuthContext';

const AgentContext = createContext(null);

/** Welcome message shown when the chat first opens */
const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'model',
  text: "Hi! I'm **Fern** 🌿, your Furnify shopping assistant.\n\nI can help you:\n• Browse & search furniture\n• Check product details\n• Manage your cart\n• View your order history\n\nWhat are you looking for today?",
  timestamp: new Date(),
};

export function AgentProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);

  /**
   * sendMessage — Takes user input, appends to history, calls the agent,
   * and appends the response.
   */
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return;

      // Append user message immediately
      const userMsg = {
        id: `user_${Date.now()}`,
        role: 'user',
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        // Build history for the agent (exclude welcome message, use only user/model turns)
        const history = [...messages, userMsg]
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({
            role: m.role === 'model' ? 'model' : 'user',
            text: m.text,
          }));

        const replyText = await sendToAgent(history, user?.id);

        const assistantMsg = {
          id: `model_${Date.now()}`,
          role: 'model',
          text: replyText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error('[AgentContext] sendMessage error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'model',
            text: "Oops! Something went wrong. Please try again. 🙏",
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, user]
  );

  /** Clear the conversation and reset to welcome message */
  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return (
    <AgentContext.Provider value={{ messages, isTyping, sendMessage, clearChat }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
