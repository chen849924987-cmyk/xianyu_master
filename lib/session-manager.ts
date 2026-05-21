/**
 * 闲鱼登录态管理器
 *
 * 功能描述：
 * - 使用 Playwright storageState 机制持久化闲鱼登录态
 * - 提供保存登录态（浏览器交互式登录）、校验登录态、清除登录态的能力
 * - 支持自定义登录态文件路径（包括从外部导入已有的 storageState 文件）
 *
 * @author 闲鱼自动化助手
 * @date 2026-05-11
 */
import fs from "fs";
import path from "path";
import { chromium, type Browser, type BrowserContext } from "playwright";

// ========== 常量定义 ==========

/** 默认登录态 JSON 文件路径 */
export const DEFAULT_STORAGE_STATE_PATH = path.resolve(
  process.cwd(),
  ".data",
  "storage-state.json"
);

/** 闲鱼官网地址 */
export const XIANYU_BASE_URL = "https://www.goofish.com";

/** 保存会话时启动浏览器的超时时间（10分钟） */
export const SAVE_SESSION_TIMEOUT = 10 * 60 * 1000;

/** 交互式保存时暂存的浏览器会话（供 finalize 使用） */
let pendingInteractiveSession: {
  browser: Browser;
  context: BrowserContext;
} | null = null;

/** 与闲鱼登录相关的 URL 片段 */
const SESSION_URL_HINTS = ["goofish", "taobao", "alipay", "passport"];

function pageMatchesSessionUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return SESSION_URL_HINTS.some((hint) => lower.includes(hint));
}

/** 登录页检测相关选择器/关键字 */
const LOGIN_INDICATORS = [
  "login",
  "signin",
  "登录",
  "密码登录",
  "扫码登录",
  "passport",
  "alipay",
];

// ========== 数据接口 ==========

/**
 * 登录态状态信息
 */
export interface SessionStatus {
  /** 是否存在登录态文件 */
  exists: boolean;
  /** 文件中是否包含有效的 cookies */
  hasCookies: boolean;
  /** cookies 数量 */
  cookieCount: number;
  /** 是否已过期（如果存在过期时间） */
  isExpired: boolean;
  /** 文件路径 */
  filePath: string;
  /** 文件最后修改时间 */
  lastModified: string | null;
  /** cookies 中的域名列表 */
  domains: string[];
}

/**
 * 保存登录态的结果
 */
export interface SaveSessionResult {
  /** 是否成功 */
  success: boolean;
  /** 消息描述 */
  message: string;
  /** 保存的文件路径 */
  filePath: string;
  /** cookies 数量 */
  cookieCount?: number;
}

/**
 * 导入登录态结果
 */
export interface ImportSessionResult {
  /** 是否成功 */
  success: boolean;
  /** 消息描述 */
  message: string;
  /** 实际使用的文件路径 */
  filePath: string;
  /** cookies 数量 */
  cookieCount?: number;
  /** 域名列表 */
  domains?: string[];
  /** 是否有过期 cookie */
  hasExpired?: boolean;
  /** 完整的状态信息 */
  status?: SessionStatus;
}

// ========== 内部工具函数 ==========

/**
 * 解析文件路径，如果未传则使用默认路径
 *
 * @param customPath - 自定义文件路径（可选）
 * @returns 解析后的绝对路径
 */
function resolveFilePath(customPath?: string): string {
  if (customPath) {
    return path.resolve(customPath);
  }
  return DEFAULT_STORAGE_STATE_PATH;
}

/**
 * 读取指定路径的 storageState 文件
 *
 * @param filePath - 文件路径
 * @returns 解析后的 JSON 对象，失败时返回 null
 */
function readStorageStateByPath(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[SessionManager] 读取登录态文件失败 (${filePath}):`, error);
    return null;
  }
}

/**
 * 从 JSON 对象中提取域名列表
 */
function extractDomains(state: Record<string, unknown>): string[] {
  const cookies = state.cookies as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(cookies)) return [];

  const domainSet = new Set<string>();
  for (const cookie of cookies) {
    if (typeof cookie.domain === "string") {
      domainSet.add(cookie.domain);
    }
  }
  return Array.from(domainSet);
}

// ========== 核心函数 ==========

/**
 * 检查指定路径的登录态文件是否存在且有效
 *
 * @param customPath - 自定义文件路径（可选，默认为 .data/storage-state.json）
 * @returns {SessionStatus} 登录态状态信息
 */
export function checkSessionStatus(customPath?: string): SessionStatus {
  const filePath = resolveFilePath(customPath);
  const state = readStorageStateByPath(filePath);

  // 默认状态：文件不存在
  const status: SessionStatus = {
    exists: false,
    hasCookies: false,
    cookieCount: 0,
    isExpired: true,
    filePath,
    lastModified: null,
    domains: [],
  };

  if (!state) {
    return status;
  }

  // 文件存在
  status.exists = true;
  status.lastModified = fs.existsSync(filePath)
    ? fs.statSync(filePath).mtime.toISOString()
    : null;

  // 检查是否包含 cookies
  const cookies = state.cookies as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(cookies) && cookies.length > 0) {
    status.hasCookies = true;
    status.cookieCount = cookies.length;

    // 提取域名
    const domainSet = new Set<string>();
    let hasExpired = false;
    const now = Date.now() / 1000; // 秒级时间戳

    for (const cookie of cookies) {
      if (typeof cookie.domain === "string") {
        domainSet.add(cookie.domain);
      }
      if (typeof cookie.expires === "number" && cookie.expires > 0) {
        if (cookie.expires < now) {
          hasExpired = true;
        }
      }
    }

    status.domains = Array.from(domainSet);
    status.isExpired = hasExpired;
  }

  return status;
}

/**
 * 从指定路径导入已有的 storageState 文件作为登录态
 *
 * 功能描述：
 * 1. 校验文件存在性、JSON 格式、cookies 结构
 * 2. 将文件复制到默认路径（供后续统一使用）
 * 3. 或直接使用该路径（设置 currentFilePath）
 *
 * @param sourcePath - 源文件路径（必须是有效的 Playwright storageState JSON）
 * @param options - 可选参数
 * @param {boolean} [options.copyToDefault] - 是否复制到默认路径（默认 true）
 * @returns {ImportSessionResult} 导入结果
 */
export function importSessionFromPath(
  sourcePath: string,
  options?: { copyToDefault?: boolean }
): ImportSessionResult {
  const copyToDefault = options?.copyToDefault !== false; // 默认 true
  const resolvedSrc = path.resolve(sourcePath);

  try {
    // 1. 校验源文件存在
    if (!fs.existsSync(resolvedSrc)) {
      return {
        success: false,
        message: `源文件不存在: ${resolvedSrc}`,
        filePath: resolvedSrc,
      };
    }

    // 2. 校验 JSON 格式
    let state: Record<string, unknown>;
    try {
      const raw = fs.readFileSync(resolvedSrc, "utf-8");
      state = JSON.parse(raw);
    } catch {
      return {
        success: false,
        message: `文件不是有效的 JSON 格式: ${resolvedSrc}`,
        filePath: resolvedSrc,
      };
    }

    // 3. 校验 cookies 结构
    const cookies = state.cookies as Array<unknown> | undefined;
    if (!Array.isArray(cookies) || cookies.length === 0) {
      return {
        success: false,
        message: `文件中没有找到有效的 cookies 数据`,
        filePath: resolvedSrc,
      };
    }

    // 提取域名和检查过期
    const domainSet = new Set<string>();
    let hasExpired = false;
    const now = Date.now() / 1000;
    for (const cookie of cookies) {
      const c = cookie as Record<string, unknown>;
      if (typeof c.domain === "string") domainSet.add(c.domain);
      if (typeof c.expires === "number" && c.expires > 0 && c.expires < now) {
        hasExpired = true;
      }
    }

    const domains = Array.from(domainSet);

    // 4. 处理文件
    let targetPath: string;
    if (copyToDefault) {
      // 复制到默认路径
      targetPath = DEFAULT_STORAGE_STATE_PATH;
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, JSON.stringify(state, null, 2), "utf-8");
    } else {
      // 直接使用源路径
      targetPath = resolvedSrc;
    }

    // 5. 构建状态信息
    const status = checkSessionStatus(
      copyToDefault ? undefined : resolvedSrc
    );

    console.log(`[SessionManager] 导入登录态成功: ${resolvedSrc} → ${targetPath}`);
    console.log(`[SessionManager] Cookies: ${cookies.length}, 域名: ${domains.join(", ")}`);

    return {
      success: true,
      message: `导入成功，共 ${cookies.length} 个 Cookie${
        hasExpired ? "（部分已过期）" : ""
      }`,
      filePath: targetPath,
      cookieCount: cookies.length,
      domains,
      hasExpired,
      status,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SessionManager] 导入登录态失败:`, errMsg);
    return {
      success: false,
      message: `导入失败: ${errMsg}`,
      filePath: resolvedSrc,
    };
  }
}

/**
 * 校验登录态是否有效（通过实际访问闲鱼页面检测）
 *
 * 功能描述：使用 Playwright 加载存储的登录态，访问闲鱼首页，
 * 通过检测是否跳转到登录页来判断登录态是否有效。
 *
 * @param customPath - 自定义文件路径（可选）
 * @returns {Promise<{ valid: boolean; message: string }>} 校验结果
 */
export async function validateSession(customPath?: string): Promise<{
  valid: boolean;
  message: string;
}> {
  const filePath = resolveFilePath(customPath);

  // 先检查文件是否存在
  const status = checkSessionStatus(customPath);
  if (!status.exists || !status.hasCookies) {
    return {
      valid: false,
      message: `登录态文件不存在或为空: ${filePath}`,
    };
  }

  let browser;
  try {
    // 启动浏览器（无界面模式）
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // 使用存储的登录态创建上下文
    const context = await browser.newContext({
      storageState: filePath,
    });
    const page = await context.newPage();

    // 访问闲鱼首页
    await page.goto(XIANYU_BASE_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const currentUrl = page.url();
    const pageTitle = await page.title();

    await browser.close();

    // 判断是否被重定向到登录页
    const isLoginPage = LOGIN_INDICATORS.some(
      (indicator) =>
        currentUrl.toLowerCase().includes(indicator) ||
        pageTitle.toLowerCase().includes(indicator)
    );

    if (isLoginPage) {
      return {
        valid: false,
        message: `登录态已失效，当前页面被重定向到登录页（${currentUrl}）`,
      };
    }

    // 尝试查找个人相关元素（更精确的验证）
    try {
      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      const hasUserInfo =
        bodyText.includes("我的") ||
        bodyText.includes("个人") ||
        bodyText.includes("退出") ||
        bodyText.includes("消息") ||
        bodyText.includes("订单");

      if (hasUserInfo) {
        return {
          valid: true,
          message: "登录态有效（检测到用户信息区域）",
        };
      }
    } catch {
      // ignore
    }

    return {
      valid: true,
      message: `登录态有效（页面加载正常 - ${pageTitle}）`,
    };
  } catch (error) {
    // 确保浏览器被关闭
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SessionManager] 校验登录态失败:`, errMsg);

    // 区分错误类型
    if (errMsg.includes("storageState") || errMsg.includes("ENOENT")) {
      return { valid: false, message: "登录态文件损坏或无法读取，请重新保存" };
    }

    return {
      valid: false,
      message: `校验登录态失败: ${errMsg}`,
    };
  }
}

/**
 * 保存登录态 - 启动浏览器让用户交互式登录
 *
 * 功能描述：
 * 1. 启动 Playwright Chromium 浏览器（有界面模式）
 * 2. 导航到闲鱼首页
 * 3. 等待用户手动完成登录操作
 * 4. 导出登录态
 *
 * @param {object} [options] 可选参数
 * @param {string} [options.savePath] 自定义保存路径（可选）
 * @returns {Promise<SaveSessionResult>} 保存结果（需再调用 finalizeInteractiveSave）
 */
export async function saveSessionInteractive(options?: {
  savePath?: string;
}): Promise<SaveSessionResult> {
  const savePath = resolveFilePath(options?.savePath);
  let browser;

  try {
    if (pendingInteractiveSession) {
      try {
        await pendingInteractiveSession.browser.close();
      } catch {
        /* ignore */
      }
      pendingInteractiveSession = null;
    }

    console.log("[SessionManager] 正在启动 Chromium 浏览器...");
    browser = await chromium.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const context = await browser.newContext();

    const page = await context.newPage();
    console.log(`[SessionManager] 正在打开闲鱼: ${XIANYU_BASE_URL}`);
    await page.goto(XIANYU_BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
    await page.bringToFront();

    pendingInteractiveSession = { browser, context };

    return {
      success: true,
      message: "浏览器已打开，请在闲鱼页面完成登录后，在控制台点击「确认保存」。",
      filePath: savePath,
    };
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
    pendingInteractiveSession = null;

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SessionManager] 保存登录态失败:`, errMsg);
    return {
      success: false,
      message: `保存登录态失败: ${errMsg}`,
      filePath: savePath,
    };
  }
}

/**
 * 从已开启远程调试的 Chrome 导出登录态（一次性落盘）
 */
export async function saveSessionFromCDP(options: {
  port: number;
  savePath?: string;
}): Promise<SaveSessionResult> {
  const targetPath = resolveFilePath(options.savePath);
  let browser;

  try {
    console.log(
      `[SessionManager] 正在连接 Chrome CDP (port: ${options.port})...`
    );
    browser = await chromium.connectOverCDP(
      `http://127.0.0.1:${options.port}`
    );
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      return {
        success: false,
        message:
          "CDP 已连接但未找到浏览器上下文，请确认 Chrome 以 --remote-debugging-port 启动",
        filePath: targetPath,
        cookieCount: 0,
      };
    }

    const context = contexts[0];
    const pages = context.pages();
    const sessionPage = pages.find((p) => {
      try {
        return pageMatchesSessionUrl(p.url());
      } catch {
        return false;
      }
    });

    if (!sessionPage) {
      const page = pages[0] ?? (await context.newPage());
      console.log(`[SessionManager] 导航到闲鱼: ${XIANYU_BASE_URL}`);
      await page.goto(XIANYU_BASE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
    }

    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await context.storageState({ path: targetPath });
    const raw = fs.readFileSync(targetPath, "utf-8");
    const state = JSON.parse(raw) as { cookies?: unknown[] };
    const cookieCount = state.cookies?.length ?? 0;

    await browser.close();

    if (cookieCount === 0) {
      return {
        success: false,
        message:
          "未导出到任何 Cookie。请先在 Chrome 中打开闲鱼并完成登录，再重试。",
        filePath: targetPath,
        cookieCount: 0,
      };
    }

    console.log(
      `[SessionManager] CDP 登录态已保存: ${targetPath} (${cookieCount} cookies)`
    );
    return {
      success: true,
      message: `登录态已从 Chrome 保存成功，共 ${cookieCount} 个 Cookie`,
      filePath: targetPath,
      cookieCount,
    };
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SessionManager] CDP 保存登录态失败:`, errMsg);
    return {
      success: false,
      message: `从 Chrome 保存失败: ${errMsg}。请确认已用 start_chrome.bat 启动且端口正确。`,
      filePath: targetPath,
    };
  }
}

/**
 * 确认保存交互式登录会话（写入 storageState 并关闭浏览器）
 */
export async function finalizeInteractiveSave(
  savePath?: string
): Promise<SaveSessionResult> {
  const targetPath = resolveFilePath(savePath);

  if (!pendingInteractiveSession) {
    return {
      success: false,
      message: "没有待保存的浏览器会话，请先点击「启动浏览器并登录」",
      filePath: targetPath,
    };
  }

  const { browser, context } = pendingInteractiveSession;
  pendingInteractiveSession = null;

  try {
    const state = await context.storageState();
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(state, null, 2), "utf-8");

    const cookieCount = (state.cookies || []).length;
    await browser.close();

    if (cookieCount === 0) {
      return {
        success: false,
        message: "未保存到任何 Cookie，请先在浏览器中完成闲鱼登录",
        filePath: targetPath,
        cookieCount: 0,
      };
    }

    console.log(
      `[SessionManager] 登录态已保存: ${targetPath} (${cookieCount} cookies)`
    );
    return {
      success: true,
      message: `登录态已保存成功，共 ${cookieCount} 个 Cookie`,
      filePath: targetPath,
      cookieCount,
    };
  } catch (error) {
    try {
      await browser.close();
    } catch {
      /* ignore */
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `保存登录态失败: ${errMsg}`,
      filePath: targetPath,
    };
  }
}

/** 是否存在待确认的交互式保存会话 */
export function hasPendingInteractiveSession(): boolean {
  return pendingInteractiveSession !== null;
}

/**
 * 最终确定保存登录态并写入文件
 *
 * 功能描述：从当前 Playwright 浏览器上下文导出 storageState 并保存到文件。
 *
 * @param page - Playwright Page 实例
 * @param savePath - 自定义保存路径（可选）
 * @returns {Promise<SaveSessionResult>} 保存结果
 */
export async function finalizeSaveSessionFromPage(
  page: any,
  savePath?: string
): Promise<SaveSessionResult> {
  const targetPath = resolveFilePath(savePath);

  try {
    // 获取当前页面的 context 并导出 storageState
    const context = page.context();
    const state = await context.storageState();

    // 确保目录存在
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(targetPath, JSON.stringify(state, null, 2), "utf-8");

    const cookieCount = (state.cookies || []).length;

    console.log(`[SessionManager] 登录态已保存: ${targetPath}`);
    console.log(`[SessionManager] Cookies 数量: ${cookieCount}`);

    return {
      success: true,
      message: `登录态已保存成功，共 ${cookieCount} 个 Cookie`,
      filePath: targetPath,
      cookieCount,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SessionManager] 保存登录态失败:`, errMsg);
    return {
      success: false,
      message: `保存登录态失败: ${errMsg}`,
      filePath: targetPath,
    };
  }
}

/**
 * 清除已保存的登录态
 *
 * @param customPath - 自定义文件路径（可选）
 * @returns {{ success: boolean; message: string }}
 */
export function clearSession(customPath?: string): { success: boolean; message: string } {
  const filePath = resolveFilePath(customPath);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return {
        success: true,
        message: `登录态已清除: ${filePath}`,
      };
    }
    return {
      success: true,
      message: "登录态文件不存在，无需清除",
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SessionManager] 清除登录态失败:`, errMsg);
    return {
      success: false,
      message: `清除登录态失败: ${errMsg}`,
    };
  }
}

/**
 * 获取登录态文件信息
 *
 * @param customPath - 自定义文件路径（可选）
 * @returns {{ exists: boolean; fileSize: number; lastModified: string | null; path: string }}
 */
export function getSessionFileInfo(customPath?: string): {
  exists: boolean;
  fileSize: number;
  lastModified: string | null;
  path: string;
} {
  const filePath = resolveFilePath(customPath);
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      return {
        exists: true,
        fileSize: stat.size,
        lastModified: stat.mtime.toISOString(),
        path: filePath,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    exists: false,
    fileSize: 0,
    lastModified: null,
    path: filePath,
  };
}
