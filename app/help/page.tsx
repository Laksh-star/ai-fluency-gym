import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";

export default function HelpPage() {
  return (
    <Container>
      <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_14px_34px_rgba(31,38,48,0.1)] backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">Beginner Guide</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">How To Use AI Fluency Gym</h1>
        <p className="tone-muted mt-2 max-w-3xl text-sm">
          Quick version: ask good questions, gather missing context, then score your own prompting behavior.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Card title="Step 1: Choose mode">
          <p className="text-sm text-neutral-700">
            Use Transcript if you already have a chat log. Use Challenge if you want guided practice with hidden context cards.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/transcript" className="btn-outline px-3 py-1.5 text-xs">Transcript</Link>
            <Link href="/challenges" className="btn-outline px-3 py-1.5 text-xs">Challenge</Link>
          </div>
        </Card>

        <Card title="Step 2: Ask better questions">
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>Ask for baseline and definitions</li>
            <li>Ask for evidence/source quality</li>
            <li>Ask what else changed (confounders)</li>
          </ul>
        </Card>

        <Card title="Step 3: Score your attempt">
          <p className="text-sm text-neutral-700">
            Click score anytime. It evaluates what you asked so far, then gives strengths, gaps, and a practice plan.
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="What is being scored">
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>Your prompts and questions</li>
            <li>Your verification and uncertainty behavior</li>
            <li>Your missing-context detection (especially in challenges)</li>
          </ul>
        </Card>

        <Card title="What is NOT being scored">
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>Assistant writing style</li>
            <li>Whether assistant hints were perfect</li>
            <li>Whether you waited to the “end” to score</li>
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Challenge mode flow (simple)">
          <div className="space-y-2 text-sm text-neutral-700">
            <div className="surface-inset rounded-2xl p-3">You ask question</div>
            <div className="text-center text-xs text-neutral-500">↓</div>
            <div className="surface-inset rounded-2xl p-3">Assistant gives coaching hint</div>
            <div className="text-center text-xs text-neutral-500">↓</div>
            <div className="surface-inset rounded-2xl p-3">Hidden cards unlock if your question is good</div>
            <div className="text-center text-xs text-neutral-500">↓</div>
            <div className="surface-inset rounded-2xl p-3">You click score when ready</div>
          </div>
        </Card>

        <Card title="If replies feel repetitive">
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>Check backend mode under challenge chat</li>
            <li>`LLM` is best (provider call succeeded)</li>
            <li>`Fallback/Heuristic` can be more repetitive</li>
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            Tip: set OpenRouter key in `.env.local` and restart dev server.
          </p>
        </Card>
      </div>
    </Container>
  );
}
