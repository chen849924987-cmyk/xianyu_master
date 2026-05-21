# 测试 (`tests/`)

- **第一次看** → [入门指南.md](./入门指南.md)
- **架构说明** → [ARCHITECTURE.md](./ARCHITECTURE.md)

## 分层（当前约定）

| 层级 | 路径 | 谁跑 |
|------|------|------|
| **Feature 真网验证** | **`tests/mcp/features/*.md`** | **AI + Playwright MCP（`user-playwright`）**；实录 **`docs/script/mcp-session-record.md`** → **`.data/mcp-session-records/`** |
| **离线契约 / 纯逻辑** | **`tests/mcp/protocols/offline-checks.md`** + **`tests/mcp/scripts/verify-offline.ts`** | **`npm run test`**（先 `tsc`，无浏览器、无 MCP） |
| **页面动作库** | `actions/` | 供 MCP 文档与人类对照；与 CLI 行为对齐 |
| **纯数据** | `pure/` | 登录墙表驱动等；由离线脚本消费 |
| **`specs/`** | [README](./specs/README.md) | **无** `*.spec.ts`；仅为占位说明 |

真网登录态约定：**`.cursor/rules/local-mcp-validation.mdc`**。

## 命令

| 脚本 | 说明 |
|------|------|
| `npm run test` | `tsc` + **`tsx tests/mcp/scripts/verify-offline.ts`**（注册表、xf 契约、`isLikelyFxgLoginWall`、密码登录配置） |
| `npm run sync:feature-docs` | 全量刷新 **`tests/mcp/features/*.md`** 与各 **`src/features/*/README.md`** 的 AUTO 区块（平时依赖 Cursor hook 即可） |

**验收某个 Feature**：在 Cursor 打开 **`tests/mcp/features/<feature-id>.md`**，启用 **`user-playwright`**，按步骤执行并落盘记录。离线校验协议见 **`tests/mcp/protocols/offline-checks.md`**。

## 与 `src/features/` 的关系

- **`src/features/`**：CLI / UI 调度的长流程脚本。
- **`tests/mcp/features/`**：与之一一对应的 **MCP 操作清单 + 期望**。
- **`tests/mcp/scripts/verify-offline.ts`**：机读对齐 **`tests/mcp/contracts/`** 与 `dist/`，替代原 Playwright unit spec。
