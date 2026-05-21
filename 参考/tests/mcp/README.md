# MCP 验证（Feature 真网 / 页面行为）

**`npm test` 仅跑离线脚本**（不启动 MCP）。Feature 真网须 **Cursor 内 AI** 使用 **`user-playwright`** 按下列文档执行；结论 **`docs/script/mcp-session-record.md`** → **`.data/mcp-session-records/`**。  
每个 Feature 对应 **`features/<id>.md`**：上半部 **`AUTO`** 随源码由 **`afterFileEdit`** hook（`harness/hooks/after-file-sync-feature-mcp-docs.mjs`）刷新；下半部 **`MANUAL`** 可人工润色（详见 **`npm run sync:feature-docs`**）。  
面向终端用户的「代码怎么走」另见 **`src/features/<目录>/README.md`**（与 MCP 文档一并刷新 AUTO）。

## 离线校验（AI / CI）

- 协议：**[`protocols/offline-checks.md`](./protocols/offline-checks.md)**
- 脚本：**`scripts/verify-offline.ts`**（`npm run test` = build + 该脚本）

## 注册表（机读）

**`contracts/features-mcp-registry.ts`** — 与 `dist/features/index.js` 的 `listFeatures()` **id / displayName** 对齐；由 **`verify-offline.ts`** 校验。

## 按 Feature 打开协议

| Feature ID | 文档 |
|------------|------|
| `chain-smoke` | [features/chain-smoke.md](./features/chain-smoke.md) |
| `login` | [features/login.md](./features/login.md) |
| `dashboard` | [features/dashboard.md](./features/dashboard.md) |
| `session-verify` | [features/session-verify.md](./features/session-verify.md) |
| `feige-workspace` | [features/feige-workspace.md](./features/feige-workspace.md) |
| `xf-ali-find-low-goods` | [features/xf-ali-find-low-goods.md](./features/xf-ali-find-low-goods.md) |

## 额外契约（仅 xf）

**`contracts/xf-low-goods-mcp-contract.ts`** · 离线校验含于 **`npm run test`**（`verify-offline.ts`）
