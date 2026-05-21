/**
 * 记录 Cursor command hooks 调用次数与耗时，可选生成 Markdown 报告。
 * 数据：.data/hook-usage.json（gitignore）
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, string>} */
let HOOK_SCRIPT_DESCRIPTIONS = {};
try {
  HOOK_SCRIPT_DESCRIPTIONS = JSON.parse(readFileSync(join(__dirname, "hook-script-descriptions.json"), "utf8"));
} catch {
  HOOK_SCRIPT_DESCRIPTIONS = {};
}

function hookScriptDescription(scriptBasename) {
  return HOOK_SCRIPT_DESCRIPTIONS[scriptBasename] ?? "—";
}

const DATA_FILE = "hook-usage.json";
const MAX_RUNS = 300;

function envOn(key, defaultTrue) {
  const v = process.env[key];
  if (v === undefined || v === null || v === "") return defaultTrue;
  const s = String(v).trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(s)) return false;
  if (["1", "true", "yes", "on"].includes(s)) return true;
  return defaultTrue;
}

function mdPath(root) {
  const p = process.env.HARNESS_HOOK_USAGE_MD_PATH ?? "docs/hook-usage-report.md";
  if (isAbsolute(p)) return p;
  return join(root, p.replace(/^\//, ""));
}

export function shouldTrackHookUsage() {
  return envOn("HARNESS_HOOK_USAGE_TRACK", true);
}

function shouldWriteMarkdown() {
  return envOn("HARNESS_HOOK_USAGE_MD", true);
}

function loadState(root) {
  const p = join(root, ".data", DATA_FILE);
  if (!existsSync(p)) {
    return { version: 1, runs: [], aggregates: {} };
  }
  try {
    const j = JSON.parse(readFileSync(p, "utf8"));
    if (!j || typeof j !== "object") return { version: 1, runs: [], aggregates: {} };
    return {
      version: 1,
      runs: Array.isArray(j.runs) ? j.runs : [],
      aggregates: j.aggregates && typeof j.aggregates === "object" ? j.aggregates : {},
    };
  } catch {
    return { version: 1, runs: [], aggregates: {} };
  }
}

function saveState(root, state) {
  const dir = join(root, ".data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, DATA_FILE), JSON.stringify(state, null, 2), "utf8");
}

function aggKey(event, scriptBasename) {
  return `${event}::${scriptBasename}`;
}

const MAX_TRIGGER_DETAIL_JSON = 900;

/**
 * @param {unknown} detail
 */
function sanitizeTriggerDetail(detail) {
  if (!detail || typeof detail !== "object") return undefined;
  try {
    const s = JSON.stringify(detail);
    if (s.length <= MAX_TRIGGER_DETAIL_JSON) return /** @type {Record<string, unknown>} */ (detail);
    const d = /** @type {Record<string, unknown>} */ (detail);
    return {
      origin: d.origin,
      pipeline: d.pipeline,
      hook_event_arg: d.hook_event_arg,
      stdin_top_keys: d.stdin_top_keys,
      note: "trigger_detail 过长已裁剪；完整 stdin 仅存在于 Cursor 触发该 hook 时",
    };
  } catch {
    return undefined;
  }
}

/**
 * @param {string} root - 仓库根
 * @param {{ event: string, scriptRel: string, durationMs: number, exitCode: number, stderrTail?: string, triggerSummary?: string, triggerDetail?: Record<string, unknown> }} run
 */
export function recordHookRun(root, run) {
  if (!shouldTrackHookUsage()) return;

  const scriptBasename = run.scriptRel.replace(/^.*[/\\]/, "");
  const key = aggKey(run.event, scriptBasename);
  const state = loadState(root);

  const row = {
    at: new Date().toISOString(),
    event: run.event,
    script: scriptBasename,
    duration_ms: run.durationMs,
    exit_code: run.exitCode,
    ok: run.exitCode === 0,
  };
  const trig = run.triggerSummary != null ? String(run.triggerSummary).trim() : "";
  if (trig) row.trigger_summary = trig.slice(0, 400);
  const td = sanitizeTriggerDetail(run.triggerDetail);
  if (td) row.trigger_detail = td;
  if (run.stderrTail && run.exitCode !== 0) {
    row.stderr_tail = run.stderrTail.slice(0, 400);
  }

  state.runs.push(row);
  if (state.runs.length > MAX_RUNS) {
    state.runs = state.runs.slice(-MAX_RUNS);
  }

  const cur = state.aggregates[key] ?? {
    event: run.event,
    script: scriptBasename,
    invocations: 0,
    failures: 0,
    total_duration_ms: 0,
    last_at: null,
    last_exit_code: null,
  };
  cur.invocations += 1;
  cur.total_duration_ms += run.durationMs;
  if (run.exitCode !== 0) cur.failures += 1;
  cur.last_at = row.at;
  cur.last_exit_code = run.exitCode;
  state.aggregates[key] = cur;

  saveState(root, state);

  if (shouldWriteMarkdown()) {
    writeHookUsageMarkdown(root, state);
  }
}

function esc(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/** ISO → Asia/Shanghai（UTC+8）可读字符串 */
function formatAsiaShanghai(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(d)
      .replace(/\//g, "-");
  } catch {
    return String(iso);
  }
}

/**
 * @param {string} root
 * @param {ReturnType<typeof loadState>} state
 */
export function writeHookUsageMarkdown(root, state) {
  const outPath = mdPath(root);
  mkdirSync(dirname(outPath), { recursive: true });

  const keys = Object.keys(state.aggregates).sort((a, b) => {
    const ca = state.aggregates[a].invocations;
    const cb = state.aggregates[b].invocations;
    return cb - ca || a.localeCompare(b);
  });

  const summaryLines = [
    "| Cursor 事件 | Hook 脚本 | 说明 | 调用次数 | 失败次数 | 平均耗时 (ms) | 最近退出码 | 最近调用 (UTC+8) |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const k of keys) {
    const a = state.aggregates[k];
    const avg = a.invocations ? Math.round(a.total_duration_ms / a.invocations) : 0;
    summaryLines.push(
      `| ${esc(a.event)} | \`${esc(a.script)}\` | ${esc(hookScriptDescription(a.script))} | ${a.invocations} | ${a.failures} | ${avg} | ${a.last_exit_code ?? ""} | ${esc(a.last_at ? formatAsiaShanghai(a.last_at) : "")} |`,
    );
  }

  const recent = [...state.runs].reverse().slice(0, MAX_RUNS);
  const recentLines = [
    "",
    "## 最近调用（最多 300 条，新在上）",
    "",
    "| 时间 (UTC+8) | 事件 | 触发 | 脚本 | 说明 | 耗时 ms | 退出码 |",
    "| --- | --- | --- | --- | --- | ---: | ---: |",
  ];
  for (const r of recent) {
    const trig = typeof r.trigger_summary === "string" ? r.trigger_summary : "";
    recentLines.push(
      `| ${esc(formatAsiaShanghai(r.at))} | ${esc(r.event)} | ${esc(trig || "—")} | \`${esc(r.script)}\` | ${esc(hookScriptDescription(r.script))} | ${r.duration_ms} | ${r.exit_code} |`,
    );
  }

  const body = [
    "# Cursor Hooks 使用统计",
    "",
    "> **自动生成**：由 `harness/lib/run-hook.mjs` 包装各 hook 写入；关闭追踪：`HARNESS_HOOK_USAGE_TRACK=0`；仅 JSON 不写此文：`HARNESS_HOOK_USAGE_MD=0`。路径：`HARNESS_HOOK_USAGE_MD_PATH`。",
    "",
    `- **更新时间（UTC+8）**：${formatAsiaShanghai(new Date().toISOString())}`,
    `- **数据文件**：\`.data/hook-usage.json\`（不计入 git）`,
    "",
    "## 汇总（按调用次数降序）",
    "",
    ...summaryLines,
    ...recentLines,
    "",
  ].join("\n");

  writeFileSync(outPath, body, "utf8");
}
