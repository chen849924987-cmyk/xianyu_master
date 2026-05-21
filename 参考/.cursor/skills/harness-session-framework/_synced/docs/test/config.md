# Playwright 配置规范

## 配置文件

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  
  use: {
    baseURL: process.env.DOUDIAN_BASE_URL || "https://fxg.jinritemai.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

## 关键配置项

| 配置 | 说明 |
|------|------|
| `testDir` | 测试文件目录 |
| `fullyParallel` | 并行运行 |
| `forbidOnly` | CI 中禁止 `test.only` |
| `retries` | 失败重试次数 |
| `workers` | 并行工作进程数 |
| `reporter` | 报告格式 |

## use 配置

```typescript
use: {
  // 基础 URL
  baseURL: process.env.DOUDIAN_BASE_URL || "https://fxg.jinritemai.com",
  
  // 追踪（用于调试）
  trace: "on-first-retry",  // 第一次失败时记录
  
  // 截图
  screenshot: "only-on-failure",
  
  // 视频
  video: "retain-on-failure",
  
  // 视口
  viewport: { width: 1280, height: 720 },
  
  // 超时
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
}
```

## 项目配置

```typescript
projects: [
  // 桌面端 Chrome
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
  
  // 桌面端 Firefox
  {
    name: "firefox",
    use: { ...devices["Desktop Firefox"] },
  },
  
  // WebKit
  {
    name: "webkit",
    use: { ...devices["Desktop Safari"] },
  },
  
  // 移动端 Chrome
  {
    name: "Mobile Chrome",
    use: { ...devices["Pixel 5"] },
  },
],
```

## 全局 Setup

```typescript
// 全局前置
globalSetup: require.resolve("./tests/global-setup"),

// global-setup.ts
async function globalSetup() {
  // 启动服务、准备数据等
}

export default globalSetup;
```
