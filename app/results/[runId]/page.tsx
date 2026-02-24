"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Bars4D, Radar4D } from "@/components/Charts";
import { getRun } from "@/lib/storage";
import type { Run } from "@/lib/types";

export default function ResultsPage() {
  const params = useParams<{ runId: string }>();
  const runId = params?.runId;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRun() {
      if (!runId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json() as { run: Run };
          if (!cancelled) {
            setRun(data.run);
            setLoading(false);
          }
          return;
        }
      } catch {
        // Fall through to local storage fallback.
      }

      const localRun = getRun(runId);
      if (!cancelled) {
        setRun(localRun);
        setLoading(false);
      }
    }

    void loadRun();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const summary = useMemo(() => {
    if (!run) return null;
    const r = run.result;
    const topStrengths = r.behaviors.filter((b) => b.present).slice(0, 3).map((b) => b.id);
    return { topStrengths };
  }, [run]);

  if (loading) {
    return (
      <Container>
        <h1 className="text-3xl font-semibold">Results</h1>
        <p className="mt-2 text-sm text-neutral-700">Loading run...</p>
      </Container>
    );
  }

  if (!run) {
    return (
      <Container>
        <h1 className="text-3xl font-semibold">Results</h1>
        <p className="mt-2 text-sm text-neutral-700">Run not found on server or in local storage. Try scoring again.</p>
      </Container>
    );
  }

  const r = run.result;

  return (
    <Container>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Results</h1>
          <p className="mt-1 text-sm text-neutral-700">
            Mode: <span className="font-medium">{run.mode}</span> • {new Date(run.created_at_iso).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-neutral-500 max-w-3xl">Disclaimer: Educational self-assessment; not a validated scientific instrument.</p>
        </div>
        <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="btn-outline px-4 py-2 text-sm"
            >
              Director’s Cut (Print/PDF)
            </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card title="Overall score">
          <div className="text-5xl font-semibold">{r.overall}%</div>
          <div className="mt-2 text-sm text-neutral-700">
            Artifact Bias Index: <span className="font-medium">{r.artifact_bias_index}</span> ({r.artifact_bias_label})
          </div>
          {r.meta.unlocks?.length ? (
            <div className="mt-2 text-xs text-neutral-500">
              Hidden context unlocked: {r.meta.unlocks.length}
            </div>
          ) : null}
        </Card>

        <Card title="4D radar">
          <Radar4D scores={r.dimension_scores} />
        </Card>

        <Card title="4D bars">
          <Bars4D scores={r.dimension_scores} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Missed opportunities (fast upgrades)">
          <div className="space-y-3">
            {r.missed_opportunities.map((m, i) => (
              <div key={i} className="surface-inset rounded-2xl p-3">
                <div className="text-sm font-semibold">{m.behavior_id}</div>
                <div className="mt-1 text-sm text-neutral-700">{m.why_it_matters}</div>
                <div className="mt-2 rounded-lg bg-white p-2 text-xs">{m.prompt_you_could_have_used}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Prompt library (personalized)">
          <div className="space-y-3">
            {r.prompt_library.map((p, i) => (
              <div key={i} className="surface-inset rounded-2xl p-3">
                <div className="text-sm font-semibold">{p.title}</div>
                <div className="mt-2 rounded-lg bg-white p-2 text-xs whitespace-pre-wrap">{p.template}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Behavior checklist (with evidence)">
          <div className="space-y-3">
            {r.behaviors.map((b) => (
              <div key={b.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{b.id}</div>
                  <div className="text-xs text-neutral-500">
                    {b.present ? `Present (conf ${b.confidence.toFixed(2)})` : "Not detected"}
                  </div>
                </div>
                {b.present && b.evidence.length ? (
                  <div className="mt-2 space-y-2">
                    {b.evidence.map((e, idx) => (
                      <div key={idx} className="surface-inset rounded-xl p-2 text-xs">
                        <div className="text-neutral-600">{e.why}</div>
                        <div className="mt-1 whitespace-pre-wrap">{e.quote}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-neutral-500">No evidence quote found.</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {r.meta.unlocks?.length ? (
        <div className="mt-4">
          <Card title="Unlock timeline (challenge mode)">
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
              {r.meta.unlocks.map((u, i) => (
                <li key={i}>
                  Unlocked <span className="font-medium">{u.card_id}</span> at user turn {u.at_turn} ({new Date(u.timestamp_iso).toLocaleTimeString()})
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      <div className="mt-4">
        <Card title="7-day micro-practice plan (5 min/day)">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
            {r.practice_plan.map((d) => (
              <li key={d.day}>
                <div className="font-medium">Day {d.day}: {d.task}</div>
                <div className="surface-inset mt-1 rounded-xl p-2 text-xs whitespace-pre-wrap">{d.template}</div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </Container>
  );
}
