import type { Challenge, ChatMessage } from "@/lib/types";

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

type MessageContent = string | Array<{ type?: string; text?: string }> | undefined;
type LlmProvider = "openai" | "openrouter";

type ProviderConfig = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  endpoint: string;
  headers: Record<string, string>;
};

export type GeneratedReply = {
  text: string;
  provider: LlmProvider;
  model: string;
};

function readTextContent(content: MessageContent) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (part?.type === "text" && part.text ? part.text : ""))
    .join("")
    .trim();
}

export function isLlmConfigured() {
  return Boolean(providerConfig());
}

function normalizeProvider(value: string | undefined) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "openrouter") return "openrouter";
  if (lower === "openai") return "openai";
  return null;
}

function openAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const endpoint = process.env.OPENAI_BASE_URL
    ? `${process.env.OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`
    : "https://api.openai.com/v1/chat/completions";

  return {
    provider: "openai" as const,
    apiKey,
    endpoint,
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    headers: {}
  };
}

function openRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const headers: Record<string, string> = {
    "X-Title": process.env.OPENROUTER_APP_NAME ?? "ai-fluency-gym"
  };
  const referer = process.env.OPENROUTER_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (referer) headers["HTTP-Referer"] = referer;

  return {
    provider: "openrouter" as const,
    apiKey,
    endpoint: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1/chat/completions",
    model: process.env.OPENROUTER_MODEL ?? "moonshotai/kimi-k2.5",
    headers
  };
}

function providerConfig(): ProviderConfig | null {
  const preferred = normalizeProvider(process.env.LLM_PROVIDER);
  const openRouter = openRouterConfig();
  const openAi = openAiConfig();

  if (preferred === "openrouter") return openRouter;
  if (preferred === "openai") return openAi;
  return openRouter ?? openAi;
}

export async function generateChallengeReply(params: {
  challenge: Challenge;
  messages: ChatMessage[];
  userText: string;
  unlockedCards: Array<{ title: string; content: string }>;
  unlockedNow: Array<{ id: string; title: string }>;
}) {
  const config = providerConfig();
  if (!config) return null;

  const { apiKey, endpoint, model, provider } = config;
  const { challenge, messages, unlockedCards, unlockedNow, userText } = params;
  const recentMessages = messages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content
  }));

  const unlockedCardText = unlockedCards.length
    ? unlockedCards.map((c, i) => `${i + 1}. ${c.title}: ${c.content}`).join("\n")
    : "None yet.";

  const unlockedNowText = unlockedNow.length
    ? unlockedNow.map((x) => x.title).join(", ")
    : "None on this turn.";
  const previousAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "None";

  const systemPrompt = [
    "You are an AI Fluency Gym coaching assistant.",
    "Your job is to guide the user to ask better questions, verify claims, and state uncertainty.",
    "Keep replies concise (2-5 sentences), practical, and specific to the challenge.",
    "Do not invent hidden context cards that are not listed as unlocked.",
    "If a card was just unlocked, explicitly mention it and explain how it affects analysis.",
    "Avoid repeating the previous assistant response verbatim."
  ].join(" ");

  const contextPrompt = [
    `Challenge: ${challenge.title}`,
    `Brief: ${challenge.brief}`,
    `Success criteria: ${challenge.success_criteria.join("; ")}`,
    `Unlocked now: ${unlockedNowText}`,
    `Unlocked card details:\n${unlockedCardText}`,
    `Previous assistant response: ${previousAssistant}`,
    `Latest user message: ${userText}`
  ].join("\n\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...config.headers
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "system", content: contextPrompt },
          ...recentMessages
        ]
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as OpenAIChatResponse;
    const text = readTextContent(data.choices?.[0]?.message?.content);
    if (!text) return null;
    return { text, provider, model } satisfies GeneratedReply;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
