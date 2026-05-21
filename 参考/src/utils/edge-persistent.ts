import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import { log } from "./logger.js";

export type LaunchEdgePersistentResult = {
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
};

export type EdgeUserDataResolution = {
  path: string;
  /** default_data_dir：仓库内 .data/edge-profile；system_auto：EDGE_USER_DATA_DIR=system|auto；explicit：手写路径 */
  source: "default_data_dir" | "system_auto" | "explicit";
};

/** 本机默认安装的 Microsoft Edge「用户数据」根目录（须对应 channel；未检测 Beta/Dev）。 */
export function detectSystemEdgeUserDataDir(): string | undefined {
  const platform = process.platform;
  if (platform === "win32") {
    const local = process.env.LOCALAPPDATA;
    if (!local) return undefined;
    return path.join(local, "Microsoft", "Edge", "User Data");
  }
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Microsoft Edge");
  }
  if (platform === "linux") {
    return path.join(os.homedir(), ".config", "microsoft-edge");
  }
  return undefined;
}

export function resolveEdgeUserDataDir(): EdgeUserDataResolution {
  const raw = (process.env.EDGE_USER_DATA_DIR ?? "").trim();
  if (!raw) {
    return { path: path.join(process.cwd(), ".data", "edge-profile"), source: "default_data_dir" };
  }
  const lowered = raw.toLowerCase();
  if (lowered === "system" || lowered === "auto") {
    const detected = detectSystemEdgeUserDataDir();
    if (!detected || !fs.existsSync(detected)) {
      throw new Error(
        `[save-session=edge] EDGE_USER_DATA_DIR=${JSON.stringify(raw)} 未找到已存在的本机 Edge 数据目录。` +
          ` 请确认已安装 Edge；Windows 一般为 %LOCALAPPDATA%\\Microsoft\\Edge\\User Data ，也可改为该路径的绝对路径。`,
      );
    }
    return { path: detected, source: "system_auto" };
  }
  const p = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  return { path: p, source: "explicit" };
}

/** 供 CLI / 日志：最终 persistent 目录（已 resolve）。 */
export function getEdgeUserDataDir(): string {
  return resolveEdgeUserDataDir().path;
}

function enhanceLaunchError(err: unknown, userDataDir: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  const lowered = msg.toLowerCase();
  const looksLikeProfileLock =
    lowered.includes("already in use") ||
    (lowered.includes("profile") && lowered.includes("in use")) ||
    lowered.includes("singleton") ||
    (lowered.includes("cannot create") && lowered.includes("user data"));

  const hint =
    "若你把 EDGE_USER_DATA_DIR 指向正在使用的 Edge profile，或 Edge 正在占用该目录：请先关闭 Edge，或改用独立目录（推荐 `.data/edge-profile`）。";

  if (looksLikeProfileLock) {
    return new Error(
      `[save-session=edge] 启动 Edge persistent profile 失败（疑似 profile 被占用）：${msg}\n` +
        `- EDGE_USER_DATA_DIR: ${userDataDir}\n` +
        `- ${hint}`,
    );
  }

  return new Error(
    `[save-session=edge] 启动 Edge persistent profile 失败：${msg}\n` + `- EDGE_USER_DATA_DIR: ${userDataDir}\n` + `- ${hint}`,
  );
}

/**
 * 使用 Edge 的 persistent profile 启动浏览器上下文（复用长期登录态）。
 *
 * 注意：该模式默认 **强制 headed**（headless=false），便于首次手动登录与排查。
 *
 * - `EDGE_USER_DATA_DIR=system` 或 `auto`：自动使用本机 Edge 默认用户数据目录（须先退出 Edge）。
 * - `EDGE_PROFILE_DIRECTORY`：可选，多用户配置时传入目录名（如 `Default`、`Profile 1`）。
 */
export async function launchEdgePersistentContext(): Promise<LaunchEdgePersistentResult> {
  const { path: userDataDir, source } = resolveEdgeUserDataDir();
  if (source === "default_data_dir") {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  if (source === "system_auto") {
    log.warn(
      "[save-session=edge] 已自动指向本机 Edge 用户数据目录；请先完全退出 Edge（含后台托盘），否则常报 profile 被占用。",
    );
  }

  const profileDir = (process.env.EDGE_PROFILE_DIRECTORY ?? "").trim();
  const args = ["--disable-blink-features=AutomationControlled"];
  if (profileDir) {
    args.push(`--profile-directory=${profileDir}`);
  }

  let context: BrowserContext;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: "msedge",
      headless: false,
      args,
    });
  } catch (e) {
    throw enhanceLaunchError(e, userDataDir);
  }

  const page = context.pages()[0] ?? (await context.newPage());

  return {
    context,
    page,
    close: async () => {
      await context.close();
    },
  };
}
