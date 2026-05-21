import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveRepoRoot } from "./repo-root.js";

const workerPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "is-password-login-configured-worker.mjs",
);

export type SpawnPasswordEnv = Record<string, string | undefined>;

const PASSWORD_LOGIN_ENV_KEYS = [
  "DOUDIAN_PASSWORD_LOGIN",
  "DOUDIAN_LOGIN_EMAIL",
  "DOUDIAN_LOGIN_PASSWORD",
] as const;

/**
 * 在独立 Node 子进程中加载 `dist/utils/doudian-password-login.js` 并返回 `isPasswordLoginConfigured()`。
 */
export function spawnIsPasswordLoginConfigured(env: SpawnPasswordEnv): Promise<boolean> {
  const repoRoot = resolveRepoRoot(import.meta.url);
  const stripped = { ...process.env };
  for (const k of PASSWORD_LOGIN_ENV_KEYS) {
    delete stripped[k];
  }
  const base = { ...stripped, ...env, DOUDIAN_SKIP_REPO_DOTENV: "1" };
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath], {
      cwd: repoRoot,
      env: base,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    child.stdout?.on("data", (c: Buffer) => {
      out += c.toString();
    });
    child.stderr?.on("data", (c: Buffer) => {
      err += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`password-login-config worker exited ${code}: ${err || out}`));
        return;
      }
      resolve(out.trim() === "1");
    });
  });
}
