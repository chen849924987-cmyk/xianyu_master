/**
 * 子进程：在干净/可控的 `process.env` 下读取 `isPasswordLoginConfigured()`。
 * 父进程须设置 `DOUDIAN_SKIP_REPO_DOTENV=1`，避免误读宿主 `.env`。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const distJs = path.join(repoRoot, "dist", "utils", "doudian-password-login.js");
if (!fs.existsSync(distJs)) {
  console.error("is-password-login-configured-worker: run npm run build first (missing dist/utils/doudian-password-login.js)");
  process.exit(2);
}

const href = pathToFileURL(distJs).href;
const { isPasswordLoginConfigured } = await import(href);
process.stdout.write(isPasswordLoginConfigured() ? "1" : "0");
