# MCP 离线校验协议（供 Cursor 内 AI）

本协议替代原 **`tests/specs/unit/*.spec.ts`** Playwright 单测：**不落自动化 spec**，由 AI 按下列顺序 human-in-the-loop / 工具辅助验证。

## 1. 机读脚本（推荐：一轮跑完）

前提：仓库根目录已 **`npm run build`**。

在终端执行（与本仓库 **`npm run test`** 等价的核心校验）：

```bash
npx tsx tests/mcp/scripts/verify-offline.ts
```

失败时脚本 **非零退出**，并在 stderr 打出具体断言说明。AI 应将输出写入会话结论或 **`.data/mcp-session-records/`**（可与真网实录同一模板 **`docs/script/mcp-session-record.md`**）。

覆盖范围（与原 unit spec 一致）：

- `isLikelyFxgLoginWall` 表驱动（数据：`tests/pure/login-wall-cases.ts`）
- `isPasswordLoginConfigured` 子进程隔离 env（`tests/support/spawn-password-login-configured.ts`）
- **`FEATURE_MCP_REGISTRY`** 与 `dist/features/index.js` 的 `listFeatures()` id / displayName / 协议文件存在性
- **`xfLowGoodsMcpContract`** 字段合法性与 `XF_LOW_GOODS_UI_FEATURE_ID` 对齐

## 2. Feature 真网（必须用 Playwright MCP）

启用 **`user-playwright`**，按 **`tests/mcp/features/<feature-id>.md`** 逐步执行；注册表见 **`tests/mcp/contracts/features-mcp-registry.ts`**，索引 **`tests/mcp/README.md`**。

## 3. 变更清单约定

- 新增 / 改名 Feature：更新 **`tests/mcp/contracts/features-mcp-registry.ts`** 与对应 **`tests/mcp/features/*.md`**，再跑 **§1** 脚本确认对齐。
- 调整登录墙判定或密码配置语义：改 **`src/utils/doudian-password-login.ts`** 时同步 **`tests/pure/login-wall-cases.ts`**（如需），再跑 **§1**。
