/**
 * 与 `src/features/xf-ali-find-low-goods` 及 MCP 实录对齐的**校验契约**（无浏览器）。
 * featureId 须与 `ui-pipeline.ts` 中 `XF_LOW_GOODS_UI_FEATURE_ID` 一致。
 */
export const xfLowGoodsMcpContract = {
  featureId: "xf-ali-find-low-goods" as const,
  featureEntry: "src/features/xf-ali-find-low-goods/index.ts",
  uiPipeline: "src/features/xf-ali-find-low-goods/ui-pipeline.ts",
  /** 默认登录态（相对仓库根）；可被 STORAGE_STATE_PATH 覆盖 */
  storageStateDefaultRelative: ".data/storage-state.json",
  /** MCP 内 `browser_run_code_unsafe` 校验工作台是否带登录态 */
  workbenchPath: "/ffa/mshop/homepage/index",
  /** 服务市场入口示例（与日志中 fuwu 链接同类） */
  fuwuPathExample: "https://fuwu.jinritemai.com/?from=ddpc.home.topbar",
  /** 点击晓风前等待侧栏文案（与 feature 内 wait 一致） */
  sidecarWaitMsHint: 5000,
  /** 导航服务市场并静置后，Playwright locator 计数下限（与 MCP 实录一致） */
  postFuwuDomExpectations: {
    pageTitleIncludes: "抖店服务市场",
    minLocatorCountCommonServices: 1,
    minLocatorCountXiaofeng: 1,
  },
  /** 策略说明：与 feature 内 clickXiaofengInFrame 注释一致 */
  clickStrategyNote:
    "优先在同时含「常用服务」或「已购服务」与完整晓风标题的窄容器内点击，避免中部「店铺经营工具」大卡。",
} as const;

export type XfLowGoodsMcpContract = typeof xfLowGoodsMcpContract;
