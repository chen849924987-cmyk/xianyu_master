#!/usr/bin/env node
/**
 * beforeShellExecution：Shell 命令安全策略（allow / deny / ask）
 * stdin: { command, cwd?, ... }
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

  const command = typeof data.command === "string" ? data.command : "";
  const result = auditShellCommand(command);
  console.log(JSON.stringify(result));
}

main();
