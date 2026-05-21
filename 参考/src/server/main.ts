/**
 * 本地控制台 API：默认仅监听 127.0.0.1（可用 UI_HOST / UI_PORT 覆盖）。
 */
import { config as loadEnv } from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { listFeatures, getFeature } from "../features/index.js";
import { getStorageStateMeta } from "../utils/storage-state-meta.js";
import {
  appendFeatureJobRun,
  getFeatureJobRun,
  listFeatureJobRuns,
} from "./feature-run-history.js";

/** 与 CLI 一致加载仓库根 `.env`，子进程 `spawn` 才能继承 XF_* 等变量 */
function skipRepoDotenv(): boolean {
  return ["1", "true", "yes", "on"].includes((process.env.DOUDIAN_SKIP_REPO_DOTENV ?? "").trim().toLowerCase());
}
if (!skipRepoDotenv()) {
  loadEnv({ path: path.join(process.cwd(), ".env") });
}

const UI_HOST = process.env.UI_HOST ?? "127.0.0.1";
const UI_PORT = Number(process.env.UI_PORT ?? "3847");
const repoRoot = process.cwd();

function tsxCliPath(): string {
  return path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
}

function cliTsPath(): string {
  return path.join(repoRoot, "src", "cli.ts");
}

type JobKind = "run" | "save";

/** `.data/hook-usage.json` 汇总项（与 harness/lib/hook-usage-tracker.mjs 一致） */
type HookAgg = {
  event: string;
  script: string;
  invocations: number;
  failures: number;
  total_duration_ms: number;
  last_at: string | null;
  last_exit_code: number | null;
};

type JobRecord = {
  kind: JobKind;
  jobId: string;
  featureId: string | null;
  headed: boolean;
  startedAt: string;
  proc: ChildProcess;
  chunks: string[];
  sse: Set<Response>;
  ended: boolean;
  exitCode: number | null;
  /** UI 调试：trace.zip + video/ */
  artifactDir: string | null;
};

const jobs = new Map<string, JobRecord>();

function broadcast(job: JobRecord, payload: Record<string, unknown>): void {
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of job.sse) {
    try {
      res.write(line);
    } catch {
      job.sse.delete(res);
    }
  }
}

function appendLog(job: JobRecord, text: string): void {
  job.chunks.push(text);
  broadcast(job, { type: "log", text });
}

function uiJobArtifactDir(jobId: string): string {
  return path.resolve(repoRoot, ".data", "ui-job-artifacts", jobId);
}

function spawnCli(
  args: string[],
  opts: { env?: NodeJS.ProcessEnv; stdio: ["ignore" | "pipe", "pipe", "pipe"] },
): ChildProcess {
  const tsx = tsxCliPath();
  if (!fs.existsSync(tsx)) {
    throw new Error("未找到 tsx，请先 npm install");
  }
  return spawn(process.execPath, [tsx, cliTsPath(), "--", ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...opts.env },
    stdio: opts.stdio,
  });
}

function attachIo(jobId: string, job: JobRecord): void {
  const { proc } = job;
  proc.stdout?.setEncoding("utf8");
  proc.stderr?.setEncoding("utf8");
  proc.stdout?.on("data", (d: string) => appendLog(job, d));
  proc.stderr?.on("data", (d: string) => appendLog(job, d));
  proc.on("close", (code) => {
    job.ended = true;
    job.exitCode = code ?? null;
    broadcast(job, { type: "end", exitCode: job.exitCode });
    try {
      const logText = job.chunks.join("");
      appendFeatureJobRun(repoRoot, {
        id: job.jobId,
        featureId: job.featureId ?? "save-session",
        kind: job.kind === "save" ? "save" : "run",
        headed: job.kind === "run" ? job.headed : undefined,
        startedAt: job.startedAt,
        endedAt: new Date().toISOString(),
        exitCode: job.exitCode,
        log: logText,
      });
    } catch (e) {
      console.error("[doudian-ui] feature-run-history append failed:", e);
    }
    for (const res of job.sse) {
      try {
        res.end();
      } catch {
        /* ignore */
      }
    }
    job.sse.clear();
    setTimeout(() => jobs.delete(jobId), 120_000);
  });
}

function killAllJobs(): void {
  for (const [, job] of jobs) {
    try {
      job.proc.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
  jobs.clear();
}

async function main(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.get("/api/features", (_req, res) => {
    const rows = listFeatures().map((f) => ({ id: f.id, displayName: f.displayName }));
    res.json(rows);
  });

  app.get("/api/session", (_req, res) => {
    res.json(getStorageStateMeta());
  });

  app.get("/api/feature-runs", (req, res) => {
    try {
      const q = String(req.query.featureId ?? "").trim();
      const rows = listFeatureJobRuns(repoRoot, q || undefined);
      res.json({ ok: true as const, runs: rows });
    } catch (e) {
      res.status(500).json({ ok: false as const, error: String(e) });
    }
  });

  app.get("/api/feature-runs/:id", (req, res) => {
    try {
      const row = getFeatureJobRun(repoRoot, req.params.id);
      if (!row) {
        res.status(404).json({ ok: false as const, error: "not found" });
        return;
      }
      res.json({ ok: true as const, run: row });
    } catch (e) {
      res.status(500).json({ ok: false as const, error: String(e) });
    }
  });

  app.get("/api/hook-usage", (_req, res) => {
    const p = path.join(repoRoot, ".data", "hook-usage.json");
    try {
      if (!fs.existsSync(p)) {
        res.json({ ok: true as const, version: 1, runs: [], aggregates: {} });
        return;
      }
      const raw = fs.readFileSync(p, "utf8");
      const parsed = JSON.parse(raw) as {
        version?: number;
        runs?: unknown[];
        aggregates?: Record<string, unknown>;
      };
      const runs = Array.isArray(parsed.runs) ? parsed.runs : [];
      const aggregates =
        parsed.aggregates && typeof parsed.aggregates === "object"
          ? (parsed.aggregates as Record<string, HookAgg>)
          : {};
      res.json({
        ok: true as const,
        version: typeof parsed.version === "number" ? parsed.version : 1,
        runs,
        aggregates,
      });
    } catch (e) {
      res.status(500).json({ ok: false as const, error: String(e) });
    }
  });

  app.post("/api/jobs/run", (req, res) => {
    const featureId = String(req.body?.featureId ?? "").trim();
    const headed = Boolean(req.body?.headed);
    if (!featureId || !getFeature(featureId)) {
      res.status(400).json({ error: "unknown or missing featureId" });
      return;
    }
    const jobId = randomUUID();
    const artifactDir = uiJobArtifactDir(jobId);
    fs.mkdirSync(artifactDir, { recursive: true });
    let proc: ChildProcess;
    try {
      proc = spawnCli([`--feature=${featureId}`], {
        env: {
          PLAYWRIGHT_HEADED: headed ? "1" : "0",
          DOUDIAN_UI_ARTIFACT_DIR: artifactDir,
          DOUDIAN_UI_JOB_ID: jobId,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
      return;
    }
    const startedAt = new Date().toISOString();
    const job: JobRecord = {
      kind: "run",
      jobId,
      featureId: featureId,
      headed,
      startedAt,
      proc,
      chunks: [],
      sse: new Set(),
      ended: false,
      exitCode: null,
      artifactDir,
    };
    jobs.set(jobId, job);
    attachIo(jobId, job);
    res.json({ jobId });
  });

  app.post("/api/jobs/save-session", (_req, res) => {
    const jobId = randomUUID();
    const artifactDir = uiJobArtifactDir(jobId);
    fs.mkdirSync(artifactDir, { recursive: true });
    let proc: ChildProcess;
    try {
      proc = spawnCli(["--save-session"], {
        env: {
          PLAYWRIGHT_HEADED: "1",
          DOUDIAN_UI_ARTIFACT_DIR: artifactDir,
          DOUDIAN_UI_JOB_ID: jobId,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
      return;
    }
    const startedAt = new Date().toISOString();
    const job: JobRecord = {
      kind: "save",
      jobId,
      featureId: null,
      headed: true,
      startedAt,
      proc,
      chunks: [],
      sse: new Set(),
      ended: false,
      exitCode: null,
      artifactDir,
    };
    jobs.set(jobId, job);
    attachIo(jobId, job);
    res.json({ jobId });
  });

  app.post("/api/jobs/:jobId/report-error", (req, res) => {
    const jobId = req.params.jobId;
    const job = jobs.get(jobId);
    if (!job) {
      res.status(404).json({ error: "job not found" });
      return;
    }
    const artifactDir = job.artifactDir ?? uiJobArtifactDir(job.jobId);
    const tracePath = path.join(artifactDir, "trace.zip");
    const videoDir = path.join(artifactDir, "video");
    if (job.ended) {
      res.status(400).json({
        error: "job already ended",
        artifactDir,
        tracePath,
        videoDir,
      });
      return;
    }
    try {
      job.proc.kill("SIGTERM");
    } catch (e) {
      res.status(500).json({ error: String(e) });
      return;
    }
    res.json({
      ok: true as const,
      artifactDir,
      tracePath,
      videoDir,
      note: "子进程收到停止信号后将关闭浏览器：trace.zip 与 video/*.webm 在进程退出后就绪（若使用 Edge 持久化导出登录态则可能无 trace）。",
    });
  });

  app.post("/api/jobs/:jobId/save-session/confirm", (req, res) => {
    const jobId = req.params.jobId;
    const job = jobs.get(jobId);
    if (!job || job.kind !== "save") {
      res.status(404).json({ error: "job not found or not save-session" });
      return;
    }
    if (job.ended) {
      res.status(400).json({ error: "job already ended" });
      return;
    }
    try {
      job.proc.stdin?.write("\n");
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/jobs/:jobId/logs", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: "job not found" });
      return;
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    for (const text of job.chunks) {
      res.write(`data: ${JSON.stringify({ type: "log", text })}\n\n`);
    }
    if (job.ended) {
      res.write(`data: ${JSON.stringify({ type: "end", exitCode: job.exitCode })}\n\n`);
      res.end();
      return;
    }
    job.sse.add(res);
    req.on("close", () => {
      job.sse.delete(res);
    });
  });

  const webDist = path.join(repoRoot, "web", "dist");
  const webIndex = path.join(webDist, "index.html");
  if (fs.existsSync(webDist) && fs.existsSync(webIndex)) {
    app.use(express.static(webDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(webIndex);
    });
  }

  app.listen(UI_PORT, UI_HOST, () => {
    console.log(`[doudian-ui] http://${UI_HOST}:${UI_PORT}`);
  });

  process.on("SIGINT", () => {
    killAllJobs();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    killAllJobs();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
