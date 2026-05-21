/**
 * 控制台触发的 CLI 任务运行记录（落盘 .data，不计入 git）
 */
import fs from "node:fs";
import path from "node:path";

const FILE_NAME = "feature-job-history.json";
const MAX_RUNS = 350;
const MAX_LOG_CHARS = 96 * 1024;

export type FeatureJobKind = "run" | "save";

export type FeatureJobRunStored = {
  id: string;
  featureId: string;
  kind: FeatureJobKind;
  headed?: boolean;
  startedAt: string;
  endedAt: string;
  exitCode: number | null;
  log: string;
};

type HistoryState = { version: 1; runs: FeatureJobRunStored[] };

function filePath(repoRoot: string): string {
  return path.join(repoRoot, ".data", FILE_NAME);
}

function load(repoRoot: string): HistoryState {
  const p = filePath(repoRoot);
  try {
    if (!fs.existsSync(p)) return { version: 1, runs: [] };
    const raw = fs.readFileSync(p, "utf8");
    const j = JSON.parse(raw) as HistoryState;
    if (!j || typeof j !== "object") return { version: 1, runs: [] };
    return {
      version: 1,
      runs: Array.isArray(j.runs) ? j.runs : [],
    };
  } catch {
    return { version: 1, runs: [] };
  }
}

function save(repoRoot: string, state: HistoryState): void {
  const p = filePath(repoRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(state, null, 2), "utf8");
}

export function appendFeatureJobRun(repoRoot: string, row: FeatureJobRunStored): void {
  const log =
    row.log.length > MAX_LOG_CHARS ? row.log.slice(row.log.length - MAX_LOG_CHARS) : row.log;
  const normalized: FeatureJobRunStored = { ...row, log };
  const state = load(repoRoot);
  state.runs.push(normalized);
  if (state.runs.length > MAX_RUNS) {
    state.runs = state.runs.slice(-MAX_RUNS);
  }
  save(repoRoot, state);
}

export type FeatureJobRunSummary = Omit<FeatureJobRunStored, "log"> & {
  logChars: number;
  logPreview: string;
};

export function summarizeRun(r: FeatureJobRunStored): FeatureJobRunSummary {
  const { log, ...rest } = r;
  return {
    ...rest,
    logChars: log.length,
    logPreview: log.length <= 900 ? log : log.slice(-900),
  };
}

/** 新在前 */
export function listFeatureJobRuns(repoRoot: string, featureId?: string): FeatureJobRunSummary[] {
  let runs = load(repoRoot).runs;
  if (featureId && featureId.trim()) {
    runs = runs.filter((r) => r.featureId === featureId.trim());
  }
  return [...runs].reverse().map(summarizeRun);
}

export function getFeatureJobRun(repoRoot: string, id: string): FeatureJobRunStored | null {
  const run = load(repoRoot).runs.find((r) => r.id === id);
  return run ?? null;
}
