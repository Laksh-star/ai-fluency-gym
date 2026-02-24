import { NextResponse } from "next/server";
import { z } from "zod";
import { rubric } from "@/lib/rubric";
import { evaluateConversation } from "@/lib/evaluate";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp_iso: z.string()
});

const unlockSchema = z.object({
  card_id: z.string(),
  at_turn: z.number().int().nonnegative(),
  timestamp_iso: z.string()
});

const judgeRequestSchema = z.object({
  mode: z.enum(["transcript", "challenge"]),
  messages: z.array(messageSchema).min(1),
  meta: z.object({
    challenge_id: z.string().optional(),
    unlocks: z.array(unlockSchema).optional(),
    total_cards: z.number().int().nonnegative().optional()
  }).optional()
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof judgeRequestSchema>;
  try {
    parsed = judgeRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const result = evaluateConversation({
    rubric,
    messages: parsed.messages,
    mode: parsed.mode,
    meta: parsed.meta
  });

  return NextResponse.json({ result });
}
