import { promises as fs } from "node:fs";
import path from "node:path";
import type { Run } from "@/lib/types";

const DATA_DIR = process.env.VERCEL ? path.join("/tmp", ".runtime") : path.join(process.cwd(), ".runtime");
const RUNS_FILE = path.join(DATA_DIR, "runs.json");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

async function readRuns(): Promise<Record<string, Run>> {
  const storeReady = await ensureStore();
  if (!storeReady) return {};
  try {
    const raw = await fs.readFile(RUNS_FILE, "utf8");
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Run>;
  } catch {
    return {};
  }
}

async function writeRuns(runs: Record<string, Run>) {
  const storeReady = await ensureStore();
  if (!storeReady) return false;
  try {
    await fs.writeFile(RUNS_FILE, JSON.stringify(runs, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function saveRunServer(run: Run) {
  let persisted = false;
  // Recover queue after any prior failure so one error doesn't poison future writes.
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    const runs = await readRuns();
    runs[run.run_id] = run;
    persisted = await writeRuns(runs);
  });
  await writeQueue.catch(() => {});
  return persisted;
}

export async function getRunServer(runId: string) {
  try {
    const runs = await readRuns();
    return runs[runId] ?? null;
  } catch {
    return null;
  }
}
