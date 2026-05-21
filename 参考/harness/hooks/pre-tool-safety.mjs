#!/usr/bin/env node
/**
 * preToolUse：对 Shell 类工具做与 beforeShellExecution 一致的安全审计
 * stdin: { tool_name / toolName, tool_input / toolInput, ... }
 */
import { readFileSync } from "node:fs";
import { auditShellCommand } from "../lib/shell-safety.mjs";

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

  const toolName = String(data.tool_name ?? data.toolName ?? "").toLowerCase();
  const input = data.tool_input ?? data.toolInput ?? {};
  const command = typeof input.command === "string" ? input.command : "";

  if (toolName !== "shell" || !command) {
    console.log(JSON.stringify({ permission: "allow" }));
    return;
  }

  console.log(JSON.stringify(auditShellCommand(command)));
}

main();
