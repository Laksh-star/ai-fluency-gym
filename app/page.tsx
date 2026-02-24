import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

export default function HomePage() {
  return (
    <Container>
      <div className="mb-6 rounded-3xl border border-white/60 bg-white/65 p-6 shadow-[0_14px_36px_rgba(31,38,48,0.1)] backdrop-blur-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">AI Collaboration Practice Lab</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          AI Fluency Gym <span className="text-neutral-600">(4D)</span>
        </h1>
        <p className="tone-muted mt-3 max-w-2xl text-base">
          Measure how you collaborate with AI — not just what you produce. Two modes: score your pasted transcript, or run a guided challenge with hidden context unlocks.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge label="Privacy-first" />
          <Badge label="Research-inspired rubric" />
          <Badge label="Hidden context unlocks" />
          <Badge label="Artifact bias index" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="1) Transcript Score">
          <p className="text-sm text-neutral-700">
            Paste a redacted chat transcript. We detect fluency behaviors using an editable cheat sheet, show evidence quotes, and generate a practice plan.
          </p>
          <Link href="/transcript" className="btn-solid mt-4 inline-block px-4 py-2 text-sm">
            Start Transcript Score
          </Link>
        </Card>

        <Card title="2) Challenge Score">
          <p className="text-sm text-neutral-700">
            Pick a locked use case (coding, writing, research, ops). Chat to solve it. Hidden “missing context” cards unlock only if you ask the right questions.
          </p>
          <Link href="/challenges" className="btn-solid mt-4 inline-block px-4 py-2 text-sm">
            Start a Challenge
          </Link>
        </Card>
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_10px_24px_rgba(31,38,48,0.08)]">
        <h2 className="text-lg font-semibold">What you get</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Overall score (0–100%) and 4D sub-scores (Description, Delegation, Discernment, Diligence)</li>
          <li>Behavior checklist with evidence quotes from your own prompts</li>
          <li>“Artifact Bias Index” to catch the polished-output trap</li>
          <li>Personalized 7-day micro-practice plan + prompt templates</li>
          <li>Exportable “Director’s Cut” summary via Print/PDF</li>
        </ul>
      </div>
    </Container>
  );
}
