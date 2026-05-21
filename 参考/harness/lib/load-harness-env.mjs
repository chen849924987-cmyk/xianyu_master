/**
 * 从仓库 harness/harness.env（及可选 harness.local.env）注入 process.env。
 * - 仅当某键在进程中尚未设置（undefined）时才赋值，系统/IDE 环境变量优先。
 * - harness.local.env 后读入，可覆盖 harness.env 中的默认值（仍不覆盖已设置的 process.env）。
 *
 * Cursor hooks：通过 node --import ./harness/lib/load-harness-env.mjs 预加载。
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw || raw.startsWith("#")) continue;
    const eq = raw.indexOf("=");
    if (eq <= 0) continue;
    const key = raw.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = raw.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function applyMerged(merged) {
  for (const [k, v] of Object.entries(merged)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

export function loadHarnessEnv() {
  const harnessDir = join(__dirname, "..");
  const base = parseEnvFile(join(harnessDir, "harness.env"));
  const local = parseEnvFile(join(harnessDir, "harness.local.env"));
  const merged = { ...base, ...local };
  applyMerged(merged);
}

loadHarnessEnv();
