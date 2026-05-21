import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** 极短窗口：防连续两次「完成」/ 双击连发 */
const SHORT_MS = Number(process.env.HARNESS_DEBOUNCE_SHORT_MS || 8000);
/** 同 generation_id 去重窗口 */
const WINDOW_MS = Number(process.env.HARNESS_DEBOUNCE_MS || 45_000);

function debouncePath(root) {
  return join(root, ".data", "harness-debounce.json");
}

/**
 * 是否应跳过本次「用户收尾」全流程（beforeSubmitPrompt / CLI 同源）
 */
export function shouldThrottleUserSessionEnd(root, generationId) {
  if (process.env.HARNESS_FORCE_END === "1") return false;
  const p = debouncePath(root);
  if (!existsSync(p)) return false;
  let j;
  try {
    j = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return false;
  }
  const now = Date.now();
  const lastAt = j.last_user_end_at || 0;
  const elapsed = now - lastAt;
  if (elapsed < SHORT_MS) return true;
  const prevG = j.last_generation_id;
  if (elapsed < WINDOW_MS && generationId && prevG && generationId === prevG) return true;
  return false;
}

export function recordUserSessionEnd(root, generationId) {
  const dir = join(root, ".data");
  mkdirSync(dir, { recursive: true });
  const p = debouncePath(root);
  let j = {};
  try {
    if (existsSync(p)) j = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    /* ignore */
  }
  j.last_user_end_at = Date.now();
  if (generationId) j.last_generation_id = generationId;
  writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`, "utf8");
}

const STOP_WINDOW_MS = Number(process.env.HARNESS_AGENT_STOP_DEBOUNCE_MS || 12_000);

function stopStatePath(root) {
  return join(root, ".data", "harness-agent-stop.json");
}

/** Agent 轮次结束（stop hook）防抖：同 fingerprint 在时间窗内只记一次 */
export function shouldThrottleAgentStop(root, fingerprint) {
  if (process.env.HARNESS_FORCE_STOP === "1") return false;
  if (!fingerprint) return false;
  const p = stopStatePath(root);
  if (!existsSync(p)) return false;
  let j;
  try {
    j = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return false;
  }
  const now = Date.now();
  if (now - (j.last_at || 0) >= STOP_WINDOW_MS) return false;
  return j.last_fingerprint === fingerprint;
}

export function recordAgentStop(root, fingerprint) {
  const dir = join(root, ".data");
  mkdirSync(dir, { recursive: true });
  const p = stopStatePath(root);
  writeFileSync(
    p,
    `${JSON.stringify({ last_at: Date.now(), last_fingerprint: fingerprint }, null, 2)}\n`,
    "utf8",
  );
}
