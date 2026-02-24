"use client";

import React, { useEffect, useMemo, useState } from "react";
import challenges from "@/data/challenges.json";
import type { Challenge, ChatMessage, Run } from "@/lib/types";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { useParams, useRouter } from "next/navigation";
import { saveRun } from "@/lib/storage";

function nowIso() {
  return new Date().toISOString();
}

function normalizeToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(ing|ed|es|s)$/g, "");
}

function tokenize(text: string) {
  return text
    .split(/\s+/)
    .map((t) => normalizeToken(t))
    .filter(Boolean);
}

function isSingleTransposition(a: string, b: string) {
  if (a.length !== b.length || a.length < 2) return false;
  const diff: number[] = [];
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) diff.push(i);
    if (diff.length > 2) return false;
  }
  if (diff.length !== 2 || diff[1] !== diff[0] + 1) return false;
  const i = diff[0];
  const j = diff[1];
  return a[i] === b[j] && a[j] === b[i];
}

function withinOneEdit(a: string, b: string) {
  if (a === b) return true;
  if (isSingleTransposition(a, b)) return true;
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) {
      i += 1;
    } else if (a.length < b.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }
  if (i < a.length || j < b.length) edits += 1;
  return edits <= 1;
}

function tokenMatches(textToken: string, patternToken: string) {
  if (textToken === patternToken) return true;
  if (patternToken.length >= 5 && textToken.length >= 5 && withinOneEdit(textToken, patternToken)) return true;
  return false;
}

function hasAnyApprox(text: string, candidates: string[]) {
  const textTokens = tokenize(text);
  return candidates.some((candidate) => {
    const pattern = tokenize(candidate);
    if (pattern.length === 0) return false;
    let hits = 0;
    for (const p of pattern) {
      if (textTokens.some((t) => tokenMatches(t, p))) hits += 1;
    }
    if (pattern.length <= 2) return hits === pattern.length;
    return hits / pattern.length >= 0.75;
  });
}

export default function ChallengePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const challengeId = params?.id;
  const challenge = useMemo(() => {
    if (!challengeId) return null;
    const list = challenges as Challenge[];
    return list.find((c) => c.id === challengeId) ?? null;
  }, [challengeId]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState<Record<string, { at_turn: number; timestamp_iso: string }>>({});
  const [isSending, setIsSending] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendMode, setBackendMode] = useState<"llm" | "fallback" | "heuristic">("heuristic");
  const [backendProvider, setBackendProvider] = useState<string | null>(null);
  const [backendModel, setBackendModel] = useState<string | null>(null);
  const userMessages = useMemo(() => messages.filter((m) => m.role === "user"), [messages]);
  const userTurnCount = userMessages.length;
  const progress = useMemo(() => {
    const userTexts = userMessages.map((m) => m.content);
    const unlockCount = Object.keys(unlocked).length;

    const clarifyingCount = userTexts.filter((t) =>
      t.includes("?") || hasAnyApprox(t, [
        "what",
        "why",
        "how",
        "which",
        "baseline",
        "definition",
        "included",
        "assumptions",
        "confounders",
        "attribution"
      ])
    ).length;

    const asksEvidence = userTexts.some((t) => hasAnyApprox(t, [
      "research",
      "study",
      "evidence",
      "source",
      "citation",
      "verify",
      "basis",
      "proof",
      "data"
    ]));

    const statesUncertainty = userTexts.some((t) => hasAnyApprox(t, [
      "uncertain",
      "confidence",
      "limitations",
      "risk",
      "depends",
      "what would change"
    ]));

    const hasVerification = userTexts.some((t) => hasAnyApprox(t, [
      "checklist",
      "verification steps",
      "qa",
      "review pass",
      "double check",
      "sanity check"
    ]));

    const items = [
      { id: "clarifying", label: "Ask at least 2 clarifying questions", done: clarifyingCount >= 2 },
      { id: "evidence", label: "Request evidence/sources", done: asksEvidence },
      { id: "uncertainty", label: "State uncertainty or limits", done: statesUncertainty },
      { id: "verify", label: "Ask for verification checklist/pass", done: hasVerification },
      { id: "unlock", label: "Unlock hidden context cards", done: unlockCount > 0 }
    ];

    const doneCount = items.filter((x) => x.done).length;
    return {
      items,
      doneCount,
      total: items.length,
      clarifyingCount,
      unlockCount
    };
  }, [userMessages, unlocked]);

  useEffect(() => {
    if (!challenge) return;
    // Seed assistant with brief + a nudge to ask clarifying questions
    setMessages([
      {
        role: "assistant",
        timestamp_iso: nowIso(),
        content:
          `Challenge: ${challenge.title}\n\n${challenge.brief}\n\nBefore we jump to output, what clarifying questions do you want to ask?`
      }
    ]);
  }, [challenge]);

  if (!challenge) {
    return (
      <Container>
        <h1 className="text-2xl font-semibold">Challenge not found</h1>
      </Container>
    );
  }
  const challengeData = challenge;

  const hiddenCards = challengeData.hidden_context_cards.map((c) => ({
    ...c,
    unlocked: Boolean(unlocked[c.id])
  }));

  async function send() {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = { role: "user", content: text, timestamp_iso: nowIso() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/challenge/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challengeData.id,
          user_text: text,
          messages: nextMessages,
          unlocked
        })
      });

      if (!response.ok) {
        throw new Error("Backend turn failed");
      }

      const data = await response.json() as {
        assistant_message: ChatMessage;
        unlocked: Record<string, { at_turn: number; timestamp_iso: string }>;
        backend_mode: "llm" | "fallback" | "heuristic";
        backend_provider: string | null;
        backend_model: string | null;
      };

      setUnlocked(data.unlocked);
      setBackendMode(data.backend_mode);
      setBackendProvider(data.backend_provider);
      setBackendModel(data.backend_model);
      setMessages([...nextMessages, data.assistant_message]);
    } catch {
      setError("Could not reach backend turn service. Please retry.");
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          timestamp_iso: nowIso(),
          content: "Backend turn service is unavailable. Try sending again."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function score() {
    if (isScoring || userTurnCount === 0) return;

    setError(null);
    setIsScoring(true);
    try {
      const response = await fetch("/api/challenge/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challengeData.id,
          messages,
          unlocked
        })
      });

      if (!response.ok) {
        throw new Error("Backend score failed");
      }

      const data = await response.json() as { run_id: string; run?: Run; persisted?: boolean };
      if (data.run) {
        saveRun(data.run);
      }
      router.push(`/results/${data.run_id}`);
    } catch {
      setError("Could not score on backend. Please try again.");
    } finally {
      setIsScoring(false);
    }
  }

  return (
    <Container>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{challengeData.title}</h1>
          <p className="tone-muted mt-1 text-sm">{challengeData.brief}</p>
        </div>
        <button
          onClick={score}
          disabled={isScoring || userTurnCount === 0}
          className="btn-solid px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isScoring ? "Scoring..." : "Score this attempt"}
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Scoring evaluates your prompts/questions and verification behavior across the 4D rubric.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card title="Challenge chat">
            <div className="surface-inset h-96 overflow-auto rounded-2xl p-3">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === "user" ? "mb-3 text-sm" : "mb-3 text-sm text-neutral-700"}>
                  <div className="text-xs font-semibold text-neutral-500">{m.role === "user" ? "You" : "Assistant"}</div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
                className="field-input w-full px-3 py-2 text-sm"
                placeholder="Type your next prompt or response…"
              />
              <button
                onClick={() => void send()}
                disabled={isSending}
                className="btn-solid px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>

            <p className="mt-2 text-xs text-neutral-500">
              Tip: Ask clarifying questions early. If you miss hidden context, Discernment score drops.
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Backend mode: {backendMode === "llm" ? "LLM" : backendMode === "fallback" ? "Fallback (LLM failed)" : "Heuristic (no API key)"}
              {backendProvider ? ` via ${backendProvider}` : ""}
              {backendModel ? ` (${backendModel})` : ""}
            </p>
            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card title="Live progress">
            <p className="text-xs text-neutral-600">
              {progress.doneCount}/{progress.total} rubric signals detected so far.
              Clarifying questions: {progress.clarifyingCount}. Unlocks: {progress.unlockCount}.
            </p>
            <div className="mt-2 h-2 rounded-full bg-white/70">
              <div
                className="h-2 rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${Math.round((progress.doneCount / progress.total) * 100)}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {progress.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className={item.done ? "text-emerald-700" : "text-neutral-500"}>
                    {item.done ? "✓" : "•"}
                  </span>
                  <span className={item.done ? "text-neutral-900" : "text-neutral-600"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="mt-4">
          <Card title="Hidden context cards">
            <div className="space-y-3">
                {hiddenCards.map((c) => (
                <div key={c.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{c.title}</div>
                    <div className="text-xs text-neutral-500">{c.unlocked ? "Unlocked" : "Locked"}</div>
                  </div>
                  <div className="mt-2 text-sm text-neutral-700">
                    {c.unlocked ? c.content : "Ask the right clarifying question to unlock this."}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          </div>

          <div className="mt-4">
            <Card title="Success criteria">
              <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {challengeData.success_criteria.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </Card>
          </div>

          <div className="mt-4">
            <Card title="How this is scored">
              <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                <li>We score your prompts and questions, not assistant writing quality.</li>
                <li>Hidden card unlocks indicate missing-context behavior and improve Discernment.</li>
                <li>You can score any time. The score reflects progress up to that point.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
