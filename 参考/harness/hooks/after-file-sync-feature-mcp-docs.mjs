#!/usr/bin/env node
/**
 * afterFileEdit：保存 src/features 下源码或注册表后，刷新
 * - tests/mcp/features/<id>.md 的 AUTO 区块
 * - src/features/<dir>/README.md 的 AUTO 区块（用户向流程说明的索引区）
 * 禁用：HARNESS_SKIP_FEATURE_MCP_DOC_SYNC=1
 *
 * stdin: { file_path, edits? }
 */
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { syncAllFeatureMcpDocs, syncOneFeatureMcpDoc } from "../lib/sync-feature-mcp-docs.mjs";
import {
  syncAllFeatureFolderReadmes,
  syncOneFeatureFolderReadme,
} from "../lib/sync-feature-folder-readme.mjs";
import { listOrderedFeatureModules } from "../lib/sync-readme-features.mjs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function gitRootFromFile(absolutePath) {
  const dir = dirname(resolve(absolutePath));
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

function normRel(root, absPath) {
  try {
    return relative(root, absPath).replace(/\\/g, "/");
  } catch {
    return "";
  }
}

/** @param {string} rel */
function resolveFeatureDirFromRel(rel) {
  const m = rel.match(/^src\/features\/([^/]+)\//);
  return m ? m[1] : null;
}

function main() {
  if (process.env.HARNESS_SKIP_FEATURE_MCP_DOC_SYNC === "1") {
    console.log(JSON.stringify({}));
    return;
  }

  let data = {};
  try {
    data = JSON.parse(readStdin() || "{}");
  } catch {
    /* ignore */
  }

  const filePath = typeof data.file_path === "string" ? data.file_path : "";
  if (!filePath) {
    console.log(JSON.stringify({}));
    return;
  }

  const root = gitRootFromFile(filePath);
  if (!root) {
    console.log(JSON.stringify({}));
    return;
  }

  const rel = normRel(root, filePath);
  if (!rel || rel.startsWith("..")) {
    console.log(JSON.stringify({}));
    return;
  }

  try {
    if (rel === "src/features/index.ts" || rel === "src/features/types.ts") {
      syncAllFeatureMcpDocs(root);
      syncAllFeatureFolderReadmes(root);
    } else {
      const dir = resolveFeatureDirFromRel(rel);
      if (!dir) {
        console.log(JSON.stringify({}));
        return;
      }
      const mods = listOrderedFeatureModules(root);
      const mod = mods.find((m) => m.dir === dir);
      if (mod) {
        syncOneFeatureMcpDoc(root, mod);
        syncOneFeatureFolderReadme(root, mod);
      }
    }
  } catch (err) {
    console.error("[feature-docs-hook]", err instanceof Error ? err.message : err);
  }

  console.log(JSON.stringify({}));
}

main();
