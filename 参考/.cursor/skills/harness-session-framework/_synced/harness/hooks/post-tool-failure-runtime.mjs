#!/usr/bin/env node
/**
 * postToolUseFailure：累计失败与错误摘要
 */
import { readFileSync } from "node:fs";
import { resolveHarnessRepoRoot } from "../lib/workspace-root.mjs";
import { recordToolFailure } from "../lib/runtime-state.mjs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  let data = {};
  try {
    data = JSON.parse(readStdin() || "{}");
  } catch {
    /* ignore */
  }

  const cwd = typeof data.cwd === "string" ? data.cwd : process.cwd();
  const root = resolveHarnessRepoRoot([], cwd);
  recordToolFailure(root, {
    tool_name: data.tool_name,
    failure_type: data.failure_type,
    error_message: data.error_message,
  });

  console.log(JSON.stringify({}));
}

main();
