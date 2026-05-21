import type { FeatureModule } from "../types.js";
import { log } from "../../utils/logger.js";

/** 不依赖抖店账号，用于验证 CLI → launchContext → feature.run 整条链路 */
const SMOKE_URL = "https://example.com/";

export const chainSmokeFeature: FeatureModule = {
  id: "chain-smoke",
  displayName: "链路冒烟（公网示例页）",
  async run({ page }) {
    log.info("[chain-smoke] 打开:", SMOKE_URL);
    const res = await page.goto(SMOKE_URL, { waitUntil: "domcontentloaded" });
    if (!res?.ok()) {
      throw new Error(`[chain-smoke] HTTP 异常: ${res?.status() ?? "no response"}`);
    }
    const title = await page.title();
    if (!/Example Domain/i.test(title)) {
      throw new Error(`[chain-smoke] 标题不符合预期: ${JSON.stringify(title)}`);
    }
    log.info("[chain-smoke] 通过，标题:", title);
  },
};
