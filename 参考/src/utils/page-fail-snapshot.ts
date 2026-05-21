import fs from "node:fs";
import type { Page } from "playwright";
import { log } from "./logger.js";

/**
 * 失败排查：整页截图 + 当前 DOM HTML，写入 `basePathNoExt.png` / `.html`。
 */
export async function writePageFailSnapshotFiles(
  page: Page,
  basePathNoExt: string,
): Promise<void> {
  try {
    const pngPath = `${basePathNoExt}.png`;
    await page.screenshot({ path: pngPath, fullPage: true });
    log.warn("[doudian] 失败快照（截图）:", pngPath);
  } catch (e) {
    log.warn("[doudian] 失败快照截图写入失败:", e);
  }
  try {
    const htmlPath = `${basePathNoExt}.html`;
    fs.writeFileSync(htmlPath, await page.content(), "utf8");
    log.warn("[doudian] 失败快照（HTML）:", htmlPath);
  } catch (e) {
    log.warn("[doudian] 失败快照 HTML 写入失败:", e);
  }
}
