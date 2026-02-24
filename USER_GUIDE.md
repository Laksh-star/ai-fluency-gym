# AI Fluency Gym User Guide

## What this app does

AI Fluency Gym helps users practice prompting and evaluation skills across 4 dimensions:
- D1 Description
- D2 Delegation
- D3 Discernment
- D4 Diligence

Important: scores reflect user prompting behavior, not assistant writing quality.
Important: this is a research-inspired coaching app, not a replication of Anthropic's AI Fluency Index methodology.

## Setup and run

1. Open a terminal in the project:
```bash
cd /Users/ln-mini/Downloads/ai-fluency-gym
```
2. Install dependencies:
```bash
npm install
```
3. Configure keys (optional but recommended for challenge chat quality):
```bash
cp .env.example .env.local
```
4. Edit `.env.local`:
```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=moonshotai/kimi-k2.5
```
5. Start the app:
```bash
npm run dev
```
6. Open:
`http://localhost:3000`

## How to use modes

### 1) Transcript Score
- Paste a redacted transcript.
- Click `Score transcript`.
- Review behavior detections, evidence quotes, missed opportunities, and practice plan.

### 2) Challenge Score
- Open `Challenges`, choose one scenario.
- Ask clarifying questions first.
- Look for hidden context cards unlocking on the right panel.
- Click `Score this attempt` when done.

## Why a score can be low

- Very short prompts with little detail.
- No verification/source requests.
- No uncertainty or checklist language.
- In challenge mode, no hidden-context unlocks.

## How to improve score quickly

- Ask for missing context: baseline, definitions, assumptions, confounders.
- Ask for evidence/sources and verification steps.
- Ask for uncertainty and what would change the conclusion.
- Request a short final QA/checklist pass.

## Backend mode indicators (Challenge mode)

Under the challenge chat, `Backend mode` shows:
- `LLM`: provider call succeeded.
- `Fallback`: provider configured but request failed, heuristic reply used.
- `Heuristic`: no API key configured.

## Troubleshooting

- If OpenRouter dashboard shows no activity, ensure you are testing Challenge mode (not Transcript mode).
- If key changes do not apply, restart `npm run dev`.
- If results page says run not found, rescore the attempt and reopen the new run URL.
