import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { appConfig, storageStateExists } from "./config.js";
import { log } from "./logger.js";
import { getStorageStateMeta } from "./storage-state-meta.js";

/** 校验文件内容为合法 JSON；损坏时勿传给 Playwright（否则会抛 SyntaxError）。 */
function usableStorageStatePath(): string | undefined {
  const meta = getStorageStateMeta();
  if (!meta.exists) return undefined;
  if (meta.validJson) return meta.path;
  log.warn(
    "登录态文件 JSON 无效，已跳过注入（请重新执行 npm run dev -- --save-session 或恢复备份）:",
    (meta.parseError || "").slice(0, 200),
  );
  return undefined;
}

export type LaunchResult = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
};

/**
 * 启动 Chromium。若存在 STORAGE_STATE 则注入登录态。
 */
export async function launchContext(): Promise<LaunchResult> {
  const statePath = usableStorageStatePath();
  if (statePath) {
    log.info("使用登录态文件:", statePath);
  } else if (storageStateExists()) {
    /* 文件存在但不可用：usableStorageStatePath 已打 warn */
  } else {
    log.warn("未找到登录态文件，登录后可执行 save-session 保存 Cookie");
  }

  const artifactDir = (process.env.DOUDIAN_UI_ARTIFACT_DIR ?? "").trim();
  const videoDir = artifactDir ? path.join(artifactDir, "video") : "";
  let tracingStarted = false;
  let closed = false;

  const browser = await chromium.launch({
    headless: !appConfig.headed,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  if (artifactDir) {
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.mkdirSync(videoDir, { recursive: true });
    log.info("[doudian] UI 任务 trace/video 目录:", artifactDir);
  }

  const context = await browser.newContext({
    ...(statePath ? { storageState: statePath } : {}),
    ...(artifactDir ? { recordVideo: { dir: videoDir } } : {}),
  });

  if (artifactDir) {
    await context.tracing.start({ screenshots: true, snapshots: true });
    tracingStarted = true;
  }

  const page = await context.newPage();

  return {
    browser,
    context,
    page,
    close: async () => {
      if (closed) return;
      closed = true;
      try {
        if (artifactDir && tracingStarted) {
          const tracePath = path.join(artifactDir, "trace.zip");
          await context.tracing.stop({ path: tracePath });
          tracingStarted = false;
          log.info("[doudian] trace 已写入:", tracePath);
        }
      } catch (e) {
        log.warn("[doudian] trace 停止失败:", e);
      }
      try {
        await context.close();
      } catch {
        /* ignore */
      }
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    },
  };
}

/** 将当前上下文的 Cookie/LocalStorage 等写入配置的 storage 路径 */
export async function saveStorageState(context: BrowserContext): Promise<void> {
  const dir = path.dirname(appConfig.storageStatePath);
  fs.mkdirSync(dir, { recursive: true });
  await context.storageState({ path: appConfig.storageStatePath });
  log.info("已保存登录态:", appConfig.storageStatePath);
}
