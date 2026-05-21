#!/usr/bin/env node
/**
 * afterFileEdit：保存 docs/ 或 harness/ 下文件后，把镜像同步到 Cursor Skill（_synced/）。
 * 禁用：HARNESS_SKIP_CURSOR_SKILL_SYNC=1
 *
 * stdin: { file_path, edits? }
 */
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { syncCursorHarnessSkill } from "../lib/sync-cursor-harness-skill.mjs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function gitRootFromFile(absolutePath) {
  const dir = dirname(resolve(absolutePath));
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

function normRel(root, absPath) {
  try {
    return relative(root, absPath).replace(/\\/g, "/");
  } catch {
    return "";
  }
}

/** @param {string} rel */
function shouldSync(rel) {
  if (!rel || rel.startsWith("..")) return false;
  if (rel.startsWith("docs/")) return true;
  if (rel.startsWith("harness/")) return true;
  return false;
}

function main() {
  if (process.env.HARNESS_SKIP_CURSOR_SKILL_SYNC === "1") {
    console.log(JSON.stringify({}));
    return;
  }

  let data = {};
  try {
    data = JSON.parse(readStdin() || "{}");
  } catch {
    /* ignore */
  }

  const filePath = typeof data.file_path === "string" ? data.file_path : "";
  if (!filePath) {
    console.log(JSON.stringify({}));
    return;
  }

  const root = gitRootFromFile(filePath);
  if (!root) {
    console.log(JSON.stringify({}));
    return;
  }

  const rel = normRel(root, filePath);
  if (!shouldSync(rel)) {
    console.log(JSON.stringify({}));
    return;
  }

  try {
    syncCursorHarnessSkill(root);
  } catch (e) {
    console.error("[after-file-sync-harness-skill]", e?.message || e);
    process.exitCode = 1;
  }

  console.log(JSON.stringify({}));
}

main();
