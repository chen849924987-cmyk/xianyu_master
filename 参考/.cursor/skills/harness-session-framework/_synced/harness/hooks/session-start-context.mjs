#!/usr/bin/env node
/**
 * sessionStart: 注入 HANDOFF + 任务协议 YAML +（若存在）运行时轨迹 JSON
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { resolveHarnessRepoRoot } from "../lib/workspace-root.mjs";

const MAX_CTX = 14_000;

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function formatRuntimeExcerpt(raw) {
  try {
    const j = JSON.parse(raw);
    const ev = Array.isArray(j.recent_events) ? j.recent_events : [];
    const tail = ev.slice(-18);
    const lines = tail.map(
      (e) =>
        `- ${e.at || "?"} [${e.kind || "?"}] ${e.tool || ""} ${e.summary || e.failure_type || ""}`.trim(),
    );
    return [
      `updated_at: ${j.updated_at || "(无)"}`,
      `tool_failure_total: ${j.tool_failure_total ?? 0}`,
      "",
      "recent_events (tail):",
      ...lines,
    ].join("\n");
  } catch {
    return raw.slice(0, 2500);
  }
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin() || "{}");
  } catch {
    /* ignore */
  }

  const roots = Array.isArray(input.workspace_roots) ? input.workspace_roots : [];
  const root = resolveHarnessRepoRoot(roots, input.cwd || process.cwd());

  const handoffPath = join(root, "HANDOFF.json");
  const protocolPath = join(root, "AGENT_TASK_PROTOCOL.md");
  const runtimePath = join(root, ".data", "harness-runtime.json");

  const lines = [
    "### Agent harness（sessionStart）",
    "",
    "双轨交接：**意图** → `AGENT_TASK_PROTOCOL.md`；**现场** → `.data/harness-runtime.json`（hook 维护，gitignore）；**机读摘要** → `HANDOFF.json`。",
    "两者（协议 + runtime）**勿入 RAG/向量索引**；历史叙事已收敛到 `HANDOFF.git_digest_markdown` 与 git 记录。",
    "",
  ];

  if (existsSync(handoffPath)) {
    const raw = readFileSync(handoffPath, "utf8").trimEnd();
    lines.push("#### HANDOFF.json", "", "```json", raw, "```", "");
  } else {
    lines.push("_尚无 `HANDOFF.json`：上一次会话收尾后会生成。_", "");
  }

  if (existsSync(protocolPath)) {
    const raw = readFileSync(protocolPath, "utf8").trimEnd();
    lines.push("#### AGENT_TASK_PROTOCOL.md", "", "```markdown", raw, "```", "");
  } else {
    lines.push("_尚无 `AGENT_TASK_PROTOCOL.md`：收尾或任意提交后由 hook 生成模板。_", "");
  }

  if (existsSync(runtimePath)) {
    const raw = readFileSync(runtimePath, "utf8").trimEnd();
    const excerpt = formatRuntimeExcerpt(raw);
    lines.push("#### .data/harness-runtime.json（摘录）", "", "```text", excerpt, "```", "");
  } else {
    lines.push("_尚无 `.data/harness-runtime.json`（本地运行 Agent / hook 后会生成）。_", "");
  }

  lines.push(
    `_session: ${input.session_id ?? "(unknown)"} | composer: ${input.composer_mode ?? "?"} | background: ${String(input.is_background_agent ?? "?")}_`,
  );

  let ctx = lines.join("\n");
  if (ctx.length > MAX_CTX) {
    ctx = `${ctx.slice(0, MAX_CTX)}\n\n…(truncated — read files from disk)`;
  }

  console.log(JSON.stringify({ additional_context: ctx }));
}

main();
