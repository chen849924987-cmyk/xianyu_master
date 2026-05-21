/**
 * 用户收尾（beforeSubmitPrompt / CLI）与 Agent 轮次结束（stop）共享逻辑
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { git, isGitRepo, hasChanges, formatLocalTime } from "./git-utils.mjs";
import {
  shouldThrottleUserSessionEnd,
  recordUserSessionEnd,
} from "./debounce.mjs";
import { ensureMissingTodolistRows } from "./todolist-auto-add.mjs";
import {
  getVerifyBlockReason,
  readVerifyEvidence,
} from "./verify-evidence.mjs";
import { syncTaskProtocolMarkdown } from "./protocol-sync.mjs";

export { formatLocalTime };

const LAST_RESPONSE_MAX = 12_000;
const LAST_RESPONSE_FILE = "harness-last-response.json";

/** 手动追加收尾用语：整句为这些词之一（后面可有逗号、句号、空格等）即触发 commit */
export const SESSION_END_PHRASES = [
  "完成",
  "完成了",
  "结束",
  "结束了",
  "搞定",
  "搞定了",
  "收尾",
  "先这样",
  "先到这",
  "好了",
  "好的，结束",
  "好的，完成",
  "好的，搞定",
  "done",
  "finished",
  "ok",
  "commit",
];

const MAX_PROMPT_LEN = 48;
const MAX_PROMPT_LEN_WITH_TASK_ID = 120;
const SHORT_PROMPT_MAX_LEN = 12;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractTaskIds(text) {
  const re = /\b([1-9]\d*)\.(\d{1,2})\b/g;
  const seen = new Set();
  const ids = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const major = Number(m[1], 10);
    const minor = Number(m[2], 10);
    if (major < 1 || major > 9 || minor < 1 || minor > 99) continue;
    const id = `${major}.${minor}`;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function applyTodolistProgress(root, ids, timeStr, opts = {}) {
  const path = join(root, "AGENT_TODOLIST.md");
  const result = { updated: [], skipped: [] };
  if (!ids.length) return result;
  if (!existsSync(path)) {
    for (const id of ids) result.skipped.push(`${id}(无AGENT_TODOLIST.md)`);
    return result;
  }

  let content = readFileSync(path, "utf8");
  const lines = content.split(/\r?\n/);
  const idSet = new Set(ids);
  const rowOpenRe = /^\| \[ \] \| (\d+)\.(\d+)\s(.+?) \| ([^|]*)\|\s*$/;

  const out = lines.map((line) => {
    const m = line.match(rowOpenRe);
    if (!m) return line;
    const id = `${m[1]}.${m[2]}`;
    if (!idSet.has(id)) return line;
    const taskBody = m[3];
    result.updated.push(id);
    return `| [x] | ${id} ${taskBody} | ${timeStr} |`;
  });

  const updatedSet = new Set(result.updated);
  for (const id of ids) {
    if (updatedSet.has(id)) continue;
    const hasOpen = lines.some((line) => {
      const mm = line.match(/^\| \[ \] \| (\d+)\.(\d+)\s/);
      return mm && `${mm[1]}.${mm[2]}` === id;
    });
    const hasDone = lines.some((line) => {
      const mm = line.match(/^\| \[x\] \| (\d+)\.(\d+)\s/);
      return mm && `${mm[1]}.${mm[2]}` === id;
    });
    if (hasDone) result.skipped.push(`${id}(已是[x])`);
    else if (!hasOpen) result.skipped.push(`${id}(无匹配行)`);
  }

  content = out.join("\n");
  const footerPrefix = String(opts?.footerPrefix || "").trim();
  const hookNote = result.updated.length
    ? `Hook 勾选 TODOLIST：${result.updated.join("、")}`
    : ids.length
      ? `Hook：未勾选（序号无匹配行或已为 [x]）：${ids.join("、")}`
      : "";
  const combined = [footerPrefix, hookNote].filter(Boolean).join("；");
  if (combined) {
    content = content.replace(
      /\*最后整体更新：[^*]*\*/,
      `*最后整体更新：${timeStr}（${combined}）*`,
    );
    if (!content.includes("*最后整体更新：")) {
      content = `${content.trimEnd()}\n\n*最后整体更新：${timeStr}（${combined}）*\n`;
    }
  }

  writeFileSync(path, content, "utf8");
  return result;
}

export function shouldTriggerCommit(text) {
  const t = text.trim();
  if (!t) return false;
  const hasTaskId = extractTaskIds(t).length > 0;
  const maxLen = hasTaskId ? MAX_PROMPT_LEN_WITH_TASK_ID : MAX_PROMPT_LEN;
  if (t.length > maxLen) return false;

  for (const phrase of SESSION_END_PHRASES) {
    const re = new RegExp(`^${escapeRegExp(phrase)}[，,。.!！\\s…]*$`, "iu");
    if (re.test(t)) return true;
  }

  if (t.length <= SHORT_PROMPT_MAX_LEN) {
    const lower = t.toLowerCase();
    for (const phrase of SESSION_END_PHRASES) {
      if (lower.includes(phrase.toLowerCase())) return true;
    }
  }

  return false;
}

function readSessionAnchor(root) {
  try {
    return readFileSync(
      join(root, ".data", "session-log-anchor"),
      "utf8",
    ).trim();
  } catch {
    return "";
  }
}

function writeSessionAnchor(root, fullHead) {
  if (!fullHead) return;
  mkdirSync(join(root, ".data"), { recursive: true });
  writeFileSync(
    join(root, ".data", "session-log-anchor"),
    `${fullHead}\n`,
    "utf8",
  );
}

function buildGitSummaryMarkdown(root, anchorBefore) {
  const parts = [];
  const st = git(root, ["status", "-sb"], true);
  parts.push("#### `git status -sb`", "", "```text", st || "(空)", "```");

  const head = git(root, ["rev-parse", "HEAD"], true);
  if (!head) {
    parts.push("", "_无法解析 HEAD。_");
    return parts.join("\n");
  }

  if (anchorBefore && anchorBefore !== head) {
    const rlog = git(
      root,
      [
        "log",
        `${anchorBefore}..HEAD`,
        "--oneline",
        "--no-decorate",
        "-n",
        "100",
      ],
      true,
    );
    parts.push(
      "",
      `#### 自上一 Session 起的新提交（\`${anchorBefore.slice(0, 7)}…→${head.slice(0, 7)}\`）`,
      "",
      "```text",
      rlog || "(无)",
      "```",
    );
    const stat = git(root, ["diff", `${anchorBefore}..HEAD`, "--stat"], true);
    if (stat) {
      parts.push(
        "",
        "#### 上述提交的累计 `diff --stat`",
        "",
        "```text",
        stat,
        "```",
      );
    }
  } else {
    const recent = git(
      root,
      ["log", "-15", "--oneline", "--no-decorate"],
      true,
    );
    const hint = anchorBefore
      ? "*锚点与 HEAD 一致（自上次记录以来尚未产生新提交）*"
      : "*无本地锚点（首次在本机收尾，或已删除 .data/session-log-anchor）*";
    parts.push(
      "",
      `${hint} **最近 15 条提交：**`,
      "",
      "```text",
      recent || "(空)",
      "```",
    );
  }

  const unstaged = git(root, ["diff", "--stat"], true);
  if (unstaged) {
    parts.push(
      "",
      "#### 收尾后仍有「未暂存」变更",
      "",
      "```text",
      unstaged,
      "```",
    );
  }
  const staged = git(root, ["diff", "--cached", "--stat"], true);
  if (staged) {
    parts.push("", "#### 收尾后「暂存区」变更", "", "```text", staged, "```");
  }

  return parts.join("\n");
}

function collectTouchedFiles(root, anchorBefore, headFull) {
  const files = new Set();
  if (!isGitRepo(root) || !headFull) return [];
  const addChunk = (chunk) => {
    for (const line of String(chunk).split("\n")) {
      const t = line.trim().replace(/\\/g, "/");
      if (t) files.add(t);
    }
  };
  if (anchorBefore && anchorBefore !== headFull) {
    addChunk(git(root, ["diff", "--name-only", `${anchorBefore}..HEAD`], true));
  }
  addChunk(git(root, ["diff", "--name-only"], true));
  addChunk(git(root, ["diff", "--cached", "--name-only"], true));
  return [...files].sort();
}

function readExistingLastAgentTurn(root) {
  const path = join(root, "HANDOFF.json");
  if (!existsSync(path)) return null;
  try {
    const o = JSON.parse(readFileSync(path, "utf8"));
    return o.last_agent_turn ?? null;
  } catch {
    return null;
  }
}

export function writeHandoffJson(
  root,
  {
    timeStr,
    prompt,
    conversationId,
    note,
    handoffTier = "fast",
    gitDigestMarkdown = "",
    headShort,
    headFull,
    anchorBefore,
    taskIds,
    todolistResult,
    filesTouched,
  },
) {
  const path = join(root, "HANDOFF.json");
  const iso = new Date().toISOString();
  const lastAgentTurn = readExistingLastAgentTurn(root);
  const payload = {
    version: 1,
    schema: "doudian-master-handoff",
    handoff_tier: handoffTier === "full" ? "full" : "fast",
    updated_at: iso,
    updated_at_local: timeStr,
    session_end_prompt: String(prompt)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000),
    conversation_id: conversationId || null,
    hook_note: String(note).replace(/\r?\n/g, " ").trim().slice(0, 4000),
    git: {
      head: headFull || null,
      head_short: headShort || null,
      anchor_before: anchorBefore || null,
    },
    todolist: {
      task_ids_in_prompt: taskIds,
      updated: todolistResult.updated,
      skipped: todolistResult.skipped,
    },
    files_touched: filesTouched,
    next_suggested: [
      "Read HANDOFF.json (this file) for structured state.",
      "Read AGENT_TASK_PROTOCOL.md (human task protocol; hot state — do not embed into RAG).",
      "Read .data/harness-runtime.json locally for hook tool trail (gitignored).",
      "Read harness/README.md for harness design.",
      "Run npm run build (or project checks) if code changed.",
    ],
  };
  const digest = String(gitDigestMarkdown || "").trim();
  if (digest) payload.git_digest_markdown = digest.slice(0, 12_000);
  if (lastAgentTurn) payload.last_agent_turn = lastAgentTurn;
  const ver = readVerifyEvidence(root);
  if (ver?.ok === true) {
    payload.last_verification = {
      verified_at: ver.verified_at,
      tree_signature_short: ver.tree_signature
        ? String(ver.tree_signature).slice(0, 12)
        : null,
      command: ver.command || null,
    };
  }
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

/** 合并写入 last_agent_turn（保留 HANDOFF 其它字段） */
export function mergeHandoffLastAgentTurn(root, turn) {
  const path = join(root, "HANDOFF.json");
  let base = {
    version: 1,
    schema: "doudian-master-handoff",
  };
  if (existsSync(path)) {
    try {
      base = { ...base, ...JSON.parse(readFileSync(path, "utf8")) };
    } catch {
      /* ignore */
    }
  }
  base.last_agent_turn = {
    ...turn,
    recorded_at: new Date().toISOString(),
  };
  writeFileSync(path, `${JSON.stringify(base, null, 2)}\n`, "utf8");
}

export function writeLastAgentResponseCache(root, text) {
  const dir = join(root, ".data");
  mkdirSync(dir, { recursive: true });
  const body = String(text || "").slice(0, LAST_RESPONSE_MAX);
  const payload = {
    text: body,
    saved_at: new Date().toISOString(),
  };
  writeFileSync(
    join(dir, LAST_RESPONSE_FILE),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

export function readLastAgentResponseCache(root) {
  const p = join(root, ".data", LAST_RESPONSE_FILE);
  if (!existsSync(p)) return { text: "", saved_at: null };
  try {
    const j = JSON.parse(readFileSync(p, "utf8"));
    return { text: j.text || "", saved_at: j.saved_at || null };
  } catch {
    return { text: "", saved_at: null };
  }
}

function commitHandoffArtifacts(root, message) {
  if (!isGitRepo(root)) return;
  try {
    const toAdd = [];
    for (const f of ["HANDOFF.json", "AGENT_TASK_PROTOCOL.md"]) {
      const p = join(root, f);
      if (!existsSync(p)) continue;
      if (git(root, ["status", "--porcelain", "--", f], true).trim())
        toAdd.push(f);
    }
    if (toAdd.length) {
      git(root, ["add", ...toAdd]);
      git(root, ["commit", "-m", message]);
    }
  } catch (e) {
    const stderr = e?.stderr?.toString?.("utf8")?.trim();
    const hint =
      typeof message === "string" && message.includes("stop hook")
        ? "若为 commit-msg 拒绝 trivial stop-hook，见 harness/README.md。"
        : "";
    if (stderr) console.warn(stderr);
    else if (hint) console.warn("[harness] commitHandoffArtifacts 未提交。", hint);
    else console.warn("[harness] commitHandoffArtifacts 未提交:", e?.message || e);
  }
}

/**
 * 用户触发：收尾词（hook）或 CLI 显式结束
 * @returns {{ ran: boolean, reason?: string }}
 */
export function runUserTriggeredSessionEnd({
  root,
  prompt,
  conversationId = "",
  generationId = "",
  source = "hook",
  handoffTier = "fast",
}) {
  if (source === "hook" && !shouldTriggerCommit(prompt)) {
    return { ran: false, reason: "no_trigger" };
  }
  if (shouldThrottleUserSessionEnd(root, generationId)) {
    return { ran: false, reason: "debounced" };
  }

  const verifyBlockEarly = getVerifyBlockReason(root);
  if (verifyBlockEarly && source === "cli") {
    return { ran: false, reason: "verify_blocked", message: verifyBlockEarly };
  }

  const anchorBefore = readSessionAnchor(root);
  const timeStr = formatLocalTime();
  const taskIds = extractTaskIds(prompt);
  let todolistResult = { updated: [], skipped: [] };
  let todolistSummary = "";
  if (taskIds.length) {
    const ensureResult = ensureMissingTodolistRows(root, prompt, taskIds, timeStr);
    const footerPrefix =
      ensureResult.added.length > 0
        ? `自动新增 TODOLIST：${ensureResult.added.join("、")}`
        : "";
    todolistResult = applyTodolistProgress(root, taskIds, timeStr, {
      footerPrefix,
    });
    if (ensureResult.added.length) {
      todolistSummary = [
        `已新增 ${ensureResult.added.join("、")}`,
        todolistSummary,
      ]
        .filter(Boolean)
        .join(" ");
    }
    if (ensureResult.skipped.length) {
      todolistSummary = [
        todolistSummary,
        `新增跳过：${ensureResult.skipped.join("；")}`,
      ]
        .filter(Boolean)
        .join(" ");
    }
    if (todolistResult.updated.length) {
      todolistSummary = [
        todolistSummary,
        `已勾选 ${todolistResult.updated.join("、")}（${timeStr}）`,
      ]
        .filter(Boolean)
        .join(" ");
    }
    if (todolistResult.skipped.length) {
      todolistSummary = [
        todolistSummary,
        `未改：${todolistResult.skipped.join("；")}`,
      ]
        .filter(Boolean)
        .join(" ");
    }
  }

  const tier = handoffTier === "full" ? "full" : "fast";
  let note =
    source === "cli"
      ? todolistSummary
        ? `CLI harness:end（tier=${tier}）。${todolistSummary}`
        : `CLI harness:end（tier=${tier}）。`
      : todolistSummary
        ? `已检测收尾关键词（tier=${tier}）。${todolistSummary}`
        : `已检测收尾关键词（tier=${tier}）。`;
  try {
    if (!isGitRepo(root)) {
      note = `${note} 当前目录不是 git 仓库，已跳过 commit。`;
    } else if (!hasChanges(root)) {
      note = `${note} 工作区无变更，已跳过 commit。`;
    } else {
      const verifyBlock = getVerifyBlockReason(root);
      if (verifyBlock) {
        note = `${note} ${verifyBlock} 已跳过 git commit。`;
      } else {
        git(root, ["add", "-A"]);
        const subject = `chore: 会话收尾 ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
        const body = prompt.slice(0, 500).replace(/\r?\n/g, " ");
        let committed = false;
        try {
          git(root, ["commit", "-m", subject, "-m", body || "（无附加说明）"]);
          committed = true;
        } catch (commitErr) {
          note = `${note} git commit 失败: ${commitErr.message || commitErr}`;
        }
        if (committed) {
          note = `${note} 已执行 git add -A 并提交。`;
        }
      }
    }
  } catch (e) {
    note = `${note} 执行失败: ${e.message || e}`;
  }

  const gitOk = isGitRepo(root);
  const headShort = gitOk
    ? git(root, ["rev-parse", "--short", "HEAD"], true)
    : "";
  const headFull = gitOk ? git(root, ["rev-parse", "HEAD"], true) : "";
  const summaryMd = gitOk
    ? buildGitSummaryMarkdown(root, anchorBefore)
    : "_当前目录不是 git 仓库。_";
  const filesFromGit = collectTouchedFiles(root, anchorBefore, headFull);
  const filesTouched = [
    ...new Set([...filesFromGit, "HANDOFF.json", "AGENT_TASK_PROTOCOL.md"]),
  ].sort();

  writeHandoffJson(root, {
    timeStr,
    prompt,
    conversationId,
    note,
    handoffTier: tier,
    gitDigestMarkdown: summaryMd,
    headShort,
    headFull,
    anchorBefore,
    taskIds,
    todolistResult,
    filesTouched,
  });

  syncTaskProtocolMarkdown(root, {
    timeStr,
    prompt,
    note,
    headShort,
    handoffTier: tier,
    conversationId,
    gitDigestMarkdown: summaryMd,
  });

  commitHandoffArtifacts(root, "chore: handoff (cursor hook)");

  if (isGitRepo(root)) {
    const finalHead = git(root, ["rev-parse", "HEAD"], true);
    if (finalHead) writeSessionAnchor(root, finalHead);
  }

  recordUserSessionEnd(root, generationId);
  return { ran: true };
}

function quickFingerprint(parts) {
  const s = parts.join("\0");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return String(h >>> 0);
}

/** 供 stop hook 防抖：与本轮写入内容一致前先算 fingerprint */
export function getAgentStopFingerprint(root, status, loopCount) {
  const { text } = readLastAgentResponseCache(root);
  const gitOk = isGitRepo(root);
  const headShort = gitOk
    ? git(root, ["rev-parse", "--short", "HEAD"], true)
    : "";
  const diffStat = gitOk ? git(root, ["diff", "--stat"], true) : "";
  return quickFingerprint([
    String(status),
    String(loopCount),
    headShort,
    text.slice(0, 500),
    diffStat,
  ]);
}

/**
 * Agent 正常结束一轮：合并 HANDOFF.last_agent_turn + 尝试提交 HANDOFF
 */
export function runAgentStopHandoff(root, { status, loopCount }) {
  const timeStr = formatLocalTime();
  const { text, saved_at: responseSavedAt } = readLastAgentResponseCache(root);
  const gitOk = isGitRepo(root);
  const headShort = gitOk
    ? git(root, ["rev-parse", "--short", "HEAD"], true)
    : "";
  const diffStat = gitOk ? git(root, ["diff", "--stat"], true) : "";

  mergeHandoffLastAgentTurn(root, {
    source: "stop_hook",
    status,
    loop_count: loopCount,
    head_short: headShort || null,
    assistant_text_excerpt: text.replace(/\s+/g, " ").trim().slice(0, 8000),
    git_diff_stat: diffStat ? diffStat.slice(0, 8000) : "",
    response_saved_at: responseSavedAt || null,
    recorded_local: timeStr,
  });

  commitHandoffArtifacts(root, "chore: agent turn handoff (stop hook)");
}
