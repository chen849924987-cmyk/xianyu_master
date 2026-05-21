#!/usr/bin/env node
/**
 * 为 harness/hooks/*.mjs 生成 docs/harness/hooks/<name>.md（索引：README.md）
 *
 * 用法：npm run sync:hook-docs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @param {string} repoRoot */
function loadDescriptions(repoRoot) {
  const p = join(repoRoot, "harness/lib/hook-script-descriptions.json");
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

/** @param {string} hooksJsonPath @returns {Record<string, Array<{ event: string; matcher?: string; timeout?: number }>>} */
function buildRegistry(hooksJsonPath) {
  const map = {};
  if (!existsSync(hooksJsonPath)) return map;
  let j;
  try {
    j = JSON.parse(readFileSync(hooksJsonPath, "utf8"));
  } catch {
    return map;
  }
  const buckets = j.hooks || {};
  for (const [event, arr] of Object.entries(buckets)) {
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      const cmd = typeof entry.command === "string" ? entry.command : "";
      const m = cmd.match(/harness\/hooks\/([^/\s"]+\.mjs)/);
      if (!m) continue;
      const name = m[1];
      if (!map[name]) map[name] = [];
      map[name].push({
        event,
        matcher: entry.matcher,
        timeout: entry.timeout,
      });
    }
  }
  return map;
}

/** @param {string} src */
function extractHeaderComment(src) {
  const noShebang = src.replace(/^#![^\n]*\n/, "");
  const block = noShebang.match(/^\/\*\*([\s\S]*?)\*\//);
  if (!block) return "";
  return block[1]
    .trim()
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*\s?/, "").trimEnd())
    .join("\n")
    .trim();
}

/** Cursor hooks.json 的 timeout 多为「秒」；若 ≥500 则按毫秒换算为秒 */
function timeoutLabel(raw) {
  if (raw == null || !Number.isFinite(raw)) return "—";
  if (raw >= 500) return String(Math.round(raw / 1000));
  return String(raw);
}

/**
 * @param {string} repoRoot
 * @returns {{ written: string[]; outDir: string }}
 */
export function syncHookDocs(repoRoot) {
  const hooksDir = join(repoRoot, "harness/hooks");
  const outDir = join(repoRoot, "docs/harness/hooks");
  const hooksJson = join(repoRoot, ".cursor/hooks.json");
  const registry = buildRegistry(hooksJson);
  const descriptions = loadDescriptions(repoRoot);

  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(hooksDir)
    .filter((f) => f.endsWith(".mjs"))
    .sort((a, b) => a.localeCompare(b));

  const written = [];
  const indexRows = [];

  for (const file of files) {
    const abs = join(hooksDir, file);
    const raw = readFileSync(abs, "utf8");
    const header = extractHeaderComment(raw);
    const summary = descriptions[file] || "（请在 harness/lib/hook-script-descriptions.json 补充一句话说明）";
    const bindings = registry[file] || [];
    const lines = [];

    lines.push(`# ${file}`);
    lines.push("");
    lines.push(
      `> **自动生成**：由 \`harness/lib/sync-hook-docs.mjs\` 写入；请勿手工改本节以上正文。更新 **\`harness/hooks/${file}\`**、**\`.cursor/hooks.json\`** 或 **\`harness/lib/hook-script-descriptions.json\`** 后保存对应文件会触发 \`after-file-sync-hook-docs\` 刷新本页。`,
    );
    lines.push("");
    lines.push("## 摘要");
    lines.push("");
    lines.push(summary);
    lines.push("");
    lines.push("## Cursor 注册（`.cursor/hooks.json`）");
    lines.push("");
    if (bindings.length) {
      lines.push("| Cursor 事件 | matcher | timeout（秒） |");
      lines.push("|-------------|---------|----------------|");
      for (const b of bindings) {
        lines.push(`| \`${b.event}\` | ${b.matcher ? `\`${b.matcher}\`` : "—"} | ${timeoutLabel(b.timeout)} |`);
      }
    } else {
      lines.push("（当前未在 `.cursor/hooks.json` 中引用该脚本；若仅本地调用请忽略。）");
    }
    lines.push("");
    lines.push("## 源码路径");
    lines.push("");
    lines.push(`仓库内：[\`harness/hooks/${file}\`](../../../harness/hooks/${file})`);
    lines.push("");
    lines.push("## 文件头注释（摘录）");
    lines.push("");
    lines.push("```text");
    lines.push(header || "（无 /** */ 块注释）");
    lines.push("```");
    lines.push("");

    const outPath = join(outDir, file.replace(/\.mjs$/, ".md"));
    writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
    written.push(relative(repoRoot, outPath).replace(/\\/g, "/"));

    const slug = file.replace(/\.mjs$/, ".md");
    const ev = bindings.map((b) => `\`${b.event}\``).join("、") || "—";
    indexRows.push(`| [${file}](./${slug}) | ${ev} |`);
  }

  const indexMd = `# Harness Cursor Hooks 文档

> **自动生成**：与各页同源刷新，命令 \`npm run sync:hook-docs\`。

说明见仓库 [\`harness/README.md\`](../../harness/README.md)。

## 索引

| Hook 脚本 | 绑定的 Cursor 事件 |
|-----------|-------------------|
${indexRows.join("\n")}
`;

  writeFileSync(join(outDir, "README.md"), indexMd, "utf8");
  written.push(relative(repoRoot, join(outDir, "README.md")).replace(/\\/g, "/"));

  return { written, outDir };
}

function main() {
  const repoRoot = join(__dirname, "..", "..");
  try {
    const r = syncHookDocs(repoRoot);
    console.log("[sync:hook-docs] OK →", r.outDir, `(${r.written.length} files)`);
  } catch (e) {
    console.error("[sync:hook-docs]", e?.message || e);
    process.exitCode = 1;
  }
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsCli = Boolean(process.argv[1] && resolve(process.argv[1]) === thisFile);
if (invokedAsCli) {
  main();
}
