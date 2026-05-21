#!/usr/bin/env node
/**
 * afterFileEdit：保存 src/features 注册表或任一 feature 模块后，自动刷新 README.md 中的功能列表区块。
 * 禁用：HARNESS_SKIP_README_FEATURES_SYNC=1
 *
 * stdin: { file_path, edits? }
 */
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { syncReadmeFeatures } from "../lib/sync-readme-features.mjs";

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
function shouldSyncReadme(rel) {
  if (!rel || rel.startsWith("..")) return false;
  if (rel === "src/features/index.ts") return true;
  return /^src\/features\/[^/]+\/index\.ts$/.test(rel);
}

function main() {
  if (process.env.HARNESS_SKIP_README_FEATURES_SYNC === "1") {
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
  if (!shouldSyncReadme(rel)) {
    console.log(JSON.stringify({}));
    return;
  }

  try {
    syncReadmeFeatures(root);
  } catch (err) {
    console.error("[readme-features-hook]", err instanceof Error ? err.message : err);
  }

  console.log(JSON.stringify({}));
}

main();
