import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { PROMPT_LIBRARY } from "@/lib/recommendations";

export default function PromptsPage() {
  return (
    <Container>
      <h1 className="text-3xl font-semibold">Prompt Library</h1>
      <p className="tone-muted mt-2 max-w-3xl text-sm">
        Copy/paste templates designed to increase Discernment and Diligence — especially for polished artifacts.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {PROMPT_LIBRARY.map((p) => (
          <Card key={p.title} title={p.title}>
            <div className="surface-inset rounded-2xl p-3 text-xs whitespace-pre-wrap">{p.template}</div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
