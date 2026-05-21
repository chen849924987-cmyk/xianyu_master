/**
 * 根目录 AGENT_TASK_PROTOCOL.md：意图锚点 + 提交记录 + 收尾自动摘要。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const PROTOCOL_MD = "AGENT_TASK_PROTOCOL.md";

export const MARK_INTENT_START = "<!-- harness:intent:start -->";
export const MARK_INTENT_END = "<!-- harness:intent:end -->";
export const MARK_COMMIT_START = "<!-- harness:commit-log:start -->";
export const MARK_COMMIT_END = "<!-- harness:commit-log:end -->";
export const MARK_COMMIT_DETAIL_START = "<!-- harness:commit-detail:start -->";
export const MARK_COMMIT_DETAIL_END = "<!-- harness:commit-detail:end -->";
export const MARK_AUTO_START = "<!-- harness:auto:start -->";
export const MARK_AUTO_END = "<!-- harness:auto:end -->";

function migrateLegacyIntentMarkers(raw) {
  const s = String(raw).replace(/\r\n/g, "\n");
  if (raw.includes(MARK_INTENT_START)) return raw;
  const anchor = "\n---\n\n## 提交记录";
  const i = s.indexOf(anchor);
  if (i === -1) return raw;
  const head = s.slice(0, i).trimEnd();
  const tail = s.slice(i);
  const cf = "\n## 当前功能";
  const j = head.indexOf(cf);
  if (j === -1) return raw;
  const preamble = head.slice(0, j).trimEnd();
  const intentBody = head.slice(j + 1).trim();
  return `${preamble}\n\n${MARK_INTENT_START}\n\n${intentBody}\n\n${MARK_INTENT_END}${tail}`;
}

const SNIPPET_TAIL = `

---

## 提交记录（自动生成）

每条对应一次 **git commit**（按时间顺序追加）。禁用：\`HARNESS_SKIP_COMMIT_PROTOCOL_LOG=1\` 或内部同步提交。

${MARK_COMMIT_START}

${MARK_COMMIT_END}

---

## 提交改动明细（自动生成 · commit session）

每次 **git commit** 后在下方追加一块 **可读改动会话**（默认：\`git show\` 的提交说明 + **--stat**）。需要 **完整 unified diff** 时：提交前设置环境变量 \`HARNESS_COMMIT_PROTOCOL_PATCH=1\`。禁用本节（仍保留单行「提交记录」）：\`HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL=1\`。

${MARK_COMMIT_DETAIL_START}

${MARK_COMMIT_DETAIL_END}

---

## 最后一次收尾（自动生成）

由 **npm run harness:end** 或收尾关键词触发；禁用本节：\`harness/harness.env\` 中 \`HARNESS_SKIP_PROTOCOL_SYNC=1\`。

${MARK_AUTO_START}

_尚无收尾记录。_

${MARK_AUTO_END}
`;

const DEFAULT_TEMPLATE = `# 任务协议（人类可读 · 热状态）

> Agent 每 session 开场阅读本文；「意图」可由 **afterAgentResponse** hook 根据助手文末 structured 块自动刷新（见 **harness/README.md**）。**切勿将此文件纳入语义/RAG 向量索引**。

与 **HANDOFF.json**、**.data/harness-runtime.json** 分工见 **harness/README.md**。

${MARK_INTENT_START}

## 当前功能

—

## 已完成

-

## 下一步

-

## 阻塞

-

## 备注

-

${MARK_INTENT_END}${SNIPPET_TAIL}
`;

export function ensureProtocolFile(root) {
  const path = join(root, PROTOCOL_MD);
  if (!existsSync(path)) {
    writeFileSync(path, DEFAULT_TEMPLATE, "utf8");
    return;
  }
  let s = readFileSync(path, "utf8");
  let changed = false;
  const migrated = migrateLegacyIntentMarkers(s);
  if (migrated !== s) {
    s = migrated;
    changed = true;
  }
  if (!s.includes(MARK_COMMIT_START) || !s.includes(MARK_COMMIT_END)) {
    s = s.trimEnd() + SNIPPET_TAIL;
    changed = true;
  }
  const detailAnchorsOk =
    s.includes(MARK_COMMIT_DETAIL_START) && s.includes(MARK_COMMIT_DETAIL_END);
  if (!detailAnchorsOk) {
    const anchor = "## 最后一次收尾（自动生成）";
    const idx = s.indexOf(anchor);
    if (idx !== -1) {
      const block = `\n\n---\n\n## 提交改动明细（自动生成 · commit session）\n\n每次 **git commit** 后在下方追加一块 **可读改动会话**（默认：提交说明 + **--stat**）。完整 unified diff：提交前设置 \`HARNESS_COMMIT_PROTOCOL_PATCH=1\`。禁用本节：\`HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL=1\`。\n\n${MARK_COMMIT_DETAIL_START}\n\n${MARK_COMMIT_DETAIL_END}\n\n`;
      s = s.slice(0, idx) + block + s.slice(idx);
      changed = true;
    }
  }
  if (!s.includes(MARK_AUTO_START) || !s.includes(MARK_AUTO_END)) {
    s = s.trimEnd() + `\n\n${MARK_AUTO_START}\n\n_尚无收尾记录。_\n\n${MARK_AUTO_END}\n`;
    changed = true;
  }
  if (changed) writeFileSync(path, s, "utf8");
}

/**
 * 在提交记录锚点内追加一行（时间顺序：旧在上、新在下）。
 */
export function appendCommitLogLine(root, line) {
  ensureProtocolFile(root);
  const path = join(root, PROTOCOL_MD);
  let s = readFileSync(path, "utf8");
  const i0 = s.indexOf(MARK_COMMIT_START);
  const i1 = s.indexOf(MARK_COMMIT_END);
  if (i0 === -1 || i1 === -1 || i1 < i0) {
    throw new Error(`${PROTOCOL_MD}: missing commit-log markers`);
  }
  const innerStart = i0 + MARK_COMMIT_START.length;
  const inner = s.slice(innerStart, i1).trimEnd();
  const addition = inner ? `${inner}\n${line}` : line;
  const next =
    s.slice(0, innerStart) + "\n\n" + addition + "\n\n" + s.slice(i1);
  writeFileSync(path, next, "utf8");
}

const COMMIT_DETAIL_MAX_CHARS = 200_000;

/**
 * 在「提交改动明细」锚点内追加一块（时间顺序与单行提交记录一致：旧在上、新在下）。
 */
export function appendCommitDetailBlock(root, sectionMarkdown) {
  ensureProtocolFile(root);
  const path = join(root, PROTOCOL_MD);
  let s = readFileSync(path, "utf8");
  const i0 = s.indexOf(MARK_COMMIT_DETAIL_START);
  const i1 = s.indexOf(MARK_COMMIT_DETAIL_END);
  if (i0 === -1 || i1 === -1 || i1 < i0) {
    throw new Error(`${PROTOCOL_MD}: missing commit-detail markers`);
  }
  const innerStart = i0 + MARK_COMMIT_DETAIL_START.length;
  const inner = s.slice(innerStart, i1).trimEnd();
  const addition = inner ? `${inner}\n\n---\n\n${sectionMarkdown}` : sectionMarkdown;
  const next =
    s.slice(0, innerStart) + "\n\n" + addition + "\n\n" + s.slice(i1);
  writeFileSync(path, next, "utf8");
}

/** @param {string} raw */
export function capCommitDetailText(raw) {
  const t = String(raw || "");
  if (t.length <= COMMIT_DETAIL_MAX_CHARS) return t;
  return `${t.slice(0, COMMIT_DETAIL_MAX_CHARS)}\n\n[truncated: ${t.length - COMMIT_DETAIL_MAX_CHARS} chars omitted]\n`;
}

/** 覆盖「意图」锚点内 Markdown（不动提交记录与收尾区） */
export function replaceIntentSectionBody(root, bodyMarkdown) {
  ensureProtocolFile(root);
  const path = join(root, PROTOCOL_MD);
  let s = readFileSync(path, "utf8");
  const i0 = s.indexOf(MARK_INTENT_START);
  const i1 = s.indexOf(MARK_INTENT_END);
  if (i0 === -1 || i1 === -1 || i1 < i0) {
    throw new Error(`${PROTOCOL_MD}: missing harness:intent markers`);
  }
  const innerStart = i0 + MARK_INTENT_START.length;
  const inner = String(bodyMarkdown || "").trim();
  const next =
    s.slice(0, innerStart) + "\n\n" + inner + "\n\n" + s.slice(i1);
  writeFileSync(path, next, "utf8");
}

/** 覆盖「最后一次收尾」锚点内 Markdown（不动上方意图区与提交记录） */
export function replaceAutoSectionBody(root, bodyMarkdown) {
  ensureProtocolFile(root);
  const path = join(root, PROTOCOL_MD);
  let s = readFileSync(path, "utf8");
  const i0 = s.indexOf(MARK_AUTO_START);
  const i1 = s.indexOf(MARK_AUTO_END);
  if (i0 === -1 || i1 === -1 || i1 < i0) {
    throw new Error(`${PROTOCOL_MD}: missing harness:auto markers`);
  }
  const innerStart = i0 + MARK_AUTO_START.length;
  const inner = String(bodyMarkdown || "").trim();
  const next =
    s.slice(0, innerStart) + "\n\n" + inner + "\n\n" + s.slice(i1);
  writeFileSync(path, next, "utf8");
}
