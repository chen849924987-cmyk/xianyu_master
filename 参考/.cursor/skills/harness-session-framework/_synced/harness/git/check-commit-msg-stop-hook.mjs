#!/usr/bin/env node
/**
 * commit-msg hook：拦截 Cursor stop hook 产生的大量「仅 HANDOFF / 协议」微小提交。
 *
 * 默认开启（加载 harness.env / harness.local.env 后可覆盖）：
 * - HARNESS_ALLOW_STOP_HOOK_COMMIT=1 — 跳过本检查，允许提交
 * - HARNESS_STOP_HOOK_COMMIT_MAX_CHURN — 插入+删除合计超过该值则放行（默认 120）
 *
 * @see harness/README.md「Git：拦截 trivial stop-hook 提交」
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import "../lib/load-harness-env.mjs";

const STOP_SUBJECT = "chore: agent turn handoff (stop hook)";
const ALLOWED_STAGED = new Set(["HANDOFF.json", "AGENT_TASK_PROTOCOL.md"]);

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function firstLineSubject(msgPath) {
  try {
    const raw = readFileSync(msgPath, "utf8");
    const line = raw.split(/\r?\n/)[0]?.trim() ?? "";
    return line;
  } catch {
    return "";
  }
}

function stagedChurn(root) {
  const stat = git(root, ["diff", "--cached", "--numstat"]);
  if (!stat) return 0;
  let churn = 0;
  for (const line of stat.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const ins = Number.parseInt(parts[0], 10);
    const del = Number.parseInt(parts[1], 10);
    if (!Number.isFinite(ins) || !Number.isFinite(del)) continue;
    churn += ins + del;
  }
  return churn;
}

function main() {
  const msgPath = process.argv[2];
  if (!msgPath) process.exit(0);

  const subject = firstLineSubject(msgPath);
  if (subject !== STOP_SUBJECT) process.exit(0);

  if (process.env.HARNESS_ALLOW_STOP_HOOK_COMMIT === "1") process.exit(0);

  const maxChurn = Number.parseInt(process.env.HARNESS_STOP_HOOK_COMMIT_MAX_CHURN ?? "120", 10);
  const threshold = Number.isFinite(maxChurn) && maxChurn > 0 ? maxChurn : 120;

  let root;
  try {
    root = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
  } catch {
    process.exit(0);
  }
  if (!root) process.exit(0);

  let namesRaw;
  try {
    namesRaw = git(root, ["diff", "--cached", "--name-only"]);
  } catch {
    process.exit(0);
  }
  const names = namesRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (names.length === 0) process.exit(0);

  for (const n of names) {
    if (!ALLOWED_STAGED.has(n)) process.exit(0);
  }

  const churn = stagedChurn(root);
  if (churn > threshold) process.exit(0);

  console.error(
    `[harness] commit-msg：已拒绝 trivial stop-hook 提交（暂存仅 ${[...ALLOWED_STAGED].join("/")}，合计 churn=${churn}，阈值=${threshold}）。\n` +
      `  原因：stop hook 每次合并 HANDOFF.last_agent_turn 都会产生一条提交，容易造成历史噪声。\n` +
      `  可行操作：① 稍后用有意义的说明一并提交 HANDOFF.json；② 或设置 HARNESS_ALLOW_STOP_HOOK_COMMIT=1 后重试；③ 或调大 HARNESS_STOP_HOOK_COMMIT_MAX_CHURN。`,
  );
  process.exit(1);
}

main();
