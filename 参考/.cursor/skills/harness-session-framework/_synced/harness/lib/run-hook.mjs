#!/usr/bin/env node
/**
 * Cursor hook 包装：统计调用次数/耗时/退出码，再执行真实 hook；stdout 原样透传。
 *
 * hooks.json 写法：
 *   node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs <事件名> harness/hooks/xxx.mjs
 *
 * stdin/stdout 与子进程一致；环境见 hook-usage-tracker（HARNESS_HOOK_USAGE_TRACK / MD）。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { recordHookRun, shouldTrackHookUsage } from "./hook-usage-tracker.mjs";
import { buildHookTriggerRecord } from "./hook-trigger-summary.mjs";
import { resolveHarnessRepoRoot } from "./workspace-root.mjs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function resolveRepoRootFromStdin(stdinStr) {
  try {
    const data = JSON.parse(stdinStr || "{}");
    const roots = Array.isArray(data.workspace_roots) ? data.workspace_roots : [];
    return resolveHarnessRepoRoot(roots, data.cwd || process.cwd());
  } catch {
    return resolveHarnessRepoRoot([], process.cwd());
  }
}

function main() {
  const event = process.argv[2];
  const hookRel = process.argv[3];
  if (!event || !hookRel) {
    console.error("run-hook.mjs: missing args <event> <hook-relative-path>");
    process.exit(2);
  }

  const stdinStr = readStdin();
  const root = resolveRepoRootFromStdin(stdinStr);
  const hookAbs = join(root, hookRel);
  const envImportUrl = pathToFileURL(join(root, "harness/lib/load-harness-env.mjs")).href;

  const t0 = Date.now();
  const r = spawnSync(process.execPath, ["--import", envImportUrl, hookAbs], {
    cwd: root,
    input: stdinStr,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    windowsHide: true,
  });
  const durationMs = Date.now() - t0;
  const exitCode = r.status === null ? 1 : r.status;

  if (shouldTrackHookUsage()) {
    const stderrTail = r.stderr ? String(r.stderr).slice(-600) : "";
    const trig = buildHookTriggerRecord(event, stdinStr);
    recordHookRun(root, {
      event,
      scriptRel: hookRel,
      durationMs,
      exitCode,
      stderrTail: exitCode !== 0 ? stderrTail : "",
      triggerSummary: trig.summary,
      triggerDetail: trig.detail,
    });
  }

  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  process.exit(exitCode);
}

main();
