# 注释规范

## JSDoc 风格（公共 API）

```typescript
/**
 * 启动 Chromium 浏览器上下文
 * @param options - 启动配置选项
 * @returns 包含 browser、context、page 的对象
 */
export async function launchContext(options?: LaunchOptions): Promise<LaunchResult> {
  // ...
}

/**
 * 单个「页面功能」运行时可拿到的上下文
 */
export type FeatureRunContext = {
  page: Page;
  /** 抖店后台 origin，便于拼 URL */
  baseUrl: string;
  /** 可选：用于登录成功后写入 storageState 等 */
  browserContext?: BrowserContext;
};

/**
 * `.data/hook-usage.json` 汇总项
 * 与 harness/lib/hook-usage-tracker.mjs 一致
 */
type HookAgg = {
  event: string;
  script: string;
  invocations: number;
  failures: number;
  total_duration_ms: number;
  last_at: string | null;
  last_exit_code: number | null;
};
```

## 行内注释

```typescript
// 单行注释用于解释实现细节
await page.goto(landing, { waitUntil: "load", timeout: 120_000 });

try {
  await page.waitForLoadState("networkidle", { timeout: 25_000 });
} catch {
  /* 站点若有长连接，networkidle 可能超时；仍以 load 结果为准 */
}

// 复杂逻辑分段注释
// 1. 校验登录态文件是否存在且有效
const meta = getStorageStateMeta();
if (!meta.exists || !meta.validJson) {
  return undefined;
}

// 2. 启动浏览器并注入登录态
const browser = await chromium.launch({ headless: !appConfig.headed });
```

## 注释原则

1. **为什么而非什么** - 解释意图而非重复代码
2. **公共 API 必须文档化** - 使用 JSDoc
3. **复杂算法需注释** - 解释核心逻辑
4. **保持同步** - 修改代码时更新注释
5. **避免多余注释** - 显而易见的代码不加注释

```typescript
// ❌ 多余注释
// 增加计数器
counter++;

// ✅ 有价值的注释
// 抖店风控机制：连续快速操作会触发验证码，此处添加随机延迟
await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
```
