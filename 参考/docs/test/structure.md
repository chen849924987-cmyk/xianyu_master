# 测试结构规范

## 仓库内目录分层（`tests/`）

Playwright 的 **`testDir`** 指向 **`tests/specs`**，用例文件只放在其下；其余目录为库代码：

| 路径 | 用途 |
|------|------|
| `tests/mcp/scripts/verify-offline.ts` | 无真网：注册表、契约、登录墙、密码登录配置（原 unit spec 逻辑） |
| `tests/specs/e2e/` | 仅占位 [**README**](../../tests/specs/e2e/README.md)；**不再**放抖店真网 `*.e2e.spec.ts` |
| `tests/mcp/features/*.md` | Feature 真网验收步骤（AI + Playwright MCP），结论落 `.data/mcp-session-records/` |
| `tests/actions/` | 页面动作（语义化步骤），可 `import()` **`dist/`** |
| `tests/pure/` | 纯数据或纯函数（表驱动向量等） |
| `tests/support/` | 仓库根解析、子进程 worker 等基础设施 |

**原则**：`specs` 里保持 **describe + expect + 环境变量**；DOM 与业务流程进 **`actions`**；静态用例表进 **`pure`**。

## 基础结构

```typescript
import { expect, test } from "@playwright/test";

// 可选：分组描述
test.describe("feature suite @tag", () => {
  
  // 测试用例
  test("should do something", async ({ page, context }) => {
    // 测试实现
  });
  
});
```

## 生命周期钩子

```typescript
test.describe("feature suite", () => {
  // 每组测试前执行
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // 每组测试后执行
  test.afterEach(async ({ page }) => {
    await page.close();
  });

  // 整个 describe 前执行一次
  test.beforeAll(async () => {
    // 准备共享数据
  });

  // 整个 describe 后执行一次
  test.afterAll(async () => {
    // 清理共享数据
  });
});
```

## 条件跳过

```typescript
// 示例：仅在显式打开开关时跑「可选」用例（换成你项目的 env 名即可）
test("optional integration", async () => {
  test.skip(process.env.RUN_OPTIONAL_INTEGRATION !== "1", "Set RUN_OPTIONAL_INTEGRATION=1");

  // 测试实现
});

// describe 级别跳过
test.describe("optional suite", () => {
  test.beforeAll(() => {
    test.skip(process.env.RUN_OPTIONAL_INTEGRATION !== "1", "Requires RUN_OPTIONAL_INTEGRATION=1");
  });

  test("test 1", async () => {});
  test("test 2", async () => {});
});
```

## 注解添加

```typescript
test("login test", async ({ page }, testInfo) => {
  // 添加测试注解（报告中可见）
  testInfo().annotations.push({
    type: "storage-state-path",
    description: storagePath,
  });
  
  testInfo().annotations.push({
    type: "feature-id",
    description: "login",
  });
  
  // 测试实现
});
```

## 控制台输出

```typescript
test("E2E test", async () => {
  // 控制台输出用于调试（标记 eslint 忽略）
  // eslint-disable-next-line no-console -- E2E operator visibility
  console.log(`[e2e] storage path: ${storagePath}`);
  
  // 条件性输出
  if (saveAfterLogin) {
    // eslint-disable-next-line no-console -- E2E operator visibility
    console.log("[e2e] saved storage state");
  } else {
    // eslint-disable-next-line no-console -- E2E operator visibility
    console.log("[e2e] did not save storage state");
  }
});
```
