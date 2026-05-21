#!/usr/bin/env node
/**
 * beforeSubmitPrompt：收尾用语时 git 提交、AGENT_*、HANDOFF 等
 * stdin: Cursor JSON（prompt、workspace_roots、conversation_id、generation_id、cwd 等）
 * stdout: { "continue": true }
 */
import { readFileSync } from "node:fs";
import { resolveHarnessRepoRoot } from "../lib/workspace-root.mjs";
import { runUserTriggeredSessionEnd, shouldTriggerCommit } from "../lib/session-end-core.mjs";
import { getVerifyBlockReason } from "../lib/verify-evidence.mjs";
import { recordUserPromptSignal } from "../lib/cognitive-modes.mjs";
import {
  applyProtocolIntentFromUserPrompt,
  shouldTriggerProtocolIntentFromUserPrompt,
} from "../lib/protocol-intent-user-prompt.mjs";

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

  const prompt = typeof data.prompt === "string" ? data.prompt : "";
  const roots = Array.isArray(data.workspace_roots) ? data.workspace_roots : [];
  const root = resolveHarnessRepoRoot(roots, data.cwd || process.cwd());
  const conversationId = typeof data.conversation_id === "string" ? data.conversation_id : "";
  const generationId =
    typeof data.generation_id === "string"
      ? data.generation_id
      : typeof data.generationId === "string"
        ? data.generationId
        : "";

  const protocolUserIntent = shouldTriggerProtocolIntentFromUserPrompt(prompt);
  if (protocolUserIntent) {
    try {
      applyProtocolIntentFromUserPrompt(root, prompt);
    } catch (e) {
      console.warn("prompt-session-end: protocol user intent:", e.message || e);
    }
  }

  // 认知层：记录挫败信号（不改变 prompt，仅写 state），用于 stop 时自动切换推理框架
  // 仅对非收尾词、非「更新协议」类口令做记录。
  if (!shouldTriggerCommit(prompt) && !protocolUserIntent) {
    recordUserPromptSignal(root, prompt);
  }

  if (shouldTriggerCommit(prompt)) {
    const verifyBlock = getVerifyBlockReason(root);
    if (verifyBlock) {
      console.log(JSON.stringify({ continue: false, user_message: verifyBlock }));
      return;
    }
  }

  const handoffTier = process.env.HARNESS_HANDOFF_FULL === "1" ? "full" : "fast";

  runUserTriggeredSessionEnd({
    root,
    prompt,
    conversationId,
    generationId,
    source: "hook",
    handoffTier,
  });

  console.log(JSON.stringify({ continue: true }));
}

main();
