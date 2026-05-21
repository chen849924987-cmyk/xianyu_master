# Playwright 选择器规范

## 选择器优先级（按稳定性排序）

### 1. 文本匹配（最稳定）

```typescript
// 推荐：页面改版更稳定
await page.getByText("登录").click();
await page.getByText(/确认.*提交/).click();
```

### 2. ARIA 角色

```typescript
// 推荐：语义化，可访问性好
await page.getByRole("button", { name: "确认" }).click();
await page.getByRole("textbox", { name: "邮箱地址" }).fill("user@example.com");
await page.getByRole("link", { name: "工作台" }).click();
```

### 3. Label 关联

```typescript
// 通过 label 文本找到关联 input
await page.getByLabel("邮箱地址").fill("user@example.com");
await page.getByLabel("密码", { exact: true }).fill("password123");
```

### 4. Placeholder

```typescript
await page.getByPlaceholder("请输入邮箱").fill("user@example.com");
```

### 5. Test ID（配合前端添加）

```typescript
// 前端：<button data-testid="submit-btn">
await page.getByTestId("submit-btn").click();
```

### 6. CSS 选择器（必要时使用）

```typescript
// 通过 codegen 校准后的选择器
await page.locator('[data-testid="submit"]').click();
await page.locator("input[type='password']").fill("password");

// 链式定位
await page.locator(".login-form").locator("button[type='submit']").click();
```

## 避免使用的选择器

```typescript
// ❌ 过于具体的路径选择器（页面改版易失效）
await page.locator("div.container > div.header > button.btn-primary").click();

// ❌ 依赖样式类（CSS 重构易失效）
await page.locator(".css-1a2b3c4").click();

// ❌ 复杂 nth-child
await page.locator("div:nth-child(3) > span:nth-child(2)").click();
```

## 校准工具

页面改版时使用 codegen 重新校准选择器：

```bash
npm run codegen -- https://fxg.jinritemai.com/login
```

## 等待策略

```typescript
// 等待元素可见后操作
await page.waitForSelector(".button", { state: "visible", timeout: 30_000 });
await page.locator(".button").click();

// 或使用内建等待
await page.getByRole("button").waitFor({ state: "visible" });

// 等待网络空闲（慎用，站点长连接可能超时）
try {
  await page.waitForLoadState("networkidle", { timeout: 25_000 });
} catch {
  /* 超时继续 */
}
```
