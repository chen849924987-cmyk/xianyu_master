import type { Page } from "playwright";
import { appConfig } from "./config.js";
import { log } from "./logger.js";

/** 是否启用了密码登录且邮箱密码齐全（不含日志输出密码） */
export function isPasswordLoginConfigured(): boolean {
  return Boolean(appConfig.passwordLogin && appConfig.loginEmail && appConfig.loginPassword);
}

/** 与 doudian-session 断言口径大致对齐：是否仍像在登录墙 */
export function isLikelyFxgLoginWall(url: string): boolean {
  let pathname = "";
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  const onWorkbench = /\/ffa\/mshop\/homepage/i.test(pathname);
  const loginWall =
    /\/(?:login|passport|signin|sso|binding)(?:\/|$)/i.test(pathname) ||
    /accounts\.|扫码|账号登录/i.test(url) ||
    /sso\.|snssdk\.com\/.*login/i.test(url);
  return loginWall && !onWorkbench;
}

async function dismissOptionalOverlay(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: /同意|接受|我知道了|关闭/i })
    .first()
    .click({ timeout: 2000 })
    .catch(() => {});
}

/** 登录页常见「登录即代表同意…」未勾选时提交无效 */
async function agreeToTermsIfPresent(page: Page): Promise<void> {
  const boxes = page.locator('input[type="checkbox"]');
  const n = await boxes.count().catch(() => 0);
  for (let i = 0; i < n; i++) {
    const box = boxes.nth(i);
    if (!(await box.isVisible().catch(() => false))) continue;
    const checked = await box.isChecked().catch(() => false);
    if (!checked) {
      await box.click({ force: true, timeout: 3000 }).catch(() => {});
      log.info("[password-login] 已勾选协议复选框");
    }
    break;
  }
}

async function detectCaptchaVisible(page: Page): Promise<boolean> {
  const bundle = page
    .locator(
      [
        'iframe[src*="captcha" i]',
        'iframe[src*="verify" i]',
        '[class*="geetest" i]',
        '[class*="captcha" i]',
        '[class*="slider" i]',
        '[class*="verify-bar" i]',
        '[id*="captcha" i]',
      ].join(", "),
    )
    .first();
  if (await bundle.isVisible().catch(() => false)) return true;

  for (const frame of page.frames()) {
    const u = frame.url();
    if (/captcha|verify|geetest|secsdk/i.test(u)) return true;
    const hit = frame.locator('[class*="slider" i], [class*="geetest" i], [class*="captcha" i]').first();
    if (await hit.isVisible().catch(() => false)) return true;
  }
  return false;
}

async function warnCaptchaProviderStub(): Promise<void> {
  const p = appConfig.captchaProvider;
  if (!p) return;
  if (p === "twocaptcha") {
    log.warn(
      "[password-login] 已设置 DOUDIAN_CAPTCHA_PROVIDER=twocaptcha，远程打码尚未接入；请在 headed 下手动过滑块或自行对接 2Captcha API",
    );
    return;
  }
  log.warn("[password-login] DOUDIAN_CAPTCHA_PROVIDER=", p, "（未识别的提供商，将仅使用人工等待）");
}

/** 提交表单后轮询：离开登录墙或超时；遇验证码则 headed 下等待人工 */
async function waitForLoginWallClear(page: Page): Promise<void> {
  await warnCaptchaProviderStub();

  const deadline = Date.now() + appConfig.captchaManualTimeoutMs;
  let captchaHinted = false;

  while (Date.now() < deadline) {
    const url = page.url();
    if (!isLikelyFxgLoginWall(url)) {
      log.info("[password-login] 已离开登录相关页:", url);
      return;
    }

    const cap = await detectCaptchaVisible(page);
    if (cap) {
      if (!appConfig.headed) {
        throw new Error(
          "[password-login] 检测到验证码/滑块，但当前为 headless。请设置 PLAYWRIGHT_HEADED=1 在可见窗口内完成验证，或后续接入第三方打码",
        );
      }
      if (!captchaHinted) {
        captchaHinted = true;
        log.info(
          `[password-login] 检测到验证码/滑块，请在浏览器内手动完成（最长等待 ${appConfig.captchaManualTimeoutMs} ms）…`,
        );
      }
    }

    await page.waitForTimeout(1500);
  }

  throw new Error(
    `[password-login] 等待登录完成超时（${appConfig.captchaManualTimeoutMs} ms）。请检查账号密码、验证码或门户 DOM 是否变更（可用 npm run codegen 校准选择器）`,
  );
}

async function openLoginUi(page: Page): Promise<void> {
  if (isLikelyFxgLoginWall(page.url())) {
    log.info("[password-login] 已在登录相关页，跳过门户入口点击");
    return;
  }

  const attempts: Array<{ name: string; locator: () => ReturnType<Page["locator"]> }> = [
    {
      name: "link 登录抖店/商家登录",
      locator: () => page.getByRole("link", { name: /登录抖店|商家登录|入驻抖店/i }).first(),
    },
    {
      name: "button 登录",
      locator: () => page.getByRole("button", { name: /登录抖店|^登录$/ }).first(),
    },
    {
      name: "文本「登录」",
      locator: () => page.getByText(/^登录$/).first(),
    },
    {
      name: "href 含 login/passport",
      locator: () => page.locator('a[href*="login" i], a[href*="passport" i]').first(),
    },
  ];

  let clicked = false;
  for (const { name, locator } of attempts) {
    const loc = locator();
    try {
      await loc.waitFor({ state: "visible", timeout: 4000 });
      await loc.click({ timeout: 6000 });
      clicked = true;
      log.info("[password-login] 已点击门户入口:", name);
      break;
    } catch {
      /* try next */
    }
  }

  if (!clicked) {
    log.warn("[password-login] 未匹配到门户登录入口（页面改版时可 npm run codegen -- <门户URL> 校准）");
  }

  await page.waitForTimeout(800);
  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 20_000 });
  } catch {
    /* ignore */
  }
}

async function switchToEmailLogin(page: Page): Promise<void> {
  const tries: Array<{ name: string; locator: () => ReturnType<Page["locator"]> }> = [
    { name: "tab 邮箱", locator: () => page.getByRole("tab", { name: /邮箱/i }).first() },
    {
      name: "精确 邮箱登录",
      locator: () => page.getByText("邮箱登录", { exact: true }).first(),
    },
    {
      name: "文案 邮箱登录",
      locator: () => page.getByText(/邮箱登录|邮件登录|使用邮箱/i).first(),
    },
    { name: "文案 邮箱", locator: () => page.getByText(/^邮箱$/).first() },
    {
      name: "按钮 密码登录",
      locator: () => page.getByRole("button", { name: /密码登录|帐号登录|账号登录/i }).first(),
    },
  ];

  for (const { name, locator } of tries) {
    const loc = locator();
    try {
      await loc.waitFor({ state: "visible", timeout: 3500 });
      await loc.click({ timeout: 5000 });
      log.info("[password-login] 已切换登录方式:", name);
      await page.waitForTimeout(500);
      return;
    } catch {
      /* next */
    }
  }

  log.info("[password-login] 未点到邮箱入口（可能默认即邮箱），继续填写表单");
}

async function fillCredentials(page: Page, email: string, password: string): Promise<void> {
  /** 勿匹配「请输入手机号码」：placeholder 含「手机」会与邮箱步骤冲突 */
  const emailInput = page
    .locator(
      [
        'input[type="email"]',
        'input[placeholder*="邮箱" i]',
        'input[placeholder*="邮件" i]',
        'input[placeholder*="E-mail" i]',
        'input[name*="mail" i]',
        'input[name*="email" i]',
      ].join(", "),
    )
    .filter({ visible: true })
    .first();

  await emailInput.waitFor({ state: "visible", timeout: 25_000 });
  await emailInput.fill(email);

  const pwdInput = page
    .locator('input[type="password"], input[placeholder*="密码" i]')
    .filter({ visible: true })
    .first();

  await pwdInput.waitFor({ state: "visible", timeout: 15_000 });
  await pwdInput.fill(password);

  const masked = `${email.slice(0, 3)}***${email.includes("@") ? email.slice(email.indexOf("@")) : ""}`;
  log.info("[password-login] 已填写账号:", masked);
}

async function submitLoginForm(page: Page): Promise<void> {
  const btn = page.getByRole("button", { name: /登\s*录|登录|确定|进入/i }).first();
  await btn.waitFor({ state: "visible", timeout: 15_000 });
  await btn.click({ timeout: 10_000 });
}

/**
 * 从门户进入并完成邮箱密码登录（含验证码人工等待）。
 * 选择器需随页面改版用 codegen 校准。
 */
export async function performPasswordLogin(page: Page, baseUrl: string): Promise<void> {
  if (!isPasswordLoginConfigured()) {
    throw new Error("[password-login] 配置不完整：需要 DOUDIAN_PASSWORD_LOGIN=1 且设置邮箱与密码");
  }

  const email = appConfig.loginEmail!;
  const password = appConfig.loginPassword!;
  const origin = baseUrl.replace(/\/$/, "");
  const landing = `${origin}/`;

  log.info("[password-login] 打开门户:", landing);
  await page.goto(landing, { waitUntil: "load", timeout: 120_000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 25_000 });
  } catch {
    /* ignore */
  }

  await dismissOptionalOverlay(page);
  await openLoginUi(page);
  await dismissOptionalOverlay(page);

  if (!isLikelyFxgLoginWall(page.url())) {
    const directLogin = `${origin}/login/common`;
    log.info("[password-login] 未落在登录页，直达:", directLogin);
    await page.goto(directLogin, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await dismissOptionalOverlay(page);
  }

  await switchToEmailLogin(page);
  await fillCredentials(page, email, password);
  await agreeToTermsIfPresent(page);
  await submitLoginForm(page);

  await waitForLoginWallClear(page);
}
