/**
 * 从 src/features/index.ts 与各 feature 的 index.ts 解析 id / displayName，
 * 写入仓库根 README.md 中 <!-- AUTO:FEATURES:start --> … <!-- AUTO:FEATURES:end --> 区块。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const MARK_START = "<!-- AUTO:FEATURES:start -->";
const MARK_END = "<!-- AUTO:FEATURES:end -->";

function readUtf8(path) {
  return readFileSync(path, "utf8");
}

/** @param {string} ts */
function parseIndexImports(ts) {
  /** @type {Map<string, string>} */
  const nameToDir = new Map();
  const importRe =
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*["']\.\/([^"']+)\/index\.js["']\s*;/g;
  let m;
  while ((m = importRe.exec(ts)) !== null) {
    const dir = m[2];
    const names = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((part) => part.split(/\s+as\s+/)[0].trim());
    for (const name of names) {
      if (name) nameToDir.set(name, dir);
    }
  }
  return nameToDir;
}

/** @param {string} ts */
function parseFeaturesOrder(ts, nameToDir) {
  const start = ts.indexOf("export const features");
  if (start < 0) throw new Error("[readme-sync] export const features not found");
  const eq = ts.indexOf("=", start);
  if (eq < 0) throw new Error("[readme-sync] features '=' not found");
  /** 跳过 `FeatureModule[]` 泛型里的 `[`，取赋值右侧数组字面量 */
  const lb = ts.indexOf("[", eq);
  if (lb < 0) throw new Error("[readme-sync] features array '[' not found");
  let depth = 0;
  let i = lb;
  for (; i < ts.length; i++) {
    const c = ts[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) throw new Error("[readme-sync] unbalanced '[' in features array");
  const body = ts.slice(lb + 1, i);
  const tokens = body.match(/[a-zA-Z_]\w*/g) || [];
  const seen = new Set();
  /** @type {string[]} */
  const order = [];
  for (const t of tokens) {
    if (!nameToDir.has(t) || seen.has(t)) continue;
    seen.add(t);
    order.push(t);
  }
  return order.map((name) => ({ exportName: name, dir: nameToDir.get(name) }));
}

/** @param {string} text */
function parseFeatureMeta(text) {
  const idM = text.match(/\bid:\s*["']([^"']+)["']/);
  const dnM = text.match(/\bdisplayName:\s*["']([^"']+)["']/);
  return {
    id: idM?.[1] ?? "",
    displayName: dnM?.[1] ?? "",
  };
}

function escapeMdCell(s) {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/**
 * @param {string} repoRoot
 * @returns {{ id: string, displayName: string, dir: string }[]}
 */
export function listOrderedFeatureModules(repoRoot) {
  const indexPath = join(repoRoot, "src", "features", "index.ts");
  if (!existsSync(indexPath)) {
    throw new Error(`[readme-sync] missing ${relative(repoRoot, indexPath)}`);
  }
  const indexTs = readUtf8(indexPath);
  const nameToDir = parseIndexImports(indexTs);
  const ordered = parseFeaturesOrder(indexTs, nameToDir);

  /** @type { { id: string, displayName: string, dir: string }[] } */
  const rows = [];
  for (const { dir } of ordered) {
    if (!dir) continue;
    const fp = join(repoRoot, "src", "features", dir, "index.ts");
    if (!existsSync(fp)) {
      throw new Error(`[readme-sync] missing feature file for dir "${dir}"`);
    }
    const meta = parseFeatureMeta(readUtf8(fp));
    if (!meta.id || !meta.displayName) {
      throw new Error(`[readme-sync] id/displayName not found in ${dir}/index.ts`);
    }
    rows.push({ ...meta, dir });
  }
  return rows;
}

/**
 * @param {string} repoRoot
 * @returns {{ markdown: string, rows: { id: string, displayName: string }[] }}
 */
export function buildFeaturesMarkdown(repoRoot) {
  const rows = listOrderedFeatureModules(repoRoot).map(({ id, displayName }) => ({ id, displayName }));

  const lines = [
    "",
    "以下表格由脚本根据 `src/features/index.ts` 与各 feature 模块自动生成；**勿手工编辑表格本体**（可改标题外的说明段落）。",
    "",
    "| id | 说明 |",
    "| --- | --- |",
  ];
  for (const r of rows) {
    lines.push(`| \`${escapeMdCell(r.id)}\` | ${escapeMdCell(r.displayName)} |`);
  }
  lines.push("");
  const markdown = lines.join("\n");
  return { markdown, rows };
}

/**
 * @param {string} repoRoot
 * @returns {{ changed: boolean }}
 */
export function syncReadmeFeatures(repoRoot) {
  const readmePath = join(repoRoot, "README.md");
  if (!existsSync(readmePath)) {
    throw new Error("[readme-sync] README.md not found at repo root");
  }
  const { markdown } = buildFeaturesMarkdown(repoRoot);
  let text = readUtf8(readmePath);
  const si = text.indexOf(MARK_START);
  const ei = text.indexOf(MARK_END);
  if (si < 0 || ei < 0 || ei <= si) {
    throw new Error(
      `[readme-sync] README.md must contain ${MARK_START} and ${MARK_END} in order`,
    );
  }
  const before = text.slice(0, si + MARK_START.length);
  const after = text.slice(ei);
  const next = `${before}\n${markdown}\n${after}`;
  if (next === text) {
    return { changed: false };
  }
  writeFileSync(readmePath, next, "utf8");
  return { changed: true };
}

function main() {
  const repoRoot = process.cwd();
  const { changed } = syncReadmeFeatures(repoRoot);
  console.error(`[readme-sync] ${changed ? "updated README.md" : "README.md already up to date"}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
