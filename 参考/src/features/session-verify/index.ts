import type { FeatureModule } from "../types.js";
import { log, openWorkbenchAndAssertLoggedIn } from "../../utils/index.js";

/**
 * 用当前 storageState 打开工作台，根据落地 URL / 标题粗略判断是否仍处于登录态。
 */
export const sessionVerifyFeature: FeatureModule = {
  id: "session-verify",
  displayName: "登录态校验（工作台）",
  async run({ page, baseUrl }) {
    log.info("[session-verify] 校验工作台路径…");
    const r = await openWorkbenchAndAssertLoggedIn(page, baseUrl);
    log.info("[session-verify] HTTP", r.httpStatus, "URL:", r.finalUrl);
    log.info("[session-verify] title:", r.title.slice(0, 160));
    log.info("[session-verify] 通过：已进入工作台路径或未命中典型登录页特征");
  },
};
