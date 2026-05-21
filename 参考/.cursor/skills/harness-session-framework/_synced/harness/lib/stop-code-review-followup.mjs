/**
 * stop hook：可选地在 Agent 一轮结束后注入「代码评审」followup_message。
 * 依赖 Cursor stop 事件支持 stdout JSON 中的 followup_message（与 cognitive-modes 相同机制）。
 *
 * 去重：对限定 pathspec 的 git diff 做 sha256，同一 diff 不重复发评审提示（写入 .data/）。
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

function truthy(v) {
  if (v === undefined || v === null) return false;
  return ["1", "true", "yes", "on"].includes(String(v).trim().toLowerCase());
}

function parsePathspec() {
  const raw =
    process.env.HARNESS_STOP_CODE_REVIEW_PATHSPEC ??
    "src,package.json,package-lock.json,tsconfig.json,web";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pathsExistingSync(root, rels) {
  return rels.filter((r) => existsSync(join(root, r)));
}

function gitDiffForReview(root, paths) {
  if (paths.length === 0) return "";
  try {
    return execFileSync("git", ["diff", "HEAD", "--", ...paths], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch {
    return "";
  }
}

function loadState(root) {
  const p = join(root, ".data", "harness-stop-review-state.json");
  try {
    const t = readFileSync(p, "utf8");
    return JSON.parse(t);
  } catch {
    return {};
  }
}

function saveState(root, state) {
  const dir = join(root, ".data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "harness-stop-review-state.json"), JSON.stringify(state, null, 2), "utf8");
}

function statusAllowed(status) {
  const raw = process.env.HARNESS_STOP_CODE_REVIEW_ON_STATUS ?? "completed";
  const allowed = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(String(status).toLowerCase());
}

/**
 * @param {string} root
 * @param {{ status?: string }} opts
 * @returns {string | null}
 */
export function buildCodeReviewFollowupMessage(root, opts = {}) {
  if (!truthy(process.env.HARNESS_STOP_CODE_REVIEW)) return null;

  const status = opts.status ?? "unknown";
  if (!statusAllowed(status)) return null;

  const rels = parsePathspec();
  const paths = pathsExistingSync(root, rels);
  const diff = gitDiffForReview(root, paths);
  if (!diff.trim()) return null;

  const hash = createHash("sha256").update(diff, "utf8").digest("hex");
  const state = loadState(root);
  if (state.lastReviewPromptDiffHash === hash) return null;

  saveState(root, { ...state, lastReviewPromptDiffHash: hash, lastReviewPromptAt: new Date().toISOString() });

  const pathHint = paths.join(", ");
  return `【自动代码评审 / auto code review】

上一轮流式任务已结束。请在**不扩展原始需求**的前提下，只做评审与文档记录：

1. 查看未提交改动：在项目根执行 \`git diff HEAD -- ${pathHint}\`（路径来自 HARNESS_STOP_CODE_REVIEW_PATHSPEC）。
2. 从正确性、边界与错误处理、类型与安全（含密钥/注入）、可维护性简要给出结论。
3. 将评审写入新文件：\`docs/agent-reviews/REVIEW-<YYYY-MM-DD>-<short-slug>.md\`（slug 用小写英文单词和连字符）。
4. 文档建议包含：摘要、问题清单（严重度：block / major / minor / nit）、可选修复建议、是否可合并的主观判断。
5. 若几乎没有可审增量，写一两句说明即可。

完成后结束本轮，不要自动实现新功能（除非用户明确要求）。`;
}
