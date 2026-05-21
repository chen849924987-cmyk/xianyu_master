# 断言规范

## 基础断言

```typescript
import { expect } from "@playwright/test";

// 相等
expect(value).toBe(expected);

// 真值
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// 包含
expect(array).toHaveLength(n);
expect(string).toContain(substring);
expect(string).toMatch(/regex/);

// 对象
expect(object).toEqual(expectedObject);
expect(object).toHaveProperty("key", value);
```

## Playwright 专用断言

```typescript
// URL
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveURL("https://example.com/path");

// 元素可见
await expect(page.locator(".button")).toBeVisible();
await expect(page.locator(".button")).toBeEnabled();
await expect(page.locator(".button")).toBeDisabled();

// 元素内容
await expect(page.locator(".title")).toHaveText("Expected Title");
await expect(page.locator(".count")).toHaveText(/\d+/);

// 元素数量
await expect(page.locator(".item")).toHaveCount(5);
```

## 自定义消息

```typescript
// 添加自定义断言消息
expect(
  pwdMod.isPasswordLoginConfigured(),
  "needs DOUDIAN_PASSWORD_LOGIN=1 and credentials in .env"
).toBe(true);

expect(result).toBe(
  expected,
  `Expected ${expected} but got ${result}`
);
```

## 异步断言

```typescript
// 自动重试直到超时
await expect(async () => {
  const response = await page.request.get("/api/status");
  expect(response.status()).toBe(200);
}).toPass({ timeout: 30_000 });

// 等待元素状态
await expect(page.locator(".result")).toBeVisible({ timeout: 10_000 });
```

## 软断言

```typescript
import { test, expect } from "@playwright/test";

test("soft assertions", async () => {
  // 软断言，失败继续执行
  await expect.soft(page.locator(".title")).toHaveText("Title");
  await expect.soft(page.locator(".count")).toHaveText("10");
  
  // 硬断言，失败立即终止
  await expect(page.locator(".critical")).toBeVisible();
});
```

## 否定断言

```typescript
// 不等于
expect(value).not.toBe(other);

// 不包含
expect(string).not.toContain("unexpected");

// 不存在
await expect(page.locator(".error")).not.toBeVisible();

// URL 不匹配
expect(isLikelyFxgLoginWall(page.url())).toBe(false);
```
