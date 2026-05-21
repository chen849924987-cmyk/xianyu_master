#!/usr/bin/env node
/**
 * stop：Agent 一轮结束（用户未发收尾词）时追加轻量 SESSION_LOG + HANDOFF.last_agent_turn
 * stdin: { status, loop_count, workspace_roots?, cwd? }
 * stdout: {} 或 { followup_message }（认知层切换 / 可选代码评审，见 harness/README.md）
 */
import { readFileSync } from "node:fs";
import { resolveHarnessRepoRoot } from "../lib/workspace-root.mjs";
import { shouldThrottleAgentStop, recordAgentStop } from "../lib/debounce.mjs";
import {
  getAgentStopFingerprint,
  runAgentStopHandoff,
} from "../lib/session-end-core.mjs";
import { buildAutoModeSwitchFollowup } from "../lib/cognitive-modes.mjs";
import { buildCodeReviewFollowupMessage } from "../lib/stop-code-review-followup.mjs";

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

  const roots = Array.isArray(data.workspace_roots) ? data.workspace_roots : [];
  const root = resolveHarnessRepoRoot(roots, data.cwd || process.cwd());
  const status = data.status ?? "unknown";
  const loopCount = data.loop_count;

  const terminal = new Set(["completed", "error", "aborted"]);
  if (!terminal.has(String(status))) {
    console.log(JSON.stringify({}));
    return;
  }

  // 认知层：用户长期纠结时，stop 可选择发 followup_message 触发“换推理框架”再跑一轮。
  // 触发 followup 时，不写 stop handoff（避免提前收尾）。
  const followup = buildAutoModeSwitchFollowup(root, { status, loopCount });
  if (followup) {
    console.log(JSON.stringify({ followup_message: followup }));
    return;
  }

  const fp = getAgentStopFingerprint(root, status, loopCount);
  if (shouldThrottleAgentStop(root, fp)) {
    console.log(JSON.stringify({}));
    return;
  }

  runAgentStopHandoff(root, { status, loopCount });
  recordAgentStop(root, fp);

  const reviewFollowup = buildCodeReviewFollowupMessage(root, { status });
  if (reviewFollowup) {
    console.log(JSON.stringify({ followup_message: reviewFollowup }));
    return;
  }

  console.log(JSON.stringify({}));
}

main();
