import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { rubric } from "@/lib/rubric";

export default function CheatSheetPage() {
  return (
    <Container>
      <h1 className="text-3xl font-semibold">Cheat Sheet (Rubric)</h1>
      <p className="tone-muted mt-2 max-w-3xl text-sm">
        This rubric is editable (JSON). The app detects behaviors from your prompts and uses them to compute 4D scores.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="4D dimensions">
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {Object.entries(rubric.dimensions).map(([k, v]) => (
              <li key={k}>
                <span className="font-medium">{k}</span>: {v.name} (weight {v.weight})
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            Discernment is weighted higher to counter “polished artifact bias”.
          </p>
        </Card>

        <Card title="Artifact Bias Index">
          <p className="text-sm text-neutral-700">
            Formula: <span className="font-mono">{rubric.artifact_bias.formula}</span>
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Thresholds: medium ≥ {rubric.artifact_bias.thresholds.medium}, high ≥ {rubric.artifact_bias.thresholds.high}
          </p>
          <p className="mt-3 text-xs text-neutral-500">
            If Description + Delegation outruns Discernment, you may be trusting “finished-looking” outputs too quickly.
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Behaviors (detected from user prompts)">
          <div className="space-y-3">
            {rubric.behaviors.map((b) => (
              <div key={b.id} className="rounded-2xl border border-[var(--border)] bg-white/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{b.id} — {b.name}</div>
                  <div className="text-xs text-neutral-500">
                    {b.dimension} • weight {b.weight}
                  </div>
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  Triggers: {b.heuristic_patterns.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Container>
  );
}
