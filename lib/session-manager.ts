/**
 * 闲鱼登录态管理器
 *
 * 功能描述：
 * - 使用 Playwright storageState 机制持久化闲鱼登录态
 * - 提供保存登录态（浏览器交互式登录）、校验登录态、清除登录态的能力
 * - 登录态文件存储在 .data/storage-state.json
 *
 * @author 闲鱼自动化助手
 * @date 2026-05-11
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

// ========== 常量定义 ==========

/** 登录态 JSON 文件路径 */
export const STORAGE_STATE_PATH = path.resolve(
  process.cwd(),
  ".data",
  "storage-state.json"
);

/** 闲鱼官网地址 */
export const XIANYU_BASE_URL = "https://www.goofish.com";

/** 保存会话时启动浏览器的超时时间（10分钟） */
export const SAVE_SESSION_TIMEOUT = 10 * 60 * 1000;

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

// ========== 核心函数 ==========

/**
 * 读取存储状态文件
 *
 * @returns 解析后的 storageState JSON 对象，如果文件不存在或解析失败则返回 null
 */
function readStorageState(): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(STORAGE_STATE_PATH)) {
      return null;
    }
    const raw = fs.readFileSync(STORAGE_STATE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[SessionManager] 读取登录态文件失败:`, error);
    return null;
  }
}

/**
 * 检查登录态文件是否存在且有效
 *
 * @returns {SessionStatus} 登录态状态信息
 */
export function checkSessionStatus(): SessionStatus {
  const state = readStorageState();

  // 默认状态：文件不存在
  const status: SessionStatus = {
    exists: false,
    hasCookies: false,
    cookieCount: 0,
    isExpired: true,
    filePath: STORAGE_STATE_PATH,
    lastModified: null,
    domains: [],
  };

  // 文件不存在
  if (!state) {
    return status;
  }

  // 文件存在
  status.exists = true;
  status.lastModified = fs.existsSync(STORAGE_STATE_PATH)
    ? fs.statSync(STORAGE_STATE_PATH).mtime.toISOString()
    : null;

  // 检查是否包含 cookies
  const cookies = state.cookies as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(cookies) && cookies.length > 0) {
    status.hasCookies = true;
    status.cookieCount = cookies.length;

    // 提取域名列表
    const domainSet = new Set<string>();
    let hasExpired = false;
    const now = Date.now() / 1000; // 秒级时间戳

    for (const cookie of cookies) {
      if (typeof cookie.domain === "string") {
        domainSet.add(cookie.domain);
      }
      // 检查是否过期
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
 * 校验登录态是否有效（通过实际访问闲鱼页面检测）
 *
 * 功能描述：使用 Playwright 加载存储的登录态，访问闲鱼首页，
 * 通过检测是否跳转到登录页来判断登录态是否有效。
 *
 * @returns {Promise<{ valid: boolean; message: string }>} 校验结果
 */
export async function validateSession(): Promise<{
  valid: boolean;
  message: string;
}> {
  // 先检查文件是否存在
  const status = checkSessionStatus();
  if (!status.exists || !status.hasCookies) {
    return {
      valid: false,
      message: "登录态文件不存在或为空，请先保存登录态",
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
      storageState: STORAGE_STATE_PATH,
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
 * 4. 用户在终端按 Enter 后导出登录态
 *
 * 注意：此函数会启动一个浏览器窗口，需要用户手动操作登录，
 * 然后回到终端按 Enter 确认。
 *
 * @param {object} [options] 可选参数
 * @param {number} [options.port] CDP 端口（如果提供，则连接到已有浏览器）
 * @returns {Promise<SaveSessionResult>} 保存结果
 */
export async function saveSessionInteractive(options?: {
  port?: number;
}): Promise<SaveSessionResult> {
  let browser;
  let context;

  try {
    if (options?.port) {
      // === 连接到已有 Chrome 浏览器（通过 CDP）===
      console.log(
        `[SessionManager] 正在连接到已有 Chrome (CDP port: ${options.port})...`
      );
      browser = await chromium.connectOverCDP(
        `http://127.0.0.1:${options.port}`
      );
      const contexts = browser.contexts();
      context = contexts.length > 0 ? contexts[0] : await browser.newContext();
    } else {
      // === 启动新浏览器 ===
      console.log("[SessionManager] 正在启动 Chromium 浏览器...");
      browser = await chromium.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      context = await browser.newContext();
    }

    // 创建一个新标签页并导航到闲鱼
    const page = await context.newPage();
    console.log(`[SessionManager] 正在打开闲鱼: ${XIANYU_BASE_URL}`);
    console.log("[SessionManager] 请在浏览器中完成登录操作...");
    await page.goto(XIANYU_BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {
      // 网络空闲可能不会被触发，忽略超时
    });
    await page.bringToFront();

    // 返回结果，让调用者等待用户确认后调用 finalizeSaveSession
    return {
      success: true,
      message:
        "浏览器已打开，请完成登录后按 Enter 确认保存。\n" +
        "如果已登录，可直接在终端按 Enter。",
      filePath: STORAGE_STATE_PATH,
    };
  } catch (error) {
    // 确保资源释放
    if (browser && !options?.port) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SessionManager] 保存登录态失败:`, errMsg);
    return {
      success: false,
      message: `保存登录态失败: ${errMsg}`,
      filePath: STORAGE_STATE_PATH,
    };
  }
}

/**
 * 最终确定保存登录态
 *
 * 功能描述：从当前 Playwright 浏览器上下文导出 storageState 并保存到文件。
 * 此函数应在 saveSessionInteractive 之后调用。
 *
 * @returns {SaveSessionResult} 保存结果
 */
export async function finalizeSaveSessionFromPage(page: any): Promise<SaveSessionResult> {
  try {
    // 获取当前页面的 context 并导出 storageState
    const context = page.context();
    const state = await context.storageState();

    // 确保目录存在
    const dir = path.dirname(STORAGE_STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");

    const cookieCount = (state.cookies || []).length;

    console.log(
      `[SessionManager] 登录态已保存: ${STORAGE_STATE_PATH}`
    );
    console.log(`[SessionManager] Cookies 数量: ${cookieCount}`);

    return {
      success: true,
      message: `登录态已保存成功，共 ${cookieCount} 个 Cookie`,
      filePath: STORAGE_STATE_PATH,
      cookieCount,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SessionManager] 保存登录态失败:`, errMsg);
    return {
      success: false,
      message: `保存登录态失败: ${errMsg}`,
      filePath: STORAGE_STATE_PATH,
    };
  }
}

/**
 * 清除已保存的登录态
 *
 * @returns {{ success: boolean; message: string }} 清除结果
 */
export function clearSession(): { success: boolean; message: string } {
  try {
    if (fs.existsSync(STORAGE_STATE_PATH)) {
      fs.unlinkSync(STORAGE_STATE_PATH);
      return {
        success: true,
        message: "登录态已清除",
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
 * @returns {{ exists: boolean; fileSize: number; lastModified: string | null; path: string }}
 */
export function getSessionFileInfo(): {
  exists: boolean;
  fileSize: number;
  lastModified: string | null;
  path: string;
} {
  try {
    if (fs.existsSync(STORAGE_STATE_PATH)) {
      const stat = fs.statSync(STORAGE_STATE_PATH);
      return {
        exists: true,
        fileSize: stat.size,
        lastModified: stat.mtime.toISOString(),
        path: STORAGE_STATE_PATH,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    exists: false,
    fileSize: 0,
    lastModified: null,
    path: STORAGE_STATE_PATH,
  };
}
