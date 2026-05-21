import type { BrowserContext, Page } from "playwright";

/** 单个「页面功能」运行时可拿到的上下文 */
export type FeatureRunContext = {
  page: Page;
  /** 抖店后台 origin，便于拼 URL */
  baseUrl: string;
  /** 可选：用于登录成功后写入 storageState 等 */
  browserContext?: BrowserContext;
};

/** 与抖店后台某一页面对应的自动化模块 */
export type FeatureModule = {
  /** 目录名 slug，如 login、order-list */
  id: string;
  /** 中文说明：对应后台哪一页 */
  displayName: string;
  run: (ctx: FeatureRunContext) => Promise<void>;
};
