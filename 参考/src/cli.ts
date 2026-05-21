import path from "node:path";
import {
  appConfig,
  assertFxgLoggedInFromCurrentPage,
  attachFxgStorageStateAutosave,
  launchContext,
  launchEdgePersistentContext,
  log,
  openWorkbenchAndAssertLoggedIn,
  resolveEdgeUserDataDir,
  saveStorageState,
  writePageFailSnapshotFiles,
} from "./utils/index.js";
import { getFeature, listFeatures } from "./features/index.js";
import type { Page } from "playwright";

function printHelp(): void {
  const ids = listFeatures()
    .map((f) => `  ${f.id.padEnd(16)} ${f.displayName}`)
    .join("\n");
  log.info(`用法:
  npm run dev -- --feature=<id>     执行某个页面功能
  npm run dev -- --list             列出全部功能
  npm run dev -- --save-session     打开浏览器，在终端按 Enter 后保存登录态
  npm run dev -- --save-session=watch  Chromium：监听导航，登录成功后自动刷新 STORAGE_STATE_PATH，按 Enter 退出
  npm run dev -- --save-session=edge  使用 Edge persistent profile 自动导出登录态（免扫码）
  也可：npm run dev -- --save-session --via=edge
  复用本机已安装的 Edge 登录：EDGE_USER_DATA_DIR=system（或 auto）npm run dev -- --save-session=edge（须先退出 Edge）
  调试可加 headed：PLAYWRIGHT_HEADED=1 npm run dev -- ...

已注册功能:
${ids}`);
}

function parseVia(argv: string[]): string | undefined {
  const raw = argv.find((a) => a.startsWith("--via="))?.split("=", 2)[1]?.trim().toLowerCase();
  return raw || undefined;
}

function parseSaveSession(argv: string[]): { enabled: boolean; mode: "default" | "edge" | "watch" } {
  const via = parseVia(argv);

  const eqArg = argv.find((a) => a.startsWith("--save-session="));
  if (eqArg) {
    const mode = eqArg.split("=", 2)[1]?.trim().toLowerCase() ?? "";
    if (!mode || mode === "1" || mode === "true" || mode === "yes" || mode === "on") {
      return { enabled: true, mode: via === "edge" ? "edge" : "default" };
    }
    if (mode === "edge") {
      return { enabled: true, mode: "edge" };
    }
    if (mode === "watch") {
      return { enabled: true, mode: "watch" };
    }
    throw new Error(`未知 --save-session 模式: ${mode}（支持：edge、watch；或不带值走默认 Chromium 流程）`);
  }

  if (argv.includes("--save-session")) {
    return { enabled: true, mode: via === "edge" ? "edge" : "default" };
  }

  return { enabled: false, mode: "default" };
}

function edgeSaveSessionWaitMs(): number {
  const n = Number(process.env.DOUDIAN_EDGE_SAVE_SESSION_WAIT_MS);
  if (!Number.isFinite(n)) return 600_000;
  return Math.min(Math.max(Math.floor(n), 5000), 600_000);
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function waitUntilWorkbenchLoggedIn(page: Page): Promise<void> {
  const waitMs = edgeSaveSessionWaitMs();
  const deadline = Date.now() + waitMs;
  let lastErr: unknown;
  const origin = appConfig.baseUrl.replace(/\/$/, "");
  const workbench = `${origin}/ffa/mshop/homepage/index`;
  /** 避免每轮 poll 都 goto：登录页会被反复刷新，验证码/密码无法提交 */
  const reGotoIntervalMs = Math.min(45_000, Math.max(15_000, Math.floor(waitMs / 20)));
  let lastGotoAt = 0;

  log.info(
    `[save-session=edge] 已在当前标签打开工作台地址（首次）；登录过程中请勿切换走该标签。随后仅检测页面状态，约每 ${Math.round(reGotoIntervalMs / 1000)}s 才会再次尝试打开工作台以防卡住。`,
  );

  await page.goto(workbench, { waitUntil: "domcontentloaded", timeout: 120_000 });
  lastGotoAt = Date.now();

  while (Date.now() < deadline) {
    try {
      await assertFxgLoggedInFromCurrentPage(page, { settleMs: 800 });
      await openWorkbenchAndAssertLoggedIn(page, appConfig.baseUrl);
      return;
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      log.warn("[save-session=edge] 仍未进入工作台（若首次使用，请在 Edge 内完成登录）…", msg);
      await sleep(3000);
      if (Date.now() - lastGotoAt >= reGotoIntervalMs) {
        log.info("[save-session=edge] 长时间未进入工作台，再次尝试打开:", workbench);
        await page.goto(workbench, { waitUntil: "domcontentloaded", timeout: 120_000 }).catch(() => {});
        lastGotoAt = Date.now();
      }
    }
  }
  throw new Error(
    `[save-session=edge] 等待超时（${waitMs}ms）：仍未进入抖店工作台。\n` +
      `请在 Edge 中完成登录后重试；或调大 DOUDIAN_EDGE_SAVE_SESSION_WAIT_MS（上限 600000）。\n` +
      `最后一次错误: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }
  if (argv.includes("--list")) {
    for (const f of listFeatures()) {
      log.info(`${f.id}\t${f.displayName}`);
    }
    return;
  }

  let saveSession: { enabled: boolean; mode: "default" | "edge" | "watch" };
  try {
    saveSession = parseSaveSession(argv);
  } catch (e) {
    log.error(e);
    process.exitCode = 1;
    return;
  }
  const featureArg = argv.find((a) => a.startsWith("--feature="));
  const featureId = featureArg?.split("=", 2)[1];

  if (!featureId && !saveSession.enabled) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const launched =
    saveSession.enabled && saveSession.mode === "edge"
      ? await launchEdgePersistentContext()
      : await launchContext();
  const { context, page, close } = launched;

  let shutdownOnceRan = false;
  async function shutdownOnce(): Promise<void> {
    if (shutdownOnceRan) return;
    shutdownOnceRan = true;
    await close();
  }

  /** Web 控制台「Report error」发 SIGTERM：先截当前页 PNG/HTML，再落盘 trace/video */
  process.once("SIGTERM", () => {
    void (async () => {
      const artifactDir = (process.env.DOUDIAN_UI_ARTIFACT_DIR ?? "").trim();
      if (artifactDir) {
        try {
          const base = path.join(
            artifactDir,
            `report-error-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          );
          await writePageFailSnapshotFiles(page, base);
        } catch (e) {
          log.warn("[doudian] SIGTERM 页面临时快照失败:", e);
        }
      }
      await shutdownOnce();
      process.exit(143);
    })();
  });

  try {
    if (saveSession.enabled && saveSession.mode === "edge") {
      if (!appConfig.headed) {
        log.info("[save-session=edge] 提示：Edge 导出模式默认 headed（headless=false），与 PLAYWRIGHT_HEADED 无关。");
      }

      const edgeDir = resolveEdgeUserDataDir();
      log.info(
        "[save-session=edge] EDGE_USER_DATA_DIR(resolved):",
        edgeDir.path,
        edgeDir.source === "system_auto" ? "（本机 Edge User Data 自动路径）" : "",
      );
      log.info("[save-session=edge] 将写入登录态:", appConfig.storageStatePath);
      log.info(
        "[save-session=edge] 若首次未登录，请在弹出的 Edge 中手动登录；程序会轮询工作台断言，通过后自动保存并退出。",
      );

      await waitUntilWorkbenchLoggedIn(page);
      await saveStorageState(context);
      return;
    }

    if (saveSession.enabled && saveSession.mode === "watch") {
      const { detach } = attachFxgStorageStateAutosave(context, page);
      try {
        const origin = appConfig.baseUrl.replace(/\/$/, "");
        const landing = `${origin}/`;
        log.info("[save-session=watch] 将写入登录态:", appConfig.storageStatePath);
        log.info("[save-session=watch] 正在打开抖店入口（可改 DOUDIAN_BASE_URL）:", landing);
        try {
          await page.goto(landing, { waitUntil: "load", timeout: 120_000 });
          try {
            await page.waitForLoadState("networkidle", { timeout: 25_000 });
          } catch {
            /* 站点可能长期有连接 */
          }
        } catch (e) {
          log.warn("[save-session=watch] 自动打开失败，请手动在地址栏输入:", landing, e);
        }
        log.info(
          "[save-session=watch] 监听中：URL/标题判定进入已登录抖店后将自动刷新登录态 JSON；可选配置 DOUDIAN_FXG_LOGIN_SIGNAL_URL 要求额外网络信号。完成后在本终端按 Enter 退出…",
        );
        await new Promise<void>((resolve) => {
          process.stdin.once("data", () => resolve());
        });
        try {
          await assertFxgLoggedInFromCurrentPage(page, { settleMs: 600 });
          await saveStorageState(context);
          log.info("[save-session=watch] 退出前已再次保存登录态");
        } catch {
          log.info("[save-session=watch] 退出前未判定为已登录抖店，跳过额外保存");
        }
      } finally {
        detach();
      }
      return;
    }

    if (saveSession.enabled) {
      const origin = appConfig.baseUrl.replace(/\/$/, "");
      const landing = `${origin}/`;
      log.info("[save-session] 正在打开抖店入口（可改 DOUDIAN_BASE_URL）:", landing);
      try {
        await page.goto(landing, { waitUntil: "load", timeout: 120_000 });
        try {
          await page.waitForLoadState("networkidle", { timeout: 25_000 });
        } catch {
          /* 忽略：站点可能长期有连接 */
        }
      } catch (e) {
        log.warn("[save-session] 自动打开失败，请手动在地址栏输入:", landing, e);
      }
      log.info("请在浏览器中完成登录，完成后在本终端按 Enter 保存登录态…");
      await new Promise<void>((resolve) => {
        process.stdin.once("data", () => resolve());
      });
      await saveStorageState(context);
      return;
    }

    const feature = getFeature(featureId!);
    if (!feature) {
      log.error("未知功能:", featureId);
      process.exitCode = 1;
      return;
    }

    await feature.run({ page, baseUrl: appConfig.baseUrl, browserContext: context });
    log.info("完成:", feature.displayName);
  } finally {
    await shutdownOnce();
  }
}

main().catch((err) => {
  log.error(err);
  process.exitCode = 1;
});
