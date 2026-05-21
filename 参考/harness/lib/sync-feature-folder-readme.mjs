/**
 * 维护 src/features/<dir>/README.md：给用户看的 Feature 说明 + 白话流程。
 * - <!-- AUTO:FEATURE_FOLDER_README --> … 随源码自动刷新
 * - <!-- MANUAL:FEATURE_FOLDER_README --> … 有则保留，无则注入预设流程
 *
 * 手动：node harness/lib/sync-feature-folder-readme.mjs
 * 与 MCP 文档一并：node harness/lib/sync-all-feature-docs.mjs
 */
import { existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { listOrderedFeatureModules } from "./sync-readme-features.mjs";
import {
  readUtf8,
  extractFeatureDocComment,
  collectUrls,
  collectProcessEnvKeys,
  collectFeatureSources,
} from "./feature-source-meta.mjs";
import { getFolderReadmeFlowPreset } from "./feature-folder-readme-presets.mjs";

const AUTO_START = "<!-- AUTO:FEATURE_FOLDER_README -->";
const AUTO_END = "<!-- END:AUTO:FEATURE_FOLDER_README -->";
const MANUAL_START = "<!-- MANUAL:FEATURE_FOLDER_README -->";
const MANUAL_END = "<!-- END:MANUAL:FEATURE_FOLDER_README -->";

/**
 * @param {string} repoRoot
 * @param {{ id: string, displayName: string, dir: string }} mod
 */
export function buildAutoFolderReadmeSection(repoRoot, mod) {
  const indexPath = join(repoRoot, "src", "features", mod.dir, "index.ts");
  const indexTs = existsSync(indexPath) ? readUtf8(indexPath) : "";
  const { combined: allTs, files } = collectFeatureSources(repoRoot, mod.dir);
  const jsdoc = extractFeatureDocComment(indexTs);
  const urls = collectUrls(allTs);
  const envKeys = collectProcessEnvKeys(allTs);
  const relFiles = files.map((f) => `\`src/features/${mod.dir}/${f}\``).join("、");

  const lines = [
    AUTO_START,
    "> **本区块由 `node harness/lib/sync-feature-folder-readme.mjs`（或 Cursor `afterFileEdit` hook）根据源码自动生成**，请勿手工编辑；要写给用户看的流程说明请改下方「白话流程」区块。",
    "",
    "## 源码索引（自动）",
    "",
    `- **Feature id**：\`${mod.id}\``,
    `- **列表上的名字**：${mod.displayName}`,
    `- **本目录 TypeScript 文件**：${relFiles || "—"}`,
    "",
    "### 命令行怎么跑",
    "",
    "```bash",
    `npm run dev -- --feature=${mod.id}`,
    "```",
    "",
    "### 其它文档",
    "",
    `- **给 AI / MCP 实测的步骤清单**：[\`tests/mcp/features/${mod.id}.md\`](../../../tests/mcp/features/${mod.id}.md)（相对路径从本 README 出发指向仓库内文件）`,
    `- **注册表条目**：\`tests/mcp/contracts/features-mcp-registry.ts\``,
    "",
  ];

  if (jsdoc) {
    lines.push("### 源码顶部说明（摘录）", "", "```text", jsdoc, "```", "");
  }

  if (urls.length) {
    lines.push("### 代码里出现的网址（自动列出）", "");
    for (const u of urls) {
      lines.push(`- ${u}`);
    }
    lines.push("");
  }

  if (envKeys.length) {
    lines.push("### 代码里读过的环境变量名（自动列出）", "");
    lines.push(envKeys.map((k) => `\`${k}\``).join("、"));
    lines.push("");
  }

  if (mod.id === "xf-ali-find-low-goods") {
    lines.push(
      "### 契约（对齐 MCP / 离线校验）",
      "",
      "- \`tests/mcp/contracts/xf-low-goods-mcp-contract.ts\`",
      "",
    );
  }

  lines.push(AUTO_END);
  return lines.join("\n");
}

/**
 * @param {string} body
 * @returns {{ manual: string | null }}
 */
function extractManualBlock(body) {
  const si = body.indexOf(MANUAL_START);
  const ei = body.indexOf(MANUAL_END);
  if (si < 0 || ei < 0 || ei <= si) return { manual: null };
  return { manual: body.slice(si + MANUAL_START.length, ei).trim() };
}

/**
 * @param {string} id
 * @param {string | null} existingManual
 */
function buildManualSection(id, existingManual) {
  const inner = (
    existingManual && existingManual.length > 0 ? existingManual : getFolderReadmeFlowPreset(id)
  ).trim();
  if (!inner) {
    return `${MANUAL_START}\n\n（请在此用白话写：用户为什么要用这个 Feature、代码大致分几步。）\n\n${MANUAL_END}`;
  }
  return `${MANUAL_START}\n\n${inner}\n\n${MANUAL_END}`;
}

/**
 * @param {string} repoRoot
 * @param {{ id: string, displayName: string, dir: string }} mod
 * @returns {{ changed: boolean }}
 */
export function syncOneFeatureFolderReadme(repoRoot, mod) {
  const outPath = join(repoRoot, "src", "features", mod.dir, "README.md");
  let prev = "";
  if (existsSync(outPath)) {
    prev = readUtf8(outPath);
  }

  const title = `# ${mod.displayName}（\`${mod.id}\`）`;
  const subtitle =
    "> 本页说明：**这个 Feature 是干什么的**、**代码大致按什么顺序执行**。技术细节以 \`.ts\` 源码为准。";
  const auto = buildAutoFolderReadmeSection(repoRoot, mod);
  const { manual: manualInner } = extractManualBlock(prev);
  const manual = buildManualSection(mod.id, manualInner);

  const next = [title, "", subtitle, "", auto, "", manual, ""].join("\n");

  if (next === prev) {
    return { changed: false };
  }
  writeFileSync(outPath, next, "utf8");
  return { changed: true };
}

/**
 * @param {string} repoRoot
 * @returns {{ changedFiles: string[] }}
 */
export function syncAllFeatureFolderReadmes(repoRoot) {
  const mods = listOrderedFeatureModules(repoRoot);
  /** @type {string[]} */
  const changedFiles = [];
  for (const mod of mods) {
    const { changed } = syncOneFeatureFolderReadme(repoRoot, mod);
    if (changed) {
      changedFiles.push(relative(repoRoot, join(repoRoot, "src", "features", mod.dir, "README.md")));
    }
  }
  return { changedFiles };
}

function main() {
  const repoRoot = process.cwd();
  const { changedFiles } = syncAllFeatureFolderReadmes(repoRoot);
  if (changedFiles.length) {
    console.error("[feature-folder-readme] updated:\n" + changedFiles.map((f) => `  - ${f}`).join("\n"));
  } else {
    console.error("[feature-folder-readme] already up to date");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
