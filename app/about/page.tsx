import { Container } from "@/components/Container";
import { Card } from "@/components/Card";

export default function AboutPage() {
  return (
    <Container>
      <h1 className="text-3xl font-semibold">About</h1>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Method (MVP)">
          <p className="text-sm text-neutral-700">
            This is an educational self-assessment inspired by the 4D framework (Description, Delegation, Discernment, Diligence) and themes from the
            Anthropic AI Fluency Index report.
          </p>
          <p className="mt-3 text-sm text-neutral-700">
            It is an independent coaching tool, not a replication of Anthropic&apos;s research methodology or benchmark scores. The MVP uses heuristic signal
            detection over your prompts, extracts evidence quotes, and scores dimensions with Discernment weighted higher.
          </p>
        </Card>

        <Card title="Privacy">
          <p className="text-sm text-neutral-700">
            Transcript mode stores runs in your browser (localStorage). Challenge mode uses server API routes and stores scored runs in
            <span className="font-mono"> .runtime/runs.json</span> so results pages can be reopened.
          </p>
          <p className="mt-3 text-sm text-neutral-700">
            If an LLM provider key is configured, challenge turn text is sent to that provider for assistant replies. Without a key, the app uses heuristic
            fallback responses.
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="What this is NOT">
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>Not a scientifically validated psychometric test</li>
            <li>Not a guarantee of work quality or professional performance</li>
            <li>Not a replacement for domain expertise and review</li>
          </ul>
        </Card>
      </div>
    </Container>
  );
}
