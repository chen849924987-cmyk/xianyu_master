import type { FeatureModule } from "./types.js";
import { chainSmokeFeature } from "./chain-smoke/index.js";
import { dashboardFeature } from "./dashboard/index.js";
import { feigeWorkspaceFeature } from "./feige-workspace/index.js";
import { loginFeature } from "./login/index.js";
import { sessionVerifyFeature } from "./session-verify/index.js";
import { xfAliFindLowGoodsFeature } from "./xf-ali-find-low-goods/index.js";

/** 所有页面功能注册表：新增页面时在数组中追加一项即可 */
export const features: FeatureModule[] = [
  chainSmokeFeature,
  loginFeature,
  dashboardFeature,
  sessionVerifyFeature,
  feigeWorkspaceFeature,
  xfAliFindLowGoodsFeature,
];

const byId = new Map(features.map((f) => [f.id, f]));

export function getFeature(id: string): FeatureModule | undefined {
  return byId.get(id);
}

export function listFeatures(): FeatureModule[] {
  return [...features];
}

export type { FeatureModule, FeatureRunContext } from "./types.js";
