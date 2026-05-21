# 浏览器启动规范

## 启动函数

```typescript
// src/utils/browser.ts
import { chromium } from "playwright";
import fs from "node:fs";

export type LaunchResult = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
};

/**
 * 启动 Chromium。若存在 STORAGE_STATE 则注入登录态。
 */
export async function launchContext(): Promise<LaunchResult> {
  const statePath = usableStorageStatePath();
  
  if (statePath) {
    log.info("使用登录态文件:", statePath);
  } else if (storageStateExists()) {
    log.warn("登录态文件存在但无效，将重新登录");
  } else {
    log.warn("未找到登录态文件，登录后可执行 save-session 保存 Cookie");
  }

  const browser = await chromium.launch({
    headless: !appConfig.headed,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    ...(statePath ? { storageState: statePath } : {}),
  });

  const page = await context.newPage();

  return {
    browser,
    context,
    page,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}
```

## 登录态校验

```typescript
/** 校验文件内容为合法 JSON；损坏时勿传给 Playwright */
function usableStorageStatePath(): string | undefined {
  const meta = getStorageStateMeta();
  if (!meta.exists) return undefined;
  if (meta.validJson) return meta.path;
  log.warn(
    "登录态文件 JSON 无效，已跳过注入（请重新执行 npm run dev -- --save-session 或恢复备份）:",
    (meta.parseError || "").slice(0, 200),
  );
  return undefined;
}
```

## 保存登录态

```typescript
/**
 * 将当前上下文的 Cookie/LocalStorage 等写入配置的 storage 路径
 */
export async function saveStorageState(context: BrowserContext): Promise<void> {
  const dir = path.dirname(appConfig.storageStatePath);
  fs.mkdirSync(dir, { recursive: true });
  await context.storageState({ path: appConfig.storageStatePath });
  log.info("已保存登录态:", appConfig.storageStatePath);
}
```

## 关闭顺序

```typescript
// ✅ 正确的关闭顺序
await context.close();   // 先关闭上下文
await browser.close();   // 再关闭浏览器

// 或使用封装方法
await close();
```
