/**
 * 与 Web 控制台进度节点共用：步骤定义 + 单行结构化日志（见 JOB_STEP_ANCHOR）。
 * 勿引入 Playwright / Node 特有模块，便于 Vite 从仓库根路径引用。
 */

export const XF_LOW_GOODS_UI_FEATURE_ID = "xf-ali-find-low-goods" as const;

export type XfLowGoodsStepId =
  | "doudian_home"
  | "service_market"
  | "open_low_goods"
  | "page_login_hint"
  | "tab_navigation"
  | "filters"
  | "pool_snapshot";

export type JobStepPhase = "start" | "active" | "done" | "skipped" | "warn" | "error";

export type JobStepPayload = {
  featureId: typeof XF_LOW_GOODS_UI_FEATURE_ID;
  stepId: XfLowGoodsStepId;
  phase: JobStepPhase;
  detail?: string;
  meta?: Record<string, unknown>;
};

/** 与 logger 输出的 `[doudian] ` 前缀拼接后整行可解析 */
export const JOB_STEP_ANCHOR = "__JOB_STEP__";

export function serializeJobStepLine(payload: JobStepPayload): string {
  return `${JOB_STEP_ANCHOR}${JSON.stringify(payload)}`;
}

export type XfLowGoodsStepDef = {
  id: XfLowGoodsStepId;
  title: string;
  description: string;
  envHint?: string;
};

export const XF_LOW_GOODS_STEPS: readonly XfLowGoodsStepDef[] = [
  {
    id: "doudian_home",
    title: "抖店工作台首页",
    description: "进入后台工作台，再跳转晓风或服务市场。",
    envHint: "跳过：XF_SKIP_DOUDIAN_HOME=1",
  },
  {
    id: "service_market",
    title: "服务市场 → 晓风",
    description:
      "可选：开启 XF_NAV_VIA_DOUYIN 时从服务市场进晓风（可能新开标签）；否则为直达链路，本步骤仍会标记为完成。",
    envHint:
      "XF_NAV_VIA_DOUYIN=1 + XF_SERVICE_MARKET_URL；右侧「常用服务」或「已购服务」里的「晓风上货-商品管理管家」或「…专家」",
  },
  {
    id: "open_low_goods",
    title: "打开低价好物页",
    description: "进入晓风「阿里找低价好物」页面。",
    envHint: "XF_SUPER_GOODS_URL 覆盖默认 zzbtool 地址",
  },
  {
    id: "page_login_hint",
    title: "登录态检测",
    description: "若出现登录墙，需 headed save-session 完成登录。",
  },
  {
    id: "tab_navigation",
    title: "Tab / 类目",
    description: "点击「低价好物」等与类目相关的 Tab。",
  },
  {
    id: "filters",
    title: "筛选与排序",
    description: "进货价区间、按销量排序、查询/搜索。",
  },
  {
    id: "pool_snapshot",
    title: "入池与快照",
    description: "加入候选池并写入 .data/xf-candidates JSON。",
    envHint: "XF_PICK_COUNT 控制最多条数",
  },
] as const;
