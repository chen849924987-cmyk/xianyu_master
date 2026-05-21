#!/usr/bin/env node
/**
 * 将仓库内 docs/、harness/ 镜像到 Cursor Skill：
 *   .cursor/skills/harness-session-framework/_synced/
 *
 * 用法：npm run sync:harness-skill
 * 或在代码中：import { syncCursorHarnessSkill } from "./sync-cursor-harness-skill.mjs";
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const thisFile = fileURLToPath(import.meta.url);

/** @param {string} absSrc */
function allowCopy(absSrc) {
  const n = absSrc.replace(/\\/g, "/");
  if (/\/node_modules(\/|$)/.test(n)) return false;
  if (/\/\.git(\/|$)/.test(n)) return false;
  if (n.endsWith("/harness.local.env") || n.endsWith("harness.local.env")) return false;
  return true;
}

/**
 * @param {string} repoRoot 仓库根（含 docs、harness、.cursor）
 * @returns {{ docs: boolean; harness: boolean; dest: string }}
 */
export function syncCursorHarnessSkill(repoRoot) {
  const skillDir = join(repoRoot, ".cursor", "skills", "harness-session-framework");
  const syncedRoot = join(skillDir, "_synced");
  const srcDocs = join(repoRoot, "docs");
  const srcHarness = join(repoRoot, "harness");

  if (!existsSync(srcDocs)) {
    throw new Error(`sync-cursor-harness-skill: missing ${srcDocs}`);
  }
  if (!existsSync(srcHarness)) {
    throw new Error(`sync-cursor-harness-skill: missing ${srcHarness}`);
  }

  mkdirSync(skillDir, { recursive: true });
  rmSync(syncedRoot, { recursive: true, force: true });
  mkdirSync(syncedRoot, { recursive: true });

  const filter = (src, _dest) => allowCopy(src);

  cpSync(srcDocs, join(syncedRoot, "docs"), { recursive: true, filter });
  cpSync(srcHarness, join(syncedRoot, "harness"), { recursive: true, filter });

  const readme = `# Synced mirror（勿手工改）

本目录由 **\`npm run sync:harness-skill\`** 从仓库 **\`docs/\`**、**\`harness/\`** 覆盖生成。

- 权威内容在仓库根下对应路径；此处仅供 Cursor Skill 打包阅读。
- 编辑请改 **\`docs/\`** 或 **\`harness/\`**，保存后若已启用 \`after-file-sync-harness-skill\` hook 会自动再同步。

生成时间（本地）：${new Date().toISOString()}
`;
  writeFileSync(join(syncedRoot, "README.md"), readme, "utf8");

  return { docs: true, harness: true, dest: syncedRoot };
}

function main() {
  const repoRoot = join(__dirname, "..", "..");
  try {
    const r = syncCursorHarnessSkill(repoRoot);
    console.log("[sync:harness-skill] OK →", r.dest);
  } catch (e) {
    console.error("[sync:harness-skill]", e?.message || e);
    process.exitCode = 1;
  }
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === thisFile;
if (invokedAsCli) {
  main();
}
