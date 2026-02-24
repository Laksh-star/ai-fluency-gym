import type { Run } from "@/lib/types";

const KEY = "ai_fluency_runs_v1";

export function loadRuns(): Record<string, Run> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Run>;
  } catch {
    return {};
  }
}

export function saveRun(run: Run) {
  if (typeof window === "undefined") return;
  const runs = loadRuns();
  runs[run.run_id] = run;
  window.localStorage.setItem(KEY, JSON.stringify(runs));
}

export function getRun(runId: string): Run | null {
  const runs = loadRuns();
  return runs[runId] ?? null;
}

export function listRuns(): Run[] {
  return Object.values(loadRuns()).sort((a, b) => (a.created_at_iso < b.created_at_iso ? 1 : -1));
}
