# Feature：`dashboard`（工作台）

> 本文档面向：**新手读懂用途** + **AI 按 MCP 做实测**。上方摘要随源码自动更新；下方「手册区」可人工润色。

<!-- AUTO:FEATURE_DOC -->
> **本区块由仓库 hook / `node harness/lib/sync-feature-mcp-docs.mjs` 根据源码自动生成**，请勿手工编辑；要写补充说明请改下方「手册区」。

## 同步摘要（机读）

- **id**：`dashboard`
- **名称**：工作台
- **源码目录**：`src/features/dashboard/`
- **相关文件**：src/features/dashboard/index.ts

### 源码顶部说明（摘录）

```text
对应页面：工作台 / 首页概览（按实际路径修改 goto）
```

### CLI 快速对照

```bash
npm run dev -- --feature=dashboard
```

### 注册表

- 本 Feature 在 **`tests/mcp/contracts/features-mcp-registry.ts`** 中登记；离线对齐见 **`npm run test`**。

### MCP 推荐顺序（给 AI 的步骤骨架）

1. `browser_run_code_unsafe`：`browser.newContext({ storageState: '<仓库>/.data/storage-state.json' })` 新开页面
2. `goto` → `{DOUDIAN_BASE_URL}/ffa/mshop/homepage/index`
3. **`browser_snapshot`**：确认工作台已加载

### MCP 实录要求

- 结论写入 **`.data/mcp-session-records/`**，模板 **`docs/script/mcp-session-record.md`**。
- Playwright MCP 工具名以 Cursor 启用 **`user-playwright`** 为准（如 `browser_navigate` / `browser_snapshot` / `browser_run_code_unsafe`）。

<!-- END:AUTO:FEATURE_DOC -->

<!-- MANUAL:FEATURE_DOC -->

## 给新手看的（白话）

就是帮你打开抖店后台的**工作台首页**（卖家后台里看概况的那个页面）。  
前提是：你已经有一份有效的登录态文件，否则很容易停在登录页。

## 给 AI 写 MCP 测试时的要点

- **前置**：`storage-state.json`（或 `STORAGE_STATE_PATH`）有效。
- MCP：带 **`storageState`** 开 context，`goto` **工作台路径**（源码用 `${baseUrl}/ffa/mshop/homepage/index`）。
- **期望**：快照里像正常后台，而不是典型登录墙 URL/文案。
- CLI 对照：`npm run dev -- --feature=dashboard`。

<!-- END:MANUAL:FEATURE_DOC -->
