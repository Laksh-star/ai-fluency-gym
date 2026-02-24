import { NextResponse } from "next/server";
import { z } from "zod";
import challengesJson from "@/data/challenges.json";
import type { Challenge, ChatMessage } from "@/lib/types";
import { applyChallengeUnlocks, buildAssistantReply } from "@/lib/challenge-engine";
import { generateChallengeReply, isLlmConfigured } from "@/lib/llm";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp_iso: z.string()
});

const unlockedSchema = z.record(z.object({
  at_turn: z.number().int().nonnegative(),
  timestamp_iso: z.string()
}));

const turnRequestSchema = z.object({
  challenge_id: z.string().min(1),
  user_text: z.string().min(1),
  messages: z.array(messageSchema),
  unlocked: unlockedSchema
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof turnRequestSchema>;
  try {
    parsed = turnRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const challenges = challengesJson as Challenge[];
  const challenge = challenges.find((c) => c.id === parsed.challenge_id);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const turnIndex = parsed.messages.filter((m) => m.role === "user").length;
  const unlockResult = applyChallengeUnlocks({
    challenge,
    currentUnlocked: parsed.unlocked,
    userText: parsed.user_text,
    turnIndex
  });

  const assistantMessage: ChatMessage = {
    role: "assistant",
    content: "",
    timestamp_iso: new Date().toISOString()
  };

  const unlockedCards = challenge.hidden_context_cards
    .filter((card) => Boolean(unlockResult.unlocked[card.id]))
    .map((card) => ({ title: card.title, content: card.content }));

  const llmReply = await generateChallengeReply({
    challenge,
    messages: parsed.messages,
    userText: parsed.user_text,
    unlockedCards,
    unlockedNow: unlockResult.unlockedNow
  });

  const recentAssistantMessages = parsed.messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.content);

  assistantMessage.content = llmReply?.text ?? buildAssistantReply({
    userText: parsed.user_text,
    unlockedNow: unlockResult.unlockedNow,
    recentAssistantMessages
  });

  return NextResponse.json({
    assistant_message: assistantMessage,
    unlocked: unlockResult.unlocked,
    unlocked_now: unlockResult.unlockedNow,
    backend_mode: llmReply ? "llm" : (isLlmConfigured() ? "fallback" : "heuristic"),
    backend_provider: llmReply?.provider ?? null,
    backend_model: llmReply?.model ?? null
  });
}
