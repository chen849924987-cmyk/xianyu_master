/**
 * 从助手全文里解析 <agent_protocol_intent> JSON，写入 AGENT_TASK_PROTOCOL.md 意图锚点区。
 */
import { replaceIntentSectionBody } from "./agent-protocol-md.mjs";

const TAG_RE =
  /<agent_protocol_intent\b[^>]*>([\s\S]*?)<\/agent_protocol_intent>/i;
const MAX_INNER = 12_000;

export function isProtocolIntentSyncDisabled() {
  return process.env.HARNESS_SKIP_PROTOCOL_INTENT_SYNC === "1";
}

function normalizeList(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const s = String(v).trim();
  return s ? [s] : [];
}

function bulletBlock(items) {
  if (!items.length) return "-";
  return items.map((x) => `- ${x}`).join("\n");
}

/** @param {Record<string, unknown>} o */
export function intentPayloadToMarkdown(o) {
  const af = String(o.active_feature ?? o.current_feature ?? "").trim() || "—";
  const cs = normalizeList(o.completed_steps ?? o.completed);
  const ns = normalizeList(o.next_steps ?? o.next);
  const bo = String(o.blocked_on ?? o.blocked ?? "").trim() || "—";
  const rnRaw = o.recent_notes ?? o.notes;
  let notesMd;
  if (Array.isArray(rnRaw)) {
    const ln = normalizeList(rnRaw);
    notesMd = ln.length ? bulletBlock(ln) : "-";
  } else {
    notesMd = String(rnRaw ?? "").trim() || "-";
  }

  return [
    "## 当前功能",
    "",
    af,
    "",
    "## 已完成",
    "",
    bulletBlock(cs),
    "",
    "## 下一步",
    "",
    bulletBlock(ns),
    "",
    "## 阻塞",
    "",
    bo,
    "",
    "## 备注",
    "",
    notesMd,
  ].join("\n");
}

export function extractAgentProtocolIntent(text) {
  const m = String(text || "").match(TAG_RE);
  if (!m) return null;
  let inner = m[1].trim();
  if (inner.length > MAX_INNER) inner = inner.slice(0, MAX_INNER);
  try {
    return JSON.parse(inner);
  } catch {
    return null;
  }
}

/**
 * 若文本内含合法 `<agent_protocol_intent>{...}</agent_protocol_intent>`，则更新协议文件意图区。
 * @returns {boolean} 是否已写入
 */
export function tryApplyProtocolIntentFromAssistantText(root, text) {
  if (!root || !text || isProtocolIntentSyncDisabled()) return false;
  const payload = extractAgentProtocolIntent(text);
  if (!payload || typeof payload !== "object") return false;
  replaceIntentSectionBody(root, intentPayloadToMarkdown(payload));
  return true;
}
