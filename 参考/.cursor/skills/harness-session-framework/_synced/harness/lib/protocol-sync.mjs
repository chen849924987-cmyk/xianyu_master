/**
 * 每次用户收尾（beforeSubmitPrompt / harness:end）把摘要写入 AGENT_TASK_PROTOCOL.md「最后一次收尾」区块。
 */
import { replaceAutoSectionBody } from "./agent-protocol-md.mjs";

const MAX_PROMPT = 600;
const MAX_NOTE = 1200;
const MAX_DIGEST = 4500;

export function isProtocolSyncDisabled() {
  return process.env.HARNESS_SKIP_PROTOCOL_SYNC === "1";
}

function mdInline(s, max) {
  const t = String(s || "")
    .replace(/\r\n/g, "\n")
    .replace(/`/g, "'")
    .trim()
    .slice(0, max);
  return t ? `\`${t}\`` : "`(空)`";
}

/**
 * @param {object} p
 * @param {string} p.root
 * @param {string} p.timeStr
 * @param {string} p.prompt
 * @param {string} p.note
 * @param {string} p.headShort
 * @param {string} p.handoffTier
 * @param {string} [p.conversationId]
 * @param {string} [p.gitDigestMarkdown]
 */
export function syncTaskProtocolMarkdown(root, p) {
  if (isProtocolSyncDisabled() || !root) return;

  const prompt = String(p.prompt || "").slice(0, MAX_PROMPT);
  const note = String(p.note || "").slice(0, MAX_NOTE);
  const digest = String(p.gitDigestMarkdown || "").slice(0, MAX_DIGEST);
  const conv = p.conversationId ? String(p.conversationId).slice(0, 128) : "";

  const body = [
    `- **本地时间**：${mdInline(p.timeStr, 80)}`,
    `- **handoff_tier**：${mdInline(p.handoffTier || "fast", 40)}`,
    `- **session_prompt**：${mdInline(prompt, MAX_PROMPT)}`,
    `- **hook_note**：${mdInline(note, MAX_NOTE)}`,
    `- **head_short**：${mdInline(p.headShort || "", 40)}`,
    `- **conversation_id**：${mdInline(conv, 130)}`,
    "",
    "**git_digest_excerpt**",
    "",
    "```text",
    digest || "(无)",
    "```",
  ].join("\n");

  replaceAutoSectionBody(root, body);
}
