import type { BrowserContext, Frame, Page, Response } from "playwright";
import { saveStorageState } from "./browser.js";
import { isFxgLoggedInFromUrlAndTitle } from "./doudian-session.js";
import { log } from "./logger.js";

export type AttachFxgStorageStateAutosaveOptions = {
  settleMs?: number;
  debounceMs?: number;
  minSaveIntervalMs?: number;
  /** 非空则要求近期出现过匹配的 XHR（仍须 URL/标题判定可同时保存） */
  loginSignalUrlPattern?: string;
  /** 可选：响应 body 须包含该子串（会调用 response.text()，极少数接口可能与页面抢读 body） */
  loginSignalBodySubstring?: string;
};

function globPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

/** `*` 通配；无 `*` 时按子串匹配 */
export function urlMatchesLoginSignal(url: string, pattern: string): boolean {
  const t = pattern.trim();
  if (!t) return false;
  if (!t.includes("*")) return url.includes(t);
  try {
    return globPatternToRegExp(t).test(url);
  } catch {
    return url.includes(t.replace(/\*/g, ""));
  }
}

function minIntervalFromEnv(): number {
  const n = Number(process.env.DOUDIAN_STORAGE_AUTOSAVE_MIN_INTERVAL_MS);
  if (!Number.isFinite(n)) return 3000;
  return Math.min(Math.max(Math.floor(n), 500), 600_000);
}

function signalUrlFromEnv(options?: AttachFxgStorageStateAutosaveOptions): string {
  return (options?.loginSignalUrlPattern ?? process.env.DOUDIAN_FXG_LOGIN_SIGNAL_URL ?? "").trim();
}

function signalBodyFromEnv(options?: AttachFxgStorageStateAutosaveOptions): string {
  return (options?.loginSignalBodySubstring ?? process.env.DOUDIAN_FXG_LOGIN_SIGNAL_BODY_SUBSTRING ?? "").trim();
}

/**
 * 监听主 frame 导航：当「可保存登录态」条件由假变真时写入 {@link saveStorageState}。
 * 可选：配置 `DOUDIAN_FXG_LOGIN_SIGNAL_URL`（及可选 body 子串）时，还须近期出现过匹配的响应。
 */
export function attachFxgStorageStateAutosave(
  context: BrowserContext,
  page: Page,
  options?: AttachFxgStorageStateAutosaveOptions,
): { detach: () => void } {
  const settleMs = options?.settleMs ?? 800;
  const debounceMs = options?.debounceMs ?? 400;
  const minSaveIntervalMs = options?.minSaveIntervalMs ?? minIntervalFromEnv();
  const signalUrl = signalUrlFromEnv(options);
  const signalBody = signalBodyFromEnv(options);
  const requireNetSignal = Boolean(signalUrl);

  let networkSignalOk = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let prevCanSave = false;
  let lastSaveAt = 0;
  let closed = false;

  const scheduleEval = (): void => {
    if (closed) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void evalSave();
    }, debounceMs);
  };

  const onResponse = (response: Response): void => {
    if (!signalUrl || closed) return;
    void (async () => {
      try {
        if (response.request().resourceType() !== "xhr" && response.request().resourceType() !== "fetch") {
          return;
        }
        if (!urlMatchesLoginSignal(response.url(), signalUrl)) return;
        if (response.status() < 200 || response.status() >= 300) return;
        if (signalBody) {
          const text = await response.text();
          if (!text.includes(signalBody)) return;
        }
        networkSignalOk = true;
        scheduleEval();
      } catch {
        /* ignore */
      }
    })();
  };

  const evalSave = async (): Promise<void> => {
    if (closed) return;
    await new Promise((r) => setTimeout(r, settleMs));
    if (closed) return;
    const finalUrl = page.url();
    const title = await page.title().catch(() => "");
    const pageShowsLoggedIn = isFxgLoggedInFromUrlAndTitle(finalUrl, title);

    if (!pageShowsLoggedIn) {
      networkSignalOk = false;
      prevCanSave = false;
      return;
    }

    const canSave = pageShowsLoggedIn && (!requireNetSignal || networkSignalOk);
    const rising = canSave && !prevCanSave;

    if (!rising) {
      prevCanSave = canSave;
      return;
    }

    const now = Date.now();
    if (now - lastSaveAt < minSaveIntervalMs) {
      const wait = minSaveIntervalMs - (now - lastSaveAt);
      log.info(`[storage-autosave] 就绪但距上次保存不足 ${minSaveIntervalMs}ms，${wait}ms 后重试`);
      setTimeout(() => scheduleEval(), wait);
      return;
    }

    try {
      await saveStorageState(context);
      lastSaveAt = Date.now();
      prevCanSave = true;
      log.info("[storage-autosave] 检测到登录态就绪，已刷新 STORAGE_STATE_PATH");
    } catch (e) {
      log.warn("[storage-autosave] 写入登录态失败:", e);
    }
  };

  const onFrameNavigated = (frame: Frame): void => {
    if (frame !== page.mainFrame()) return;
    scheduleEval();
  };

  if (requireNetSignal) {
    page.on("response", onResponse);
    log.info(
      "[storage-autosave] 已启用网络辅助信号 URL pattern:",
      signalUrl,
      signalBody ? `body 须含子串（长度 ${signalBody.length}）` : "",
    );
  }

  page.on("framenavigated", onFrameNavigated);

  return {
    detach: () => {
      if (closed) return;
      closed = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = null;
      page.off("framenavigated", onFrameNavigated);
      page.off("response", onResponse);
    },
  };
}
