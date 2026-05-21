# 测试标签规范

> **本仓库**：已不再维护 `tests/specs/**/*.spec.ts`；离线用 **`npm run test`**，真网用 **`tests/mcp/features/*.md`** + MCP。下文 **`npx playwright test --grep`** 示例仅供若日后重新引入 Playwright 用例时参考。

## 标签格式

使用 `@tag` 标记测试分类：

```typescript
test.describe("xf MCP contract @douyin @unit", () => {
  test("registry aligns with dist features", async () => {});
});

test.describe("password config @unit", () => {
  test("should validate config", async () => {});
});
```

## 常用标签

| 标签 | 用途 | 运行命令 |
|------|------|----------|
| `@douyin` | 依赖抖店真网的测试 | `--grep "@douyin"` |
| `@critical` | 关键路径测试 | `--grep "@critical"` |
| `@unit` | 单元测试 | `--grep "@unit"` |
| `@api` | API 测试 | `--grep "@api"` |
| `@slow` | 执行较慢的测试 | `--grep "@slow"` |
| `@flaky` | 可能不稳定的测试 | `--grep "@flaky"` |

## 运行指定标签

```bash
# 运行抖店相关测试
npx playwright test --grep "@douyin"

# 运行关键测试
npx playwright test --grep "@critical"

# 排除抖店测试
npx playwright test --grep-invert "@douyin"

# 组合条件
npx playwright test --grep "@douyin @critical"
```

## 跳过标签

```typescript
// 自动跳过条件不满足的测试
test("slow test @slow", async () => {
  test.slow();  // 标记为慢测试，增加超时
  // ...
});

// 条件跳过特定标签（示例 env，勿与已移除的 DOUDIAN_E2E_LOGIN 混淆）
test("conditional @douyin", async () => {
  test.skip(process.env.RUN_DOUYIN_SPECS !== "1", "Set RUN_DOUYIN_SPECS=1");
  // ...
});
```

## 标签组合

```typescript
test.describe("comprehensive tests", () => {
  test("critical douyin-facing contract @critical @douyin", async () => {
    // 关键且引用抖店域名 / 契约（非 Playwright 页面 E2E）
  });
  
  test("critical unit @critical @unit", async () => {
    // 关键但不依赖真网
  });
  
  test("slow API @slow @api", async () => {
    // 慢速 API 测试
  });
});
```
