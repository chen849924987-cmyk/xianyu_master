# `tests/specs/`（已无 Playwright 自动化用例）

原 **`*.spec.ts`** 已移除：**本地测试约定为 AI 驱动**，见：

- **离线契约 / 纯逻辑**：**[`tests/mcp/protocols/offline-checks.md`](../mcp/protocols/offline-checks.md)** + **`tests/mcp/scripts/verify-offline.ts`**（`npm run test` 会 build 后执行）
- **Feature 真网**：**[`tests/mcp/features/`](../mcp/features/)** + Playwright MCP（`user-playwright`）

根目录 **`playwright.config.ts`** 仍可用于 **`codegen`** 等；默认 **`npx playwright test`** 在本仓库不再收集用例（本目录无 `*.spec.ts`）。
