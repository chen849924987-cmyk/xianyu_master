import type {
  FeatureJobRunDetail,
  FeatureJobRunSummary,
  FeatureRow,
  FeatureRunDetailResponse,
  FeatureRunsListResponse,
  HookAgg,
  HookRunRow,
  HookUsageResponse,
  JobReportErrorOk,
  SessionMeta,
} from "@/api/types";

export async function fetchFeatures(): Promise<FeatureRow[]> {
  const r = await fetch("/api/features");
  if (!r.ok) return [];
  return (await r.json()) as FeatureRow[];
}

export async function fetchSession(): Promise<SessionMeta> {
  const r = await fetch("/api/session");
  return (await r.json()) as SessionMeta;
}

export async function fetchHookUsage(): Promise<
  { ok: true; aggregates: Record<string, HookAgg>; runs: HookRunRow[] } | { ok: false; error: string }
> {
  const r = await fetch("/api/hook-usage");
  const ct = r.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await r.text();
    const looksHtml = /<!DOCTYPE/i.test(text) || /<html[\s>]/i.test(text);
    return {
      ok: false,
      error: looksHtml
        ? "拿到的是 HTML 而非 API（常见原因：只开了 Vite、Express 未起）。请 npm run ui:dev 或 npm run ui:server。"
        : `非 JSON 响应（Content-Type: ${ct || "空"}）：${text.slice(0, 160)}`,
    };
  }
  const j = (await r.json()) as HookUsageResponse;
  if (!r.ok || !j.ok) {
    return { ok: false, error: ("error" in j && j.error) || `HTTP ${r.status}` };
  }
  return {
    ok: true,
    aggregates: j.aggregates ?? {},
    runs: Array.isArray(j.runs) ? j.runs : [],
  };
}

export async function postRunJob(featureId: string, headed: boolean): Promise<{ jobId: string } | { error: string }> {
  const r = await fetch("/api/jobs/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ featureId, headed }),
  });
  const j = (await r.json()) as { jobId?: string; error?: string };
  if (!r.ok) return { error: j.error ?? String(r.status) };
  if (!j.jobId) return { error: "missing jobId" };
  return { jobId: j.jobId };
}

export async function postSaveSessionJob(): Promise<{ jobId: string } | { error: string }> {
  const r = await fetch("/api/jobs/save-session", { method: "POST" });
  const j = (await r.json()) as { jobId?: string; error?: string };
  if (!r.ok) return { error: j.error ?? String(r.status) };
  if (!j.jobId) return { error: "missing jobId" };
  return { jobId: j.jobId };
}

export async function postSaveSessionConfirm(jobId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(`/api/jobs/${jobId}/save-session/confirm`, { method: "POST" });
  const j = (await r.json()) as { ok?: boolean; error?: string };
  if (!r.ok) return { ok: false, error: j.error ?? String(r.status) };
  return { ok: true };
}

export type JobReportErrorResult =
  | JobReportErrorOk
  | {
      ok: false;
      error: string;
      artifactDir?: string;
      tracePath?: string;
      videoDir?: string;
    };

/** 停止当前 UI 任务（SIGTERM），子进程关闭浏览器后写入 trace.zip 与 video/ */
export async function postJobReportError(jobId: string): Promise<JobReportErrorResult> {
  const r = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/report-error`, { method: "POST" });
  const j = (await r.json()) as Record<string, unknown>;
  if (j.ok === true && typeof j.artifactDir === "string" && typeof j.tracePath === "string" && typeof j.videoDir === "string") {
    return {
      ok: true,
      artifactDir: j.artifactDir,
      tracePath: j.tracePath,
      videoDir: j.videoDir,
      note: typeof j.note === "string" ? j.note : undefined,
    };
  }
  return {
    ok: false,
    error: typeof j.error === "string" ? j.error : `HTTP ${r.status}`,
    artifactDir: typeof j.artifactDir === "string" ? j.artifactDir : undefined,
    tracePath: typeof j.tracePath === "string" ? j.tracePath : undefined,
    videoDir: typeof j.videoDir === "string" ? j.videoDir : undefined,
  };
}

async function parseJsonResponse<T>(r: Response): Promise<T | null> {
  const ct = r.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return null;
  try {
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchFeatureRuns(featureId?: string): Promise<
  { ok: true; runs: FeatureJobRunSummary[] } | { ok: false; error: string }
> {
  const q = featureId ? `?featureId=${encodeURIComponent(featureId)}` : "";
  const r = await fetch(`/api/feature-runs${q}`);
  const j = await parseJsonResponse<FeatureRunsListResponse>(r);
  if (!j || typeof j !== "object") {
    return { ok: false, error: `非 JSON 或解析失败（HTTP ${r.status}）` };
  }
  if (!("ok" in j) || !j.ok) return { ok: false, error: ("error" in j && j.error) || `HTTP ${r.status}` };
  return { ok: true, runs: Array.isArray(j.runs) ? j.runs : [] };
}

export async function fetchFeatureRunDetail(
  id: string,
): Promise<{ ok: true; run: FeatureJobRunDetail } | { ok: false; error: string }> {
  const r = await fetch(`/api/feature-runs/${encodeURIComponent(id)}`);
  const j = await parseJsonResponse<FeatureRunDetailResponse>(r);
  if (!j || typeof j !== "object") {
    return { ok: false, error: `非 JSON 或解析失败（HTTP ${r.status}）` };
  }
  if (!("ok" in j) || !j.ok) return { ok: false, error: ("error" in j && j.error) || `HTTP ${r.status}` };
  if (!j.run || typeof j.run !== "object") return { ok: false, error: "missing run" };
  return { ok: true, run: j.run };
}
