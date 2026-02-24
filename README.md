# AI Fluency Gym (4D) — MVP

Educational AI fluency self-assessment inspired by the 4D framework and themes from the Anthropic AI Fluency Index:
- **D1 Description**
- **D2 Delegation**
- **D3 Discernment**
- **D4 Diligence**

Two modes:
1) **Transcript Score**: paste a redacted chat transcript → behavior detection + evidence quotes + 4D scores
2) **Challenge Score**: locked scenarios with **hidden context unlock cards** → measures “missing context” behavior

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

For end-user setup/run instructions and usage tips, see `USER_GUIDE.md`.
There is also an in-app beginner guide at `/help` (open via the Help button in the top nav).

## Configure API keys

1. Copy `.env.example` to `.env.local`
2. Set either `OPENROUTER_API_KEY` (recommended) or `OPENAI_API_KEY`
3. Optional: choose provider explicitly with `LLM_PROVIDER=openrouter|openai`
4. Restart `npm run dev`

## Data you can edit

- `data/fluency_taxonomy.json` — the rubric (cheat sheet)
- `data/challenges.json` — challenge library + hidden unlock card triggers

## Privacy

- Transcript mode: stores runs in `localStorage` for convenience.
- Challenge mode: turn handling + scoring run through server API routes, and scored runs are persisted in `.runtime/runs.json`.

## Server routes

- `POST /api/judge` - server-side rubric evaluation
- `POST /api/challenge/turn` - challenge turn response (OpenRouter/OpenAI LLM when key configured, heuristic fallback) + unlock detection
- `POST /api/challenge/score` - challenge scoring + run persistence
- `GET /api/runs/:runId` - load persisted run

## Notes

- This is **not** a validated scientific instrument. Use as an educational coaching tool.
- This is an independent app and **not** a replication of Anthropic's research pipeline or benchmark scores.
- The “Director’s Cut” export uses browser Print/PDF.
