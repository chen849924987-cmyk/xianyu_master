/**
 * 机器可读运行时状态（.data/harness-runtime.json）
 * 由 hooks 追加；勿提交；勿入向量索引（见 harness/README）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = "harness-runtime.json";
const MAX_EVENTS = 60;
const MAX_SUMMARY = 280;

function path(root) {
  return join(root, ".data", FILE);
}

function load(root) {
  const p = path(root);
  if (!existsSync(p)) {
    return {
      version: 1,
      schema: "doudian-master-runtime",
      updated_at: null,
      tool_failure_total: 0,
      recent_events: [],
    };
  }
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return {
      version: 1,
      schema: "doudian-master-runtime",
      updated_at: null,
      tool_failure_total: 0,
      recent_events: [],
    };
  }
}

function save(root, state) {
  const dir = join(root, ".data");
  mkdirSync(dir, { recursive: true });
  state.updated_at = new Date().toISOString();
  writeFileSync(path(root), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function trimSummary(s) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > MAX_SUMMARY ? `${t.slice(0, MAX_SUMMARY)}…` : t;
}

export function appendRuntimeEvent(root, event) {
  if (!root) return;
  const st = load(root);
  const ev = {
    at: new Date().toISOString(),
    ...event,
  };
  st.recent_events = st.recent_events || [];
  st.recent_events.push(ev);
  while (st.recent_events.length > MAX_EVENTS) st.recent_events.shift();
  save(root, st);
}

export function recordToolSuccess(root, { tool_name, tool_input, duration_ms }) {
  const name = String(tool_name || "unknown");
  let summary = name;
  if (name === "Shell" && tool_input?.command) {
    summary = `Shell: ${trimSummary(tool_input.command)}`;
  } else if (name === "Write" || name === "Read") {
    const fp =
      tool_input?.file_path || tool_input?.path || tool_input?.target_file || tool_input?.file;
    if (fp) summary = `${name}: ${trimSummary(fp)}`;
  } else if (tool_input && typeof tool_input === "object") {
    const keys = Object.keys(tool_input).slice(0, 4).join(",");
    summary = `${name}(${keys})`;
  }
  appendRuntimeEvent(root, {
    kind: "tool_ok",
    tool: name,
    summary,
    duration_ms: duration_ms ?? null,
  });
}

export function recordToolFailure(root, { tool_name, failure_type, error_message }) {
  const st = load(root);
  st.tool_failure_total = (st.tool_failure_total || 0) + 1;
  st.recent_events = st.recent_events || [];
  st.recent_events.push({
    at: new Date().toISOString(),
    kind: "tool_fail",
    tool: String(tool_name || "unknown"),
    failure_type: failure_type || null,
    summary: trimSummary(error_message || ""),
  });
  while (st.recent_events.length > MAX_EVENTS) st.recent_events.shift();
  save(root, st);
}
