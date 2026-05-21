#!/usr/bin/env node
/**
 * afterAgentResponse：缓存本轮助手回复；若文末含 <agent_protocol_intent> JSON 则刷新 AGENT_TASK_PROTOCOL.md 意图区
 * stdin: { text, workspace_roots?, cwd? }
 * stdout: 无必需字段；输出空对象即可
 */
import { readFileSync } from "node:fs";
import { resolveHarnessRepoRoot } from "../lib/workspace-root.mjs";
import { writeLastAgentResponseCache } from "../lib/session-end-core.mjs";
import { tryApplyProtocolIntentFromAssistantText } from "../lib/protocol-intent-from-response.mjs";

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

  const text = typeof data.text === "string" ? data.text : "";
  const roots = Array.isArray(data.workspace_roots) ? data.workspace_roots : [];
  const root = resolveHarnessRepoRoot(roots, data.cwd || process.cwd());

  if (text) writeLastAgentResponseCache(root, text);

  try {
    tryApplyProtocolIntentFromAssistantText(root, text);
  } catch (e) {
    console.warn("afterAgentResponse: protocol intent sync:", e.message || e);
  }

  console.log(JSON.stringify({}));
}

main();
