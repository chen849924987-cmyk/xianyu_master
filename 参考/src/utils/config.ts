import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

/** 与 package.json 同目录，避免从子目录启动 CLI 时读不到仓库根 `.env` */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function truthyEnv(v: string | undefined): boolean {
  if (!v) return false;
  return ["1", "true", "yes", "on"].includes(v.trim().toLowerCase());
}

/** 子进程测试需隔离真实 `.env` 时设置 `DOUDIAN_SKIP_REPO_DOTENV=1` */
if (!truthyEnv(process.env.DOUDIAN_SKIP_REPO_DOTENV)) {
  loadEnv({ path: path.join(repoRoot, ".env") });
}

function truthy(v: string | undefined): boolean {
  return truthyEnv(v);
}

const root = process.cwd();

/** 抖店后台默认入口（fxg.jinritemai.com，门户首页与商家后台同域） */
export const DEFAULT_DOUDIAN_BASE_URL = "https://fxg.jinritemai.com";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** 环境变量为空字符串时也回退到默认值，避免 baseUrl 为空导致打开空白页 */
function envOrigin(envVal: string | undefined, fallback: string): string {
  const t = (envVal ?? "").trim();
  return stripTrailingSlash(t || fallback);
}

function boundedMs(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), min), max);
}

export const appConfig = {
  root,
  /** 抖店后台入口，用于拼接各 feature 的路径（可用 DOUDIAN_BASE_URL 覆盖） */
  baseUrl: envOrigin(process.env.DOUDIAN_BASE_URL, DEFAULT_DOUDIAN_BASE_URL),
  /** 飞鸽客服 IM 站点（与后台域名不同，storageState 需含对应 Cookie） */
  imBaseUrl: envOrigin(process.env.DOUDIAN_IM_BASE_URL, "https://im.jinritemai.com"),
  /** Playwright storageState；晓风 zztool 与 fxg 不同域时可改用单独文件，例如 STORAGE_STATE_PATH=.data/storage-state-xf.json */
  storageStatePath: process.env.STORAGE_STATE_PATH
    ? path.resolve(root, process.env.STORAGE_STATE_PATH)
    : path.join(root, ".data", "storage-state.json"),
  headed: truthy(process.env.PLAYWRIGHT_HEADED),
  /** 开启邮箱/密码自动登录（须同时配置 DOUDIAN_LOGIN_EMAIL / DOUDIAN_LOGIN_PASSWORD） */
  passwordLogin: truthy(process.env.DOUDIAN_PASSWORD_LOGIN),
  /** 登录邮箱（勿提交到 git） */
  loginEmail: (process.env.DOUDIAN_LOGIN_EMAIL ?? "").trim() || undefined,
  /** 登录密码（勿提交到 git；禁止写入日志） */
  loginPassword: (process.env.DOUDIAN_LOGIN_PASSWORD ?? "").trim() || undefined,
  /** `login` feature 在工作台校验通过后是否写入 storage-state（密码分支与仅 storage 分支均生效） */
  saveSessionAfterPasswordLogin: truthy(process.env.DOUDIAN_SAVE_SESSION_AFTER_LOGIN),
  /** 检测到滑块/验证码时，headed 模式下最长等待人工完成（毫秒） */
  captchaManualTimeoutMs: boundedMs(process.env.DOUDIAN_CAPTCHA_MANUAL_TIMEOUT_MS, 120_000, 5000, 600_000),
  /**
   * 预留第三方打码：`twocaptcha` 等（首版未接 API，仅打日志后走人工等待）。
   * 合规与费用需自行评估。
   */
  captchaProvider: (process.env.DOUDIAN_CAPTCHA_PROVIDER ?? "").trim().toLowerCase(),
};

export function storageStateExists(): boolean {
  try {
    return fs.statSync(appConfig.storageStatePath).isFile();
  } catch {
    return false;
  }
}
