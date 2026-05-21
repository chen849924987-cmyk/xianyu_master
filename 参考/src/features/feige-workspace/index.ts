import type { FeatureModule } from "../types.js";
import { appConfig, log, openFeigeWorkspaceAndAssertLoggedIn } from "../../utils/index.js";

/**
 * 飞鸽客服工作台（对齐 AGENT_TODOLIST 三、3.1 打开会话站点）。
 */
export const feigeWorkspaceFeature: FeatureModule = {
  id: "feige-workspace",
  displayName: "飞鸽工作台",
  async run({ page }) {
    log.info("[feige-workspace] IM 根:", appConfig.imBaseUrl);
    const r = await openFeigeWorkspaceAndAssertLoggedIn(page, appConfig.imBaseUrl);
    log.info("[feige-workspace] HTTP", r.httpStatus, "URL:", r.finalUrl);
    log.info("[feige-workspace] title:", r.title.slice(0, 160));
    log.info("[feige-workspace] 通过：已进入飞鸽路径或未命中典型登录页特征");
  },
};
