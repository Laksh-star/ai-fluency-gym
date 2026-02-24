"use client";

import React, { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { rubric } from "@/lib/rubric";
import { evaluateConversation, parseTranscript } from "@/lib/evaluate";
import { saveRun } from "@/lib/storage";
import type { Run } from "@/lib/types";
import { useRouter } from "next/navigation";

function uid() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export default function TranscriptPage() {
  const [text, setText] = useState("");
  const [isScoring, setIsScoring] = useState(false);
  const router = useRouter();

  const canScore = useMemo(() => text.trim().length >= 40, [text]);

  async function onScore() {
    if (isScoring) return;
    setIsScoring(true);
    try {
      const messages = parseTranscript(text);
      let result: ReturnType<typeof evaluateConversation>;

      try {
        const response = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "transcript", messages })
        });

        if (!response.ok) {
          throw new Error("Server judge failed");
        }

        const data = await response.json() as { result: ReturnType<typeof evaluateConversation> };
        result = data.result;
      } catch {
        // Fallback keeps transcript scoring functional even if API is unavailable.
        result = evaluateConversation({ rubric, messages, mode: "transcript" });
      }

      const run: Run = {
        run_id: uid(),
        mode: "transcript",
        created_at_iso: new Date().toISOString(),
        input_summary: text.trim().slice(0, 120),
        messages,
        result
      };

      saveRun(run);
      router.push(`/results/${run.run_id}`);
    } finally {
      setIsScoring(false);
    }
  }

  return (
    <Container>
      <h1 className="text-3xl font-semibold">Transcript Score</h1>
      <p className="tone-muted mt-2 max-w-3xl text-sm">
        Paste a redacted transcript. Scoring uses the server judge first with an in-browser fallback, and stores derived scores in localStorage.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card title="Paste transcript">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="field-input h-80 w-full p-3 text-sm"
              placeholder={"Tip: If you can, prefix lines with 'User:' and 'Assistant:' for better parsing."}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500">We only use your text to compute the score.</span>
              <button
                  disabled={!canScore || isScoring}
                  onClick={() => void onScore()}
                  className="btn-solid px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isScoring ? "Scoring..." : "Score transcript"}
                </button>
              </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card title="Redaction checklist">
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
              <li>Names, email addresses, phone numbers</li>
              <li>Client/company identifiers</li>
              <li>Secrets, keys, internal URLs</li>
              <li>Financials, contracts, legal details</li>
            </ul>
            <p className="mt-3 text-xs text-neutral-500">
              Scoring runs through /api/judge with an in-browser fallback when the API is unavailable.
            </p>
          </Card>

          <div className="mt-4">
            <Card title="Cheat sheet">
              <p className="text-sm text-neutral-700">
                This assessment uses an editable rubric. You can inspect it on the Cheat Sheet page.
              </p>
              <a href="/cheatsheet" className="btn-outline mt-3 inline-block px-3 py-1.5 text-sm">
                View rubric
              </a>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
