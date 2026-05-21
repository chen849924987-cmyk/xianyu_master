/**
 * beforeSubmitPrompt：用户口令触发（类似「commit」），把后续文字解析后写入 AGENT_TASK_PROTOCOL.md 意图锚点。
 */
import { replaceIntentSectionBody } from "./agent-protocol-md.mjs";
import {
  extractAgentProtocolIntent,
  intentPayloadToMarkdown,
} from "./protocol-intent-from-response.mjs";
import { formatLocalTime } from "./git-utils.mjs";

/** 必须以这些前缀开头（整段 prompt 长度亦受限），避免误触 */
export const PROTOCOL_INTENT_USER_PHRASES = [
  "更新协议",
  "更新任务协议",
  "同步协议",
  "同步任务协议",
  "保存协议",
  "保存任务协议",
  "协议更新",
  "/protocol",
];

const MAX_USER_PROTOCOL_PROMPT = 8000;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isProtocolUserIntentDisabled() {
  return process.env.HARNESS_SKIP_PROTOCOL_USER_INTENT === "1";
}

export function shouldTriggerProtocolIntentFromUserPrompt(text) {
  if (isProtocolUserIntentDisabled()) return false;
  const t = String(text || "").trim();
  if (!t || t.length > MAX_USER_PROTOCOL_PROMPT) return false;
  for (const phrase of PROTOCOL_INTENT_USER_PHRASES) {
    const re = new RegExp(`^${escapeRegExp(phrase)}(\\s|$|[：:])`, "iu");
    if (re.test(t)) return true;
  }
  return false;
}

export function stripProtocolIntentTrigger(text) {
  const t = String(text || "").trim();
  for (const phrase of PROTOCOL_INTENT_USER_PHRASES) {
    const re = new RegExp(`^${escapeRegExp(phrase)}(\\s*[:：])?\\s*`, "iu");
    if (re.test(t)) return t.replace(re, "").trim();
  }
  return t;
}

const LABEL_LINE =
  /^\s*(当前功能|功能|已完成|完成步骤|下一步|阻塞|卡住|备注|Feature|Done|Completed|Next|Blocked|Notes)\s*[:：]\s*(.*)$/i;

function normalizeFieldKey(label) {
  const s = String(label).trim();
  if (/^(当前功能|功能)$/i.test(s) || /^feature$/i.test(s)) return "active_feature";
  if (/^(已完成|完成步骤)$/i.test(s) || /^(done|completed)$/i.test(s)) return "completed_steps";
  if (/^下一步$/i.test(s) || /^next$/i.test(s)) return "next_steps";
  if (/^(阻塞|卡住)$/i.test(s) || /^blocked$/i.test(s)) return "blocked_on";
  if (/^备注$/i.test(s) || /^notes$/i.test(s)) return "recent_notes";
  return null;
}

function splitInlineList(s) {
  const t = String(s || "").trim();
  if (!t) return [];
  if (/[,，;；、]/.test(t)) return t.split(/[,，;；、]/).map((x) => x.trim()).filter(Boolean);
  return [t];
}

/**
 * 解析「当前功能：…」多行自然语言 → intent payload
 * @returns {Record<string, unknown> | null}
 */
export function parseLabeledNaturalLanguage(body) {
  const raw = String(body || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return null;

  const lines = raw.split("\n");
  /** @type {{ active_feature: string; completed_steps: string[]; next_steps: string[]; blocked_on: string; recent_notes: string }} */
  const acc = {
    active_feature: "",
    completed_steps: [],
    next_steps: [],
    blocked_on: "",
    recent_notes: "",
  };

  /** @type {"active_feature"|"completed_steps"|"next_steps"|"blocked_on"|"recent_notes"|null} */
  let field = null;

  function appendListLine(line) {
    const t = line.replace(/^[-*•]\s*/, "").trim();
    if (!t) return;
    if (field === "completed_steps") acc.completed_steps.push(t);
    else if (field === "next_steps") acc.next_steps.push(t);
  }

  for (const line of lines) {
    const m = line.match(LABEL_LINE);
    if (m) {
      const key = normalizeFieldKey(m[1]);
      const rest = (m[2] || "").trim();
      if (!key) continue;
      field = key;
      if (key === "active_feature") acc.active_feature = rest;
      else if (key === "blocked_on") acc.blocked_on = rest;
      else if (key === "recent_notes") acc.recent_notes = rest;
      else if (key === "completed_steps") acc.completed_steps.push(...splitInlineList(rest));
      else if (key === "next_steps") acc.next_steps.push(...splitInlineList(rest));
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;
    if (field === "active_feature") acc.active_feature += (acc.active_feature ? " " : "") + trimmed;
    else if (field === "blocked_on") acc.blocked_on += (acc.blocked_on ? " " : "") + trimmed;
    else if (field === "recent_notes") acc.recent_notes += (acc.recent_notes ? "\n" : "") + trimmed;
    else if (field === "completed_steps" || field === "next_steps") appendListLine(trimmed);
  }

  const has =
    acc.active_feature ||
    acc.completed_steps.length ||
    acc.next_steps.length ||
    acc.blocked_on ||
    acc.recent_notes;
  if (!has) return null;
  return acc;
}

function tryParseJsonPayload(body) {
  const b = String(body || "").trim();
  if (!b.startsWith("{")) return null;
  try {
    const o = JSON.parse(b);
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

function fallbackPayload(body) {
  const t = String(body || "").trim();
  if (!t) return null;
  const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1) {
    return {
      active_feature: lines[0],
      completed_steps: [],
      next_steps: [],
      blocked_on: "—",
      recent_notes: "-",
    };
  }
  return {
    active_feature: "—",
    completed_steps: [],
    next_steps: [],
    blocked_on: "—",
    recent_notes: `**${formatLocalTime()}**（用户口令跟进）\n\n${t}`,
  };
}

/**
 * @returns {boolean} 是否写入了协议文件
 */
export function applyProtocolIntentFromUserPrompt(root, prompt) {
  if (!root || isProtocolUserIntentDisabled()) return false;
  const body = stripProtocolIntentTrigger(prompt);
  let payload = extractAgentProtocolIntent(body);
  if (!payload) payload = tryParseJsonPayload(body);
  if (!payload) payload = parseLabeledNaturalLanguage(body);
  if (!payload) payload = fallbackPayload(body);
  if (!payload || typeof payload !== "object") return false;

  replaceIntentSectionBody(root, intentPayloadToMarkdown(payload));
  return true;
}
