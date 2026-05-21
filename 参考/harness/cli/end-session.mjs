#!/usr/bin/env node
/**
 * 非 Cursor 路径：与 beforeSubmitPrompt 同源逻辑（跳过「收尾词」检测）
 * 用法: node harness/cli/end-session.mjs [--full] [--message=完成] [--root=path]
 * 或: HARNESS_ROOT=... npm run harness:end
 *
 * 仓库默认环境：../harness.env（见 load-harness-env.mjs）
 */
import "../lib/load-harness-env.mjs";
import { resolveHarnessRepoRoot } from "../lib/workspace-root.mjs";
import { runUserTriggeredSessionEnd } from "../lib/session-end-core.mjs";

function parseArgs(argv) {
  let message = "完成";
  let rootOverride = process.env.HARNESS_ROOT || "";
  let full = process.env.HARNESS_HANDOFF_FULL === "1";
  for (const a of argv) {
    if (a === "--full") full = true;
    else if (a.startsWith("--message=")) message = a.slice("--message=".length) || message;
    else if (a.startsWith("--root=")) rootOverride = a.slice("--root=".length) || rootOverride;
  }
  return { message, rootOverride, handoffTier: full ? "full" : "fast" };
}

function main() {
  const { message, rootOverride, handoffTier } = parseArgs(process.argv.slice(2));
  const roots = rootOverride ? [rootOverride] : [];
  const root = resolveHarnessRepoRoot(roots, rootOverride || process.cwd());
  const generationId = process.env.HARNESS_GENERATION_ID || "";

  const r = runUserTriggeredSessionEnd({
    root,
    prompt: message,
    conversationId: process.env.HARNESS_CONVERSATION_ID || "",
    generationId,
    source: "cli",
    handoffTier,
  });

  if (!r.ran) {
    if (r.reason === "verify_blocked" && r.message) {
      console.error(`harness:end blocked: ${r.message}`);
      process.exit(1);
    }
    const reason = r.reason === "debounced" ? "debounced (see HARNESS_FORCE_END=1)" : r.reason;
    console.error(`harness:end skipped: ${reason || "unknown"}`);
    process.exit(0);
  }

  console.error("harness:end ok");
}

main();
