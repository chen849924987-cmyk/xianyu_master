#!/usr/bin/env node
/**
 * postToolUse：追加运行时轨迹（不外泄大块 tool_output）
 */
import { readFileSync } from "node:fs";
import { resolveHarnessRepoRoot } from "../lib/workspace-root.mjs";
import { recordToolSuccess } from "../lib/runtime-state.mjs";

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
  recordToolSuccess(root, {
    tool_name: data.tool_name,
    tool_input: data.tool_input,
    duration_ms: data.duration,
  });

  console.log(JSON.stringify({}));
}

main();
