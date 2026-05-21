export type FeatureRow = { id: string; displayName: string };

export type SessionMeta = {
  path: string;
  exists: boolean;
  validJson: boolean;
  size: number | null;
  parseError?: string;
};

export type HookAgg = {
  event: string;
  script: string;
  invocations: number;
  failures: number;
  total_duration_ms: number;
  last_at: string | null;
  last_exit_code: number | null;
};

/** 与 harness 写入的 `trigger_detail` 对齐：可追溯 stdin 里的关键字段 */
export type HookTriggerDetail = {
  origin?: string;
  pipeline?: string;
  hook_event_arg?: string;
  stdin_top_keys?: string[];
  facets?: Record<string, string>;
  stdin_preview?: string;
  note?: string;
  /** stdin 非完整 JSON 时的说明（与 harness `parse_note` 对齐） */
  parse_note?: string;
};

export type HookRunRow = {
  at: string;
  event: string;
  script: string;
  duration_ms: number;
  exit_code: number;
  ok?: boolean;
  /** 提示词 / Shell / 工具名与参数摘要等（run-hook 从 stdin 解析） */
  trigger_summary?: string;
  /** 结构化来源：Cursor stdin JSON 中的字段，便于对照「摘要 ← 原始载荷」 */
  trigger_detail?: HookTriggerDetail;
};

export type HookUsageResponse =
  | { ok: true; version?: number; aggregates?: Record<string, HookAgg>; runs?: HookRunRow[] }
  | { ok: false; error?: string };

export type FeatureJobKind = "run" | "save";

/** 列表接口不含完整 log，仅有预览段 */
export type FeatureJobRunSummary = {
  id: string;
  featureId: string;
  kind: FeatureJobKind;
  headed?: boolean;
  startedAt: string;
  endedAt: string;
  exitCode: number | null;
  logChars: number;
  logPreview: string;
};

export type FeatureJobRunDetail = {
  id: string;
  featureId: string;
  kind: FeatureJobKind;
  headed?: boolean;
  startedAt: string;
  endedAt: string;
  exitCode: number | null;
  log: string;
};

export type FeatureRunsListResponse = { ok: true; runs: FeatureJobRunSummary[] } | { ok: false; error?: string };

export type FeatureRunDetailResponse = { ok: true; run: FeatureJobRunDetail } | { ok: false; error?: string };

/** POST /api/jobs/:jobId/report-error 成功时返回本地绝对路径（Windows 下为反斜杠） */
export type JobReportErrorOk = {
  ok: true;
  artifactDir: string;
  tracePath: string;
  videoDir: string;
  note?: string;
};
