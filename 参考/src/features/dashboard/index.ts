import type { FeatureModule } from "../types.js";
import { log } from "../../utils/logger.js";

/**
 * 对应页面：工作台 / 首页概览（按实际路径修改 goto）
 */
export const dashboardFeature: FeatureModule = {
  id: "dashboard",
  displayName: "工作台",
  async run({ page, baseUrl }) {
    await page.goto(`${baseUrl}/ffa/mshop/homepage/index`, {
      waitUntil: "domcontentloaded",
    });
    log.info("[dashboard] 已打开工作台，请在此补充业务步骤");
  },
};
