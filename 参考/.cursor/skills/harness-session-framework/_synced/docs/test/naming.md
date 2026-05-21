# 测试文件命名规范

## 命名规则

| 类型 | 命名 | 示例 |
|------|------|------|
| 离线校验脚本 | `tests/mcp/scripts/*.ts`（由 `npm run test` / AI 按协议触发） | `tests/mcp/scripts/verify-offline.ts` |
| Feature 真网（AI / MCP） | `*.md`（放在 `tests/mcp/features/`） | `tests/mcp/features/login.md` |
| ~~Playwright E2E~~ | ~~`*.e2e.spec.ts`~~ | 已废弃；真网改由 MCP playbook + `.data/mcp-session-records/` |

## 测试 describe 命名

```typescript
// 使用功能领域 + 标签
test.describe("xf low goods MCP contract @unit", () => {
  // 契约 / 注册表（非页面自动化）
});

test.describe("password login config @unit", () => {
  // 单元测试
});

test.describe("feature job history @api", () => {
  // API 测试
});
```

## 测试用例命名

```typescript
// ✅ 描述性行为说明
test("performPasswordLogin leaves FXG login wall", async () => {
  // 说明测试的行为和预期结果
});

test("should return 404 for non-existent job", async () => {
  // 
});

test("logs error when storage state is corrupted", async () => {
  //
});

// ❌ 避免的命名
test("login test", async () => {});  // 太笼统
test("test1", async () => {});        // 无意义
```
