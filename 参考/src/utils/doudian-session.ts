import type { Page } from "playwright";

export type SessionNavigateOptions = {
  settleMs?: number;
  gotoTimeoutMs?: number;
};

/**
 * 打开抖店工作台首页路径，并根据落地 URL / 标题判断是否被拦在登录页。
 */
export async function openWorkbenchAndAssertLoggedIn(
  page: Page,
  baseUrl: string,
  opts?: SessionNavigateOptions,
): Promise<{ finalUrl: string; title: string; httpStatus: number | undefined }> {
  const settleMs = opts?.settleMs ?? 3000;
  const gotoTimeoutMs = opts?.gotoTimeoutMs ?? 120_000;
  const origin = baseUrl.replace(/\/$/, "");
  const target = `${origin}/ffa/mshop/homepage/index`;
  const res = await page.goto(target, {
    waitUntil: "domcontentloaded",
    timeout: gotoTimeoutMs,
  });
  await new Promise((r) => setTimeout(r, settleMs));
  const finalUrl = page.url();
  const title = await page.title().catch(() => "");
  assertFxgLoggedIn(finalUrl, title);
  return { finalUrl, title, httpStatus: res?.status() };
}

/**
 * 不执行 navigation：根据当前标签页的 URL / 标题判断是否已通过登录并可视为工作台会话
 *（规则与 {@link openWorkbenchAndAssertLoggedIn} 在 goto 落地后一致）。
 * 供 save-session=edge 轮询使用，避免每隔数秒 goto 打断用户输入验证码/密码。
 */
export async function assertFxgLoggedInFromCurrentPage(
  page: Page,
  opts?: SessionNavigateOptions,
): Promise<void> {
  const settleMs = opts?.settleMs ?? 1000;
  await new Promise((r) => setTimeout(r, settleMs));
  const finalUrl = page.url();
  const title = await page.title().catch(() => "");
  assertFxgLoggedIn(finalUrl, title);
}

/**
 * 打开飞鸽客服工作台（常见路径），断言未落在登录墙。
 */
export async function openFeigeWorkspaceAndAssertLoggedIn(
  page: Page,
  imBaseUrl: string,
  opts?: SessionNavigateOptions,
): Promise<{ finalUrl: string; title: string; httpStatus: number | undefined }> {
  const settleMs = opts?.settleMs ?? 4000;
  const gotoTimeoutMs = opts?.gotoTimeoutMs ?? 120_000;
  const origin = imBaseUrl.replace(/\/$/, "");
  const target = `${origin}/pc_seller_v2/main/workspace`;
  const res = await page.goto(target, {
    waitUntil: "domcontentloaded",
    timeout: gotoTimeoutMs,
  });
  await new Promise((r) => setTimeout(r, settleMs));
  const finalUrl = page.url();
  const title = await page.title().catch(() => "");
  assertImLoggedIn(finalUrl, title);
  return { finalUrl, title, httpStatus: res?.status() };
}

/**
 * 与 {@link assertFxgLoggedIn} 相同规则，不抛错：用于轮询 / 边沿检测。
 * 条件为「非（登录墙且不在工作台）」，即允许门户根路径等非工作台但也非登录墙的 URL。
 */
export function isFxgLoggedInFromUrlAndTitle(finalUrl: string, title: string): boolean {
  let pathname = "";
  try {
    pathname = new URL(finalUrl).pathname;
  } catch {
    pathname = finalUrl;
  }
  /** 仅用 pathname，避免 `/login/common?target_url=.../homepage...` 查询串误匹配「工作台」 */
  const onWorkbench = /\/ffa\/mshop\/homepage/i.test(pathname);
  const loginWall =
    /\/(?:login|passport|signin|sso|binding)(?:\/|$)/i.test(pathname) ||
    /扫码|账号登录/i.test(finalUrl) ||
    /登录|扫码|账号密码/i.test(title);
  return onWorkbench || !loginWall;
}

function assertFxgLoggedIn(finalUrl: string, title: string): void {
  if (!isFxgLoggedInFromUrlAndTitle(finalUrl, title)) {
    throw new Error(
      "[抖店后台] 仍在登录相关页，请先执行 npm run dev -- --save-session（或 --save-session=edge）或检查 storageState",
    );
  }
}

function assertImLoggedIn(finalUrl: string, title: string): void {
  let pathname = "";
  let host = "";
  try {
    const u = new URL(finalUrl);
    pathname = u.pathname;
    host = u.hostname;
  } catch {
    pathname = finalUrl;
  }
  const onWorkspace =
    (/im\.jinritemai\.com$/i.test(host) && /\/pc_seller/i.test(pathname)) ||
    /\/pc_seller_v2\/main\/workspace/i.test(pathname);
  const loginWall =
    /\/(?:login|passport|signin|sso|binding)(?:\/|$)/i.test(pathname) ||
    /扫码|账号登录/i.test(finalUrl) ||
    /登录|扫码|账号密码/.test(title);
  if (loginWall && !onWorkspace) {
    throw new Error(
      "[飞鸽] 仍在登录相关页；保存登录态时请在同一 Chromium 会话内打开飞鸽或从后台跳转完成 SSO",
    );
  }
}
