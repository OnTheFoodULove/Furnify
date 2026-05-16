/**
 * geminiAgent.js (now using Groq API)
 * ─────────────────────────────────────────────────────────────────────────────
 * MCP Agent Orchestrator — Groq Function-Calling Loop (OpenAI-compatible)
 *
 * This module is the "MCP runtime":
 *   1. Sends the user's message + chat history + system prompt to Groq
 *   2. If the model requests a tool call → runs the MCP skill → feeds result back
 *   3. Repeats until the model returns a final text response
 *   4. Returns the assistant's reply to the UI
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AGENT_SYSTEM_PROMPT } from './agentRules';
import { MCP_TOOL_DECLARATIONS, executeSkill } from './mcpSkills';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL   = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

// Max number of tool-call rounds to prevent infinite loops
const MAX_TOOL_ROUNDS = 5;

/**
 * Convert our MCP tool declarations to OpenAI-compatible "tools" format
 */
function buildTools() {
  return MCP_TOOL_DECLARATIONS.map((decl) => ({
    type: 'function',
    function: {
      name: decl.name,
      description: decl.description,
      parameters: decl.parameters,
    },
  }));
}

/**
 * sendToAgent
 *
 * @param {Array}  chatHistory  — Array of {role, text} objects (the full conversation)
 * @param {string} userId       — The authenticated user's UUID (injected into tool calls)
 * @returns {Promise<string>}   — The assistant's final text response
 */
export async function sendToAgent(chatHistory, userId) {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    return "⚠️ Groq API key is not configured. Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file.";
  }

  // Build the messages array (OpenAI format)
  let messages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    ...chatHistory.map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text,
    })),
  ];

  const tools = buildTools();

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response, responseJson;

    try {
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          tools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      responseJson = await response.json();
    } catch (networkErr) {
      console.error('[GroqAgent] Network error:', networkErr);
      return "Sorry, I couldn't reach the AI service. Please check your connection and try again.";
    }

    if (!response.ok) {
      console.error('[GroqAgent] API error:', responseJson);
      const msg = responseJson?.error?.message || 'Unknown error';

      // If the error is a failed function call, retry WITHOUT tools
      // so the model gives a plain text response instead
      if (response.status === 400 && msg.includes('failed_generation')) {
        console.log('[GroqAgent] Retrying without tools due to failed_generation...');
        try {
          const fallbackResp = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages,
              temperature: 0.7,
              max_tokens: 1024,
            }),
          });
          const fallbackJson = await fallbackResp.json();
          if (fallbackResp.ok && fallbackJson?.choices?.[0]?.message?.content) {
            return fallbackJson.choices[0].message.content.trim();
          }
        } catch (fallbackErr) {
          console.error('[GroqAgent] Fallback also failed:', fallbackErr);
        }
      }

      return "Sorry, I had trouble processing that. Could you try rephrasing your question? 🤔";
    }

    const choice = responseJson?.choices?.[0];
    if (!choice) {
      return "I didn't get a response. Please try again.";
    }

    const assistantMessage = choice.message;

    // ── Check if the model wants to call tools ──────────────────────────
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Append the assistant message (with tool_calls) to history
      messages = [...messages, assistantMessage];

      // Execute each tool call and append results
      for (const toolCall of assistantMessage.tool_calls) {
        const { name } = toolCall.function;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch (e) {
          console.warn('[GroqAgent] Failed to parse tool args:', e);
        }

        console.log(`[MCP] Executing skill: ${name}`, args);
        const skillResult = await executeSkill(name, args, userId);

        // Append tool result as a "tool" role message
        messages = [
          ...messages,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(skillResult),
          },
        ];
      }

      // Continue the loop → model will now process the tool results
      continue;
    }

    // ── No tool calls → extract final text response ─────────────────────
    if (assistantMessage.content) {
      return assistantMessage.content.trim();
    }

    // Safety fallback
    if (choice.finish_reason === 'content_filter') {
      return "I can't respond to that. Let's keep things furniture-focused! 🪑";
    }

    return "I'm not sure how to respond to that. Try asking about our furniture!";
  }

  return "I'm having trouble processing that request. Please try again.";
}
