import type { Page } from "@playwright/test";
import { pathToFileURL } from "node:url";
import path from "node:path";

import { resolveRepoRoot } from "../../support/repo-root.js";

/** 与 `dist/utils/index.js` 导出子集对齐（动态 import，不在 tsc rootDir 内） */
type DoudianUtilsDist = {
  performPasswordLogin: (page: Page, baseUrl: string) => Promise<void>;
  openWorkbenchAndAssertLoggedIn: (
    page: Page,
    baseUrl: string,
  ) => Promise<{ finalUrl: string; title: string; httpStatus: number | undefined }>;
};

let cached: Promise<DoudianUtilsDist> | undefined;

async function loadDoudianUtils(): Promise<DoudianUtilsDist> {
  if (!cached) {
    const root = resolveRepoRoot(import.meta.url);
    const href = pathToFileURL(path.join(root, "dist", "utils", "index.js")).href;
    cached = import(href) as Promise<DoudianUtilsDist>;
  }
  return cached;
}

/** 门户邮箱密码登录（含验证码等待）；需环境变量已配置 */
export async function doudianPerformPasswordLogin(page: Page, baseUrl: string): Promise<void> {
  const { performPasswordLogin } = await loadDoudianUtils();
  await performPasswordLogin(page, baseUrl);
}

/** 打开工作台并断言未落在登录墙 */
export async function doudianAssertWorkbenchLoggedIn(
  page: Page,
  baseUrl: string,
): Promise<{ finalUrl: string; title: string; httpStatus: number | undefined }> {
  const { openWorkbenchAndAssertLoggedIn } = await loadDoudianUtils();
  return openWorkbenchAndAssertLoggedIn(page, baseUrl);
}
