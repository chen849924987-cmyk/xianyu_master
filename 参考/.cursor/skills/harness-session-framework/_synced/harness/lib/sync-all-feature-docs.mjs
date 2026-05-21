#!/usr/bin/env node
/**
 * 依次刷新：
 * - tests/mcp/features/<id>.md（MCP / AI）
 * - src/features/<dir>/README.md（用户流程）
 */
import { syncAllFeatureMcpDocs } from "./sync-feature-mcp-docs.mjs";
import { syncAllFeatureFolderReadmes } from "./sync-feature-folder-readme.mjs";

const root = process.cwd();
const mcp = syncAllFeatureMcpDocs(root);
const folders = syncAllFeatureFolderReadmes(root);
const all = [...mcp.changedFiles, ...folders.changedFiles];
if (all.length) {
  console.error("[sync-all-feature-docs] updated:\n" + all.map((f) => `  - ${f}`).join("\n"));
} else {
  console.error("[sync-all-feature-docs] already up to date");
}
