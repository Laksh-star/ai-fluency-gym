import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import challenges from "@/data/challenges.json";
import type { Challenge } from "@/lib/types";

export default function ChallengesPage() {
  const list = challenges as Challenge[];
  const tracks = Array.from(new Set(list.map((c) => c.track)));

  return (
    <Container>
      <h1 className="text-3xl font-semibold">Challenges</h1>
      <p className="tone-muted mt-2 max-w-3xl text-sm">
        Pick a locked use case. You’ll “chat” to solve it. Hidden missing-context cards unlock only if you ask the right questions.
      </p>

      {tracks.map((track) => (
        <div key={track} className="mt-6">
          <h2 className="text-lg font-semibold">{track}</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {list.filter((c) => c.track === track).map((c) => (
              <Card key={c.id} title={c.title}>
                <p className="text-sm text-neutral-700">{c.brief}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{c.hidden_context_cards.length} hidden context cards</span>
                  <Link href={`/challenge/${c.id}`} className="btn-solid px-4 py-2 text-sm">
                    Start
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </Container>
  );
}
