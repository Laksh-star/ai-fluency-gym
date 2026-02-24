import { NextResponse } from "next/server";
import { z } from "zod";
import challengesJson from "@/data/challenges.json";
import type { Challenge, Run } from "@/lib/types";
import { rubric } from "@/lib/rubric";
import { evaluateConversation } from "@/lib/evaluate";
import { uid } from "@/lib/challenge-engine";
import { saveRunServer } from "@/lib/server-run-store";

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

const scoreRequestSchema = z.object({
  challenge_id: z.string().min(1),
  messages: z.array(messageSchema).min(1),
  unlocked: unlockedSchema
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof scoreRequestSchema>;
  try {
    parsed = scoreRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const challenges = challengesJson as Challenge[];
  const challenge = challenges.find((c) => c.id === parsed.challenge_id);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const unlockEvents = Object.entries(parsed.unlocked).map(([card_id, value]) => ({
    card_id,
    at_turn: value.at_turn,
    timestamp_iso: value.timestamp_iso
  }));

  const result = evaluateConversation({
    rubric,
    messages: parsed.messages,
    mode: "challenge",
    meta: {
      challenge_id: challenge.id,
      unlocks: unlockEvents,
      total_cards: challenge.hidden_context_cards.length
    }
  });

  const run: Run = {
    run_id: uid(),
    mode: "challenge",
    created_at_iso: new Date().toISOString(),
    input_summary: `${challenge.track}: ${challenge.title}`,
    messages: parsed.messages,
    result
  };

  let persisted = true;
  try {
    await saveRunServer(run);
  } catch {
    // Some serverless runtimes do not allow app-directory writes.
    // Return the run payload so the client can persist it locally.
    persisted = false;
  }

  return NextResponse.json({
    run_id: run.run_id,
    overall: run.result.overall,
    artifact_bias_label: run.result.artifact_bias_label,
    persisted,
    run
  });
}
