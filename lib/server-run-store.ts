import { promises as fs } from "node:fs";
import path from "node:path";
import type { Run } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".runtime");
const RUNS_FILE = path.join(DATA_DIR, "runs.json");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readRuns(): Promise<Record<string, Run>> {
  await ensureStore();
  try {
    const raw = await fs.readFile(RUNS_FILE, "utf8");
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Run>;
  } catch {
    return {};
  }
}

async function writeRuns(runs: Record<string, Run>) {
  await ensureStore();
  await fs.writeFile(RUNS_FILE, JSON.stringify(runs, null, 2), "utf8");
}

export async function saveRunServer(run: Run) {
  writeQueue = writeQueue.then(async () => {
    const runs = await readRuns();
    runs[run.run_id] = run;
    await writeRuns(runs);
  });
  await writeQueue;
}

export async function getRunServer(runId: string) {
  const runs = await readRuns();
  return runs[runId] ?? null;
}
