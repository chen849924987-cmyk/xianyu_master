/**
 * 从 src/features/<dir>/ 下 .ts 抽取文档用元数据（MCP 文档与目录 README 共用）。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function readUtf8(p) {
  return readFileSync(p, "utf8");
}

export function formatJsDocBody(raw) {
  return raw
    .replace(/^\/\*\*\s?/, "")
    .replace(/\s*\*\/$/, "")
    .replace(/^\s*\* ?/gm, "")
    .trim();
}

/**
 * 优先取文件首屏模块注释；否则取 `export const … FeatureModule` 之前最近一段 JSDoc。
 * @param {string} ts
 */
export function extractFeatureDocComment(ts) {
  const trimmed = ts.trimStart();
  if (trimmed.startsWith("/**")) {
    const close = trimmed.indexOf("*/");
    if (close >= 0) {
      return formatJsDocBody(trimmed.slice(0, close + 2));
    }
  }
  const exportIdx = ts.search(/export const \w+\s*:\s*FeatureModule\s*=/);
  if (exportIdx < 0) return "";
  const head = ts.slice(0, exportIdx);
  const blocks = head.match(/\/\*\*[\s\S]*?\*\//g);
  if (!blocks?.length) return "";
  return formatJsDocBody(blocks[blocks.length - 1]);
}

/** @param {string} text */
export function collectUrls(text) {
  const set = new Set();
  const re = /https?:\/\/[^\s"'`)\]]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    set.add(m[0].replace(/[.,;]+$/, ""));
  }
  return [...set].sort();
}

/** @param {string} text */
export function collectProcessEnvKeys(text) {
  const set = new Set();
  const re = /process\.env\.([A-Z0-9_]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    set.add(m[1]);
  }
  return [...set].sort();
}

/**
 * @param {string} repoRoot
 * @param {string} dir
 */
export function collectFeatureSources(repoRoot, dir) {
  const base = join(repoRoot, "src", "features", dir);
  if (!existsSync(base)) return { combined: "", files: [] };
  const files = readdirSync(base).filter((f) => f.endsWith(".ts")).sort();
  let combined = "";
  for (const f of files) {
    combined += readUtf8(join(base, f)) + "\n";
  }
  return { combined, files };
}
