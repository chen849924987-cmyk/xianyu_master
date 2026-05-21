import type { FeatureModule } from "../types.js";
import {
  DEFAULT_DOUDIAN_BASE_URL,
  appConfig,
  isPasswordLoginConfigured,
  log,
  openWorkbenchAndAssertLoggedIn,
  performPasswordLogin,
  saveStorageState,
} from "../../utils/index.js";

/**
 * 默认：门户落地 + 工作台校验（依赖已有 storageState）。
 * 配置 DOUDIAN_PASSWORD_LOGIN 与邮箱密码后：自动走门户邮箱登录；遇滑块需在 headed 下人工完成。
 * DOUDIAN_SAVE_SESSION_AFTER_LOGIN=1 时：工作台校验通过后写回 STORAGE_STATE_PATH（含仅 storage 分支）。
 */
export const loginFeature: FeatureModule = {
  id: "login",
  displayName: "登录",
  async run({ page, baseUrl, browserContext }) {
    if (isPasswordLoginConfigured()) {
      log.info("[login] 使用环境变量密码登录流程（密码不落日志）");
      await performPasswordLogin(page, baseUrl);
    } else {
      const origin = (baseUrl || DEFAULT_DOUDIAN_BASE_URL).replace(/\/$/, "");
      const landing = `${origin}/`;
      log.info("[login] 打开门户首页（依赖已有 storageState）:", landing);
      await page.goto(landing, { waitUntil: "load", timeout: 120_000 });
      try {
        await page.waitForLoadState("networkidle", { timeout: 25_000 });
      } catch {
        /* 站点若有长连接，networkidle 可能超时；仍以 load 结果为准 */
      }
      await new Promise((r) => setTimeout(r, 800));
      log.info("[login] 根路径落地 URL:", page.url());
    }

    log.info("[login] 继续校验工作台登录态…");
    const r = await openWorkbenchAndAssertLoggedIn(page, baseUrl);
    log.info("[login] 工作台 HTTP", r.httpStatus, "URL:", r.finalUrl);

    if (appConfig.saveSessionAfterPasswordLogin && browserContext) {
      await saveStorageState(browserContext);
      log.info("[login] 已按 DOUDIAN_SAVE_SESSION_AFTER_LOGIN 写入登录态文件");
    }

    log.info("[login] 完成：后台与会话可用（后续可在此补充账号切换等步骤）");
  },
};
