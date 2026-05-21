# 异步与错误处理规范

## 超时规范

使用数字字面量，支持下划线分隔：

```typescript
// ✅ 使用下划线分隔（ES2021+）
await page.waitForSelector(".element", { timeout: 30_000 });
await page.goto(url, { timeout: 120_000 });
await new Promise((r) => setTimeout(r, 800));

// ❌ 避免
await page.waitForSelector(".element", { timeout: 30000 });
```

## 预期失败处理

对可能失败但不阻塞主流程的操作，使用 try/catch：

```typescript
try {
  await page.waitForLoadState("networkidle", { timeout: 25_000 });
} catch {
  /* 站点若有长连接，networkidle 可能超时；仍以 load 结果为准 */
}

try {
  await page.waitForSelector(".optional-element", { timeout: 5_000 });
} catch {
  /* 可选元素可能不存在，继续执行 */
}
```

## 关键错误处理

关键步骤失败应抛出错误：

```typescript
export async function openWorkbenchAndAssertLoggedIn(
  page: Page,
  baseUrl: string
): Promise<{ httpStatus: number; finalUrl: string }> {
  const workbenchUrl = `${baseUrl}/ffa/shop/dashboard`;
  await page.goto(workbenchUrl, { waitUntil: "load", timeout: 60_000 });
  
  const url = page.url();
  if (isLikelyFxgLoginWall(url)) {
    throw new Error(`登录态失效，被重定向到登录页: ${url}`);
  }
  
  return { httpStatus, finalUrl: url };
}
```

## 返回类型显式声明

复杂类型显式声明返回类型：

```typescript
export type LaunchResult = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
};

export async function launchContext(): Promise<LaunchResult> {
  // ...
}
```

## 延迟与等待

```typescript
// ✅ 使用 Promise + setTimeout
await new Promise((r) => setTimeout(r, 800));

// ❌ 避免（Node.js 无内置 sleep）
await sleep(800);  // 未定义
```

## 异步迭代

```typescript
// ✅ 使用 for...of 而非 forEach（保持异步顺序）
for (const item of items) {
  await processItem(item);
}

// ❌ 避免（并行执行，不等待）
items.forEach(async (item) => {
  await processItem(item);
});

// ✅ 如需并行，使用 Promise.all
await Promise.all(items.map((item) => processItem(item)));
```
