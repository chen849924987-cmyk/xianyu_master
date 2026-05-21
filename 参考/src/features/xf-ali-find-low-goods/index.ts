/**
 * 晓风 · 低价好物筛选（AGENT_TODOLIST 1.1）
 *
 * 环境变量：
 * - XF_SUPER_GOODS_URL — 低价好物页（默认 zzbtool hash 路由）
 * - 默认先打开抖店工作台首页（/ffa/mshop/homepage/index，与 dashboard 一致），再跳转晓风或走服务市场
 * - XF_SKIP_DOUDIAN_HOME=1 — 跳过上述抖店首页，直达服务市场或 XF_SUPER_GOODS_URL（旧行为）
 * - XF_NAV_VIA_DOUYIN=1 — 先从抖店进服务市场（如 fuwu.jinritemai.com），再点击右侧「常用服务」或「已购服务」里的「晓风上货-商品管理管家/专家」等入口（勿只靠直达 URL，否则登录态可能不对）
 * - XF_SERVICE_MARKET_URL — 服务市场完整 URL（与 XF_NAV_VIA_DOUYIN 联用，须自行从后台复制稳定链接）
 * - XF_SERVICE_MARKET_PATH — 相对 DOUDIAN_BASE_URL 的路径（XF_SERVICE_MARKET_URL 未设时使用）
 * - STORAGE_STATE_PATH — 见 appConfig；晓风/zztool 与抖店不同域时需在同一 save-session 流程里登录或单独 JSON
 * - XF_SKIP_FAIL_ARTIFACTS=1 — 关闭失败时自动 dump（默认开启：整页截图 PNG + HTML + Playwright trace）
 *
 * 失败时写入 `xf-fail-*.{png,html}` 与 `*.trace.zip`（Web 任务优先写入 `DOUDIAN_UI_ARTIFACT_DIR`，否则 `.data/xf-artifacts/`；可用 `npx playwright show-trace <zip路径>` 查看）。
 *
 * 开发时用 PLAYWRIGHT_HEADED=1 + npm run codegen -- <url> 校准选择器；亦可用 Cursor 浏览器 MCP 对照快照（见 .cursor/rules/local-mcp-validation.mdc）。
 */
import type { FeatureModule } from "../types.js";
import type { BrowserContext, Frame, Locator, Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { appConfig, log, writePageFailSnapshotFiles } from "../../utils/index.js";
import {
  serializeJobStepLine,
  type JobStepPhase,
  type XfLowGoodsStepId,
  XF_LOW_GOODS_UI_FEATURE_ID,
} from "./ui-pipeline.js";

function emitJobStep(
  stepId: XfLowGoodsStepId,
  phase: JobStepPhase,
  detail?: string,
  meta?: Record<string, unknown>,
): void {
  log.info(
    serializeJobStepLine({
      featureId: XF_LOW_GOODS_UI_FEATURE_ID,
      stepId,
      phase,
      detail,
      meta,
    }),
  );
}

const DEFAULT_LOW_GOODS_URL =
  "https://xfdyorder.zzbtool.com/zzb_super_goods_xf/index.html#/home/aliFindLowGoods";

function candidatesDir(): string {
  return path.join(appConfig.root, ".data", "xf-candidates");
}

function xfSuperGoodsUrl(): string {
  return (process.env.XF_SUPER_GOODS_URL ?? DEFAULT_LOW_GOODS_URL).trim();
}

function truthyEnv(name: string): boolean {
  const v = process.env[name];
  if (!v) return false;
  return ["1", "true", "yes", "on"].includes(v.trim().toLowerCase());
}

function xfArtifactsEnabled(): boolean {
  return !truthyEnv("XF_SKIP_FAIL_ARTIFACTS");
}

/** Web UI 任务由 `launchContext` 写入 trace.zip + video/，勿再启第二层 tracing */
function xfUiUnifiedArtifacts(): boolean {
  return Boolean((process.env.DOUDIAN_UI_ARTIFACT_DIR ?? "").trim());
}

/** 失败落盘目录：控制台任务与 trace 同目录，便于一并查看 */
function xfFailArtifactsDir(): string {
  const ui = (process.env.DOUDIAN_UI_ARTIFACT_DIR ?? "").trim();
  if (ui) return ui;
  return path.join(appConfig.root, ".data", "xf-artifacts");
}

type XfTraceFlag = { current: boolean };

/** 失败调试：当前页截图 + HTML + 停止并落盘 trace（可选重启录制以便后续步骤继续记录） */
async function xfSaveFailArtifacts(
  page: Page,
  browserContext: BrowserContext | undefined,
  traceActive: XfTraceFlag,
  reason: string,
  opts?: { restartTrace?: boolean },
): Promise<void> {
  const dir = xfFailArtifactsDir();
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(
    dir,
    `xf-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  await writePageFailSnapshotFiles(page, base);
  log.warn("[xf-1.1] 原因:", reason);

  if (traceActive.current && browserContext) {
    try {
      const tracePath = `${base}.trace.zip`;
      await browserContext.tracing.stop({ path: tracePath });
      traceActive.current = false;
      log.warn(
        "[xf-1.1] Playwright trace 已写入:",
        tracePath,
        "（npx playwright show-trace <路径>）",
      );
    } catch (e) {
      log.warn("[xf-1.1] trace 落盘失败:", e);
      traceActive.current = false;
    }
  }

  if (opts?.restartTrace && xfArtifactsEnabled() && browserContext) {
    try {
      await browserContext.tracing.start({
        screenshots: true,
        snapshots: true,
      });
      traceActive.current = true;
      log.info("[xf-1.1] 已重新开始录制 trace（后续步骤）");
    } catch (e) {
      log.warn("[xf-1.1] trace 重启失败:", e);
    }
  }
}

async function xfDiscardTraceIfAny(
  browserContext: BrowserContext | undefined,
  traceActive: XfTraceFlag,
): Promise<void> {
  if (!traceActive.current || !browserContext) return;
  try {
    await browserContext.tracing.stop();
  } catch {
    /* 忽略：已成功落盘或已停止 */
  }
  traceActive.current = false;
}

async function settle(page: Page): Promise<void> {
  await new Promise((r) => setTimeout(r, 1200));
  await page
    .waitForLoadState("networkidle", { timeout: 20_000 })
    .catch(() => {});
}

/** 先落抖店工作台首页（不 assert 登录，避免无头场景直接抛错） */
async function openDoudianWorkbenchHomeFirst(
  page: Page,
  baseUrl: string,
): Promise<void> {
  const origin = baseUrl.replace(/\/$/, "");
  const target = `${origin}/ffa/mshop/homepage/index`;
  log.info("[xf-1.1] 打开抖店工作台首页:", target);
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await settle(page);
}

/**
 * 服务市场首页常为 SPA：侧栏「常用服务 / 已购服务」晚于 domcontentloaded 渲染，且文案可能拆在多节点上。
 */
async function waitForFuwuMarketSidecar(page: Page): Promise<void> {
  try {
    await page
      .getByText(/常用服务|已购服务/, { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 45_000 });
  } catch {
    try {
      await page
        .getByText(/晓风上货/, { exact: false })
        .first()
        .waitFor({ state: "visible", timeout: 20_000 });
    } catch {
      log.warn(
        "[xf-1.1] 未等到侧栏文案（常用服务/已购服务/晓风），仍将尝试点击（可能仍在加载）",
      );
    }
  }
  /* 与 MCP 实录一致：侧栏出现后仍再等一会儿让列表项可稳定点击 */
  await new Promise((r) => setTimeout(r, 2200));
}

/**
 * 服务市场页内点击晓风入口。
 * 策略与 MCP 校验一致：页面上「晓风上货」多处可见（右侧常用服务 + 中部店铺经营工具大卡），
 * 必须先限制在含「常用服务」/「已购服务」标题的窄容器内再点，避免误点中部卡片。
 */
async function clickXiaofengInFrame(frame: Frame): Promise<boolean> {
  const fullTitles = [
    "晓风上货-商品管理管家",
    "晓风上货－商品管理管家",
    "晓风上货-商品管理专家",
    "晓风上货－商品管理专家",
  ] as const;
  /** ASCII `-` 或全角 `－`（U+FF0D）；尾部可能是「管家」或「专家」 */
  const titleRe = /晓风上货[-\uFF0D]商品管理(管家|专家)/;
  const shortRe = /晓风上货/;
  const visMs = 8500;

  async function tryClick(loc: Locator, tag: string): Promise<boolean> {
    try {
      const n = await loc.count();
      for (let i = 0; i < Math.min(n, 16); i++) {
        const el = loc.nth(i);
        if (!(await el.isVisible({ timeout: visMs }).catch(() => false)))
          continue;
        await el.scrollIntoViewIfNeeded({ timeout: 12_000 });
        await el.click({ timeout: 22_000 });
        log.info("[xf-1.1] 已点击晓风入口:", tag, "index=", i);
        return true;
      }
    } catch {
      /* next strategy */
    }
    return false;
  }

  async function tryForceClick(loc: Locator, tag: string): Promise<boolean> {
    try {
      if ((await loc.count()) === 0) return false;
      const el = loc.first();
      await el.scrollIntoViewIfNeeded({ timeout: 12_000 }).catch(() => {});
      if (!(await el.isVisible({ timeout: visMs }).catch(() => false)))
        return false;
      await el.click({ timeout: 22_000, force: true });
      log.info("[xf-1.1] 已点击晓风入口(force):", tag);
      return true;
    } catch {
      return false;
    }
  }

  /** ① 优先：侧栏「常用服务」→「已购服务」，容器须同时含分区标题与完整晓风标题，避免命中中部工具区 */
  for (const sectionRe of [/常用服务/, /已购服务/] as const) {
    const panel = frame
      .locator("div, section, article")
      .filter({ hasText: sectionRe })
      .filter({ hasText: titleRe })
      .first();
    const tagBase =
      sectionRe.source === "常用服务" ? "common-svc" : "purchased-svc";

    if (
      await tryClick(
        panel
          .locator("a, button, [role='button'], [role='link']")
          .filter({ hasText: titleRe }),
        `${tagBase}-clickable-titleRe`,
      )
    )
      return true;
    if (
      await tryForceClick(
        panel.locator("div, li").filter({ hasText: titleRe }),
        `${tagBase}-row-titleRe-force`,
      )
    )
      return true;

    for (const t of fullTitles) {
      if (
        await tryClick(panel.getByText(t, { exact: true }), `${tagBase}-exact:${t}`)
      )
        return true;
    }
    if (await tryClick(panel.getByText(titleRe), `${tagBase}-title-re`))
      return true;
    if (
      await tryClick(
        panel.getByRole("link", { name: titleRe }),
        `${tagBase}-link-title`,
      )
    )
      return true;
    if (
      await tryClick(
        panel.getByRole("link", { name: shortRe }),
        `${tagBase}-link-short`,
      )
    )
      return true;
    if (
      await tryClick(
        panel.getByRole("button", { name: titleRe }),
        `${tagBase}-btn-title`,
      )
    )
      return true;
  }

  const sideRoots: Locator[] = [
    frame.locator("aside"),
    frame.getByRole("complementary"),
    frame
      .locator("[class*='sidebar'], [class*='Sidebar'], [class*='sideBar']")
      .filter({ hasText: /常用服务|已购服务|晓风/ }),
  ];

  for (const root of sideRoots) {
    for (const t of fullTitles) {
      if (await tryClick(root.getByText(t, { exact: true }), `side-exact:${t}`))
        return true;
    }
    if (await tryClick(root.getByText(titleRe), "side-title-re")) return true;
    if (await tryClick(root.getByText(shortRe), "side-short-re")) return true;
    if (
      await tryClick(
        root.getByRole("link", { name: titleRe }),
        "side-link-title",
      )
    )
      return true;
    if (
      await tryClick(
        root.getByRole("link", { name: shortRe }),
        "side-link-short",
      )
    )
      return true;
    if (
      await tryClick(
        root.getByRole("button", { name: titleRe }),
        "side-btn-title",
      )
    )
      return true;
  }

  /** ② 兜底：全页可点元素（可能点到中部「店铺经营工具」同名卡片，仅在前述失败后使用） */
  if (
    await tryClick(
      frame
        .locator("a, button, [role='button'], [role='link']")
        .filter({ hasText: titleRe }),
      "flat-clickable-titleRe",
    )
  )
    return true;

  if (
    await tryForceClick(
      frame.locator("div, li, tr, section").filter({ hasText: titleRe }),
      "block-titleRe-force",
    )
  )
    return true;

  for (const t of fullTitles) {
    if (await tryClick(frame.getByText(t, { exact: true }), "page-exact"))
      return true;
  }
  if (await tryClick(frame.getByText(titleRe), "page-title-re")) return true;

  if (
    await tryForceClick(frame.getByText(titleRe, { exact: false }), "text-titleRe-force")
  )
    return true;
  if (
    await tryForceClick(frame.getByText(shortRe, { exact: false }), "text-short-force")
  )
    return true;

  for (const role of ["link", "button"] as const) {
    if (
      await tryClick(
        frame.getByRole(role, { name: titleRe }),
        `role-${role}-title`,
      )
    )
      return true;
    if (
      await tryClick(
        frame.getByRole(role, { name: shortRe }),
        `role-${role}-short`,
      )
    )
      return true;
  }

  if (
    await tryClick(
      frame
        .locator("a, button, [role='button'], [role='link']")
        .filter({ hasText: shortRe }),
      "clickable-short",
    )
  )
    return true;

  return false;
}

async function clickXiaofengFromFuWuMarketPage(page: Page): Promise<boolean> {
  await waitForFuwuMarketSidecar(page);
  await new Promise((r) => setTimeout(r, 500));
  await page.mouse.wheel(0, 320).catch(() => {});
  await new Promise((r) => setTimeout(r, 450));

  for (const frame of page.frames()) {
    try {
      if (await clickXiaofengInFrame(frame)) return true;
    } catch {
      /* 忽略跨域 frame 等 */
    }
  }
  return false;
}

/**
 * 可选：抖店后台 → 服务市场 → 点击晓风入口（新标签页则切换到最新页）。
 * `clickedXiaofeng`: null 表示未尝试点击（无 URL）；true/false 表示是否点到晓风入口。
 */
async function navigateViaDouyinServiceMarket(
  entryPage: Page,
): Promise<{ page: Page; clickedXiaofeng: boolean | null }> {
  let page = entryPage;
  const smUrl =
    (process.env.XF_SERVICE_MARKET_URL || "").trim() ||
    (() => {
      const p = (process.env.XF_SERVICE_MARKET_PATH || "").trim();
      if (!p) return "";
      const origin = appConfig.baseUrl.replace(/\/$/, "");
      const pathPart = p.startsWith("/") ? p : `/${p}`;
      return `${origin}${pathPart}`;
    })();

  if (!smUrl) {
    emitJobStep(
      "service_market",
      "warn",
      "已开启 XF_NAV_VIA_DOUYIN 但未设置 XF_SERVICE_MARKET_URL / XF_SERVICE_MARKET_PATH",
    );
    log.warn(
      "[xf-1.1] XF_NAV_VIA_DOUYIN 已开启但未设置 XF_SERVICE_MARKET_URL 或 XF_SERVICE_MARKET_PATH，跳过服务市场导航",
    );
    return { page, clickedXiaofeng: null };
  }

  log.info("[xf-1.1] 打开服务市场:", smUrl);
  await page.goto(smUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForLoadState("load", { timeout: 90_000 }).catch(() => {});
  await settle(page);

  const ctx = page.context();
  const nBefore = ctx.pages().length;

  const clicked = await clickXiaofengFromFuWuMarketPage(page);

  if (!clicked) {
    log.warn(
      "[xf-1.1] 未点到「晓风」入口（右侧「常用服务」或「已购服务」中的「晓风上货-商品管理管家/专家」）；请 PLAYWRIGHT_HEADED=1 对照 DOM 或 npm run codegen -- <服务市场URL>",
    );
    return { page, clickedXiaofeng: false };
  }

  await new Promise((r) => setTimeout(r, 2500));
  const pages = ctx.pages();
  if (pages.length > nBefore) {
    page = pages[pages.length - 1];
    await page
      .waitForLoadState("domcontentloaded", { timeout: 60_000 })
      .catch(() => {});
    log.info("[xf-1.1] 已切换到新标签页:", page.url().slice(0, 120));
  }

  emitJobStep("service_market", "done", undefined, {
    tabUrl: page.url().slice(0, 240),
    newTab: pages.length > nBefore,
  });
  return { page, clickedXiaofeng: true };
}

async function tryClickText(
  page: Page,
  labels: string[],
  timeoutEachMs: number,
): Promise<string | null> {
  for (const label of labels) {
    const loc = page.getByText(label, { exact: false }).first();
    try {
      await loc.waitFor({ state: "visible", timeout: timeoutEachMs });
      await loc.click();
      log.info("[xf-1.1] 已点击:", label);
      await settle(page);
      return label;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function tryFillPriceRange(
  page: Page,
  minYuan: number,
  maxYuan: number,
): Promise<boolean> {
  const pairs: [Locator, string][] = [
    [page.locator('input[placeholder*="进货"]').first(), String(minYuan)],
    [page.locator('input[placeholder*="最低"]').first(), String(minYuan)],
    [page.locator('input[placeholder*="最小"]').first(), String(minYuan)],
  ];
  const maxPairs: [Locator, string][] = [
    [page.locator('input[placeholder*="最高"]').first(), String(maxYuan)],
    [page.locator('input[placeholder*="最大"]').first(), String(maxYuan)],
    [page.locator('input[placeholder*="进货"]').nth(1), String(maxYuan)],
  ];

  let filled = false;
  for (const [loc, val] of [...pairs, ...maxPairs]) {
    try {
      if (await loc.isVisible({ timeout: 800 }).catch(() => false)) {
        await loc.fill(val);
        filled = true;
      }
    } catch {
      /* continue */
    }
  }
  if (filled) log.info("[xf-1.1] 已尝试填写进货价:", minYuan, "-", maxYuan);
  return filled;
}

async function trySortBySales(page: Page): Promise<string | null> {
  for (const label of ["销量", "最近销量", "月销量", "热销"]) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    const tab = page.locator(`[role="tab"]:has-text("${label}")`).first();
    const span = page.locator(`span:has-text("${label}")`).first();
    for (const loc of [btn, tab, span]) {
      try {
        if (await loc.isVisible({ timeout: 600 }).catch(() => false)) {
          await loc.click();
          log.info("[xf-1.1] 已尝试排序:", label);
          await settle(page);
          return label;
        }
      } catch {
        /* next */
      }
    }
  }
  return null;
}

async function addVisibleRowsToPool(
  page: Page,
  maxItems: number,
): Promise<{
  items: { title: string; snippet: string }[];
  poolClicks: number;
}> {
  const picked: { title: string; snippet: string }[] = [];
  let poolClicks = 0;

  const candidateButtons = page
    .locator("button, a[role='button'], .el-button")
    .filter({ hasText: /加入候选|候选池|加入.*候选/ });

  const count = await candidateButtons.count();
  const limit = Math.min(count, maxItems);
  for (let i = 0; i < limit; i++) {
    try {
      const btn = candidateButtons.nth(i);
      const snippet = await btn.evaluate((el) => {
        let n: unknown = el;
        for (let d = 0; d < 8; d++) {
          if (!n || typeof n !== "object") break;
          const rec = n as {
            innerText?: string;
            textContent?: string | null;
            parentElement?: unknown;
          };
          const t = String(rec.innerText ?? "").trim();
          if (t.length > 30) return t.slice(0, 600);
          n = rec.parentElement;
        }
        const leaf = el as { textContent?: string | null };
        return String(leaf.textContent ?? "")
          .trim()
          .slice(0, 200);
      });
      await btn.click();
      poolClicks += 1;
      const title =
        snippet
          .split(/\r?\n/)
          .find((l: string) => l.trim().length > 2)
          ?.trim()
          .slice(0, 120) || `item_${i}`;
      picked.push({
        title,
        snippet: snippet.replace(/\s+/g, " ").slice(0, 500),
      });
      log.info("[xf-1.1] 候选池点击:", title);
      await settle(page);
    } catch (e) {
      log.warn("[xf-1.1] 第", i + 1, "条入池失败:", String(e));
    }
  }

  if (picked.length === 0) {
    const rows = page.locator(
      "tbody tr, .goods-list .goods-item, .el-table__body tr",
    );
    const rowCount = await rows.count();
    for (let i = 0; i < Math.min(rowCount, maxItems); i++) {
      const row = rows.nth(i);
      const text = (await row.innerText().catch(() => ""))
        .replace(/\s+/g, " ")
        .slice(0, 500);
      if (text.length > 10)
        picked.push({ title: text.slice(0, 80), snippet: text });
    }
  }

  return { items: picked, poolClicks };
}

export const xfAliFindLowGoodsFeature: FeatureModule = {
  id: "xf-ali-find-low-goods",
  displayName: "晓风上货·低价好物筛选（1.1）",
  async run({ page, baseUrl, browserContext }) {
    const traceActive: XfTraceFlag = { current: false };
    if (xfArtifactsEnabled() && browserContext && !xfUiUnifiedArtifacts()) {
      await browserContext.tracing.start({
        screenshots: true,
        snapshots: true,
      });
      traceActive.current = true;
    }

    try {
      const lowUrl = xfSuperGoodsUrl();
      const skipDoudianHome = truthyEnv("XF_SKIP_DOUDIAN_HOME");
      let openedDoudianHome = false;
      const origin = baseUrl.replace(/\/$/, "");
      const homeUrl = `${origin}/ffa/mshop/homepage/index`;

      if (!skipDoudianHome) {
        emitJobStep("doudian_home", "start", "打开抖店工作台首页");
        await openDoudianWorkbenchHomeFirst(page, baseUrl);
        emitJobStep("doudian_home", "done", undefined, { url: homeUrl });
        openedDoudianHome = true;
      } else {
        emitJobStep("doudian_home", "skipped", "XF_SKIP_DOUDIAN_HOME=1");
      }

      if (truthyEnv("XF_NAV_VIA_DOUYIN")) {
        emitJobStep("service_market", "start", "服务市场导航");
        const sm = await navigateViaDouyinServiceMarket(page);
        page = sm.page;
        if (sm.clickedXiaofeng === false) {
          const detail =
            "未点到晓风入口（右侧「常用服务」或「已购服务」列表）；请 headed 对照页面或 codegen 校准 DOM";
          emitJobStep("service_market", "error", detail);
          throw new Error(
            `[xf-1.1] service_market:${detail}。也可暂时关闭 XF_NAV_VIA_DOUYIN 使用直达低价好物 URL（登录域可能不同）。`,
          );
        }
      } else {
        emitJobStep(
          "service_market",
          "done",
          "直达链路：未开启 XF_NAV_VIA_DOUYIN，不经服务市场，随后将直接打开低价好物页 URL",
        );
      }

      emitJobStep("open_low_goods", "start", undefined, { url: lowUrl });
      log.info("[xf-1.1] 打开低价好物页:", lowUrl);
      await page.goto(lowUrl, {
        waitUntil: "domcontentloaded",
        timeout: 180_000,
      });
      await settle(page);
      emitJobStep("open_low_goods", "done", undefined, { url: lowUrl });

      const loginHintVisible = await page
        .locator("text=登录")
        .first()
        .isVisible({ timeout: 2500 })
        .catch(() => false);
      if (loginHintVisible) {
        emitJobStep(
          "page_login_hint",
          "warn",
          "可能出现登录墙；请 headed save-session 完成抖店→晓风登录链",
        );
        log.warn(
          "[xf-1.1] 页面可能出现登录墙；请 PLAYWRIGHT_HEADED=1 执行 save-session，并在同一浏览器完成抖店→服务市场→晓风登录。",
        );
      } else {
        emitJobStep("page_login_hint", "done", "未检测到明显「登录」入口");
      }

      emitJobStep("tab_navigation", "start", "切换低价好物 / 类目 Tab");
      const primaryTab = await tryClickText(
        page,
        ["低价好物", "低价", "阿里找货"],
        8000,
      );
      const categoryTab = await tryClickText(
        page,
        ["毛绒玩具类", "毛绒玩具", "玩具/毛绒"],
        8000,
      );
      emitJobStep("tab_navigation", "done", undefined, {
        primaryTab,
        categoryTab,
      });

      emitJobStep("filters", "start", "进货价、排序、查询");
      const priceFilled = await tryFillPriceRange(page, 0, 15);
      const sortLabel = await trySortBySales(page);
      let queryClicked = false;
      try {
        const queryBtn = page
          .getByRole("button", { name: /查询|搜索|筛选/ })
          .first();
        if (await queryBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
          await queryBtn.click();
          queryClicked = true;
          await settle(page);
        }
      } catch {
        /* optional */
      }
      emitJobStep("filters", "done", undefined, {
        priceMin: 0,
        priceMax: 15,
        priceFilled,
        sortLabel,
        queryClicked,
      });

      emitJobStep("pool_snapshot", "start", "加入候选池并写入本地 JSON");
      const maxPick = Number(process.env.XF_PICK_COUNT || "10") || 10;
      const { items: picked, poolClicks } = await addVisibleRowsToPool(
        page,
        maxPick,
      );

      const dir = candidatesDir();
      fs.mkdirSync(dir, { recursive: true });
      const out = path.join(dir, `candidates-${Date.now()}.json`);
      fs.writeFileSync(
        out,
        JSON.stringify(
          {
            source: lowUrl,
            openedDoudianHome,
            navViaDouyin: truthyEnv("XF_NAV_VIA_DOUYIN"),
            filters: {
              category: "毛绒玩具类",
              costYuan: [0, 15],
              note: "排序依赖页面控件；候选池为站内按钮 + 本地 JSON 快照",
            },
            pickedAt: new Date().toISOString(),
            poolClicks,
            items: picked,
          },
          null,
          2,
        ),
        "utf8",
      );
      log.info(
        "[xf-1.1] 快照:",
        out,
        "条数:",
        picked.length,
        "poolClicks:",
        poolClicks,
      );

      const poolMeta = {
        path: out,
        itemCount: picked.length,
        poolClicks,
        openedDoudianHome,
        navViaDouyin: truthyEnv("XF_NAV_VIA_DOUYIN"),
      };

      if (picked.length === 0) {
        emitJobStep(
          "pool_snapshot",
          "error",
          "无列表数据或未入池；请 headed 登录或校准选择器 / 服务市场 URL",
          poolMeta,
        );
        throw new Error(
          "[xf-1.1] 无列表数据或未入池。请 headed 登录后重试，或配置 XF_SERVICE_MARKET_URL / 选择器。",
        );
      }

      const poolWarn = poolClicks === 0 && picked.length > 0;
      emitJobStep(
        "pool_snapshot",
        poolWarn ? "warn" : "done",
        poolWarn ? "未命中「加入候选」按钮，仅列表文案快照" : undefined,
        poolMeta,
      );

      if (poolWarn) {
        log.warn(
          "[xf-1.1] 未命中「加入候选」按钮，仅列表文案快照；请 codegen 校准或使用浏览器 MCP 对照 DOM。",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await xfSaveFailArtifacts(page, browserContext, traceActive, msg);
      throw err;
    } finally {
      await xfDiscardTraceIfAny(browserContext, traceActive);
    }
  },
};
