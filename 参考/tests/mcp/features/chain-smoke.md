# Feature：`chain-smoke`（链路冒烟（公网示例页））

> 本文档面向：**新手读懂用途** + **AI 按 MCP 做实测**。上方摘要随源码自动更新；下方「手册区」可人工润色。

<!-- AUTO:FEATURE_DOC -->
> **本区块由仓库 hook / `node harness/lib/sync-feature-mcp-docs.mjs` 根据源码自动生成**，请勿手工编辑；要写补充说明请改下方「手册区」。

## 同步摘要（机读）

- **id**：`chain-smoke`
- **名称**：链路冒烟（公网示例页）
- **源码目录**：`src/features/chain-smoke/`
- **相关文件**：src/features/chain-smoke/index.ts

### 源码顶部说明（摘录）

```text
不依赖抖店账号，用于验证 CLI → launchContext → feature.run 整条链路
```

### 文中出现的 URL（自动抓取，便于 MCP 对照）

- https://example.com/

### CLI 快速对照

```bash
npm run dev -- --feature=chain-smoke
```

### 注册表

- 本 Feature 在 **`tests/mcp/contracts/features-mcp-registry.ts`** 中登记；离线对齐见 **`npm run test`**。

### MCP 推荐顺序（给 AI 的步骤骨架）

1. **`browser_navigate`** → `https://example.com/`
2. **`browser_snapshot`**（或 `browser_run_code_unsafe` 读 `page.title()`）
3. **期望**：标题匹配 `/Example Domain/i`

### MCP 实录要求

- 结论写入 **`.data/mcp-session-records/`**，模板 **`docs/script/mcp-session-record.md`**。
- Playwright MCP 工具名以 Cursor 启用 **`user-playwright`** 为准（如 `browser_navigate` / `browser_snapshot` / `browser_run_code_unsafe`）。

<!-- END:AUTO:FEATURE_DOC -->

<!-- MANUAL:FEATURE_DOC -->

## 给新手看的（白话）

这就像开车前先试一下刹车：**不用抖店账号**，只打开一个公开的示例网页（Example Domain）。若能正常打开并且标题对得上，说明「命令行 → 启动浏览器 → 跑脚本」这一条链路是通的。

## 给 AI 写 MCP 测试时的要点

- **不需要** `storage-state.json`。
- 用 **`browser_navigate`** 打开 `https://example.com/`，再 **`browser_snapshot`** 或 **`browser_run_code_unsafe`** 读 `page.title()`。
- **期望**：标题匹配 `/Example Domain/i`，与 CLI `npm run dev -- --feature=chain-smoke` 一致。
- 实录模板：**`docs/script/mcp-session-record.md`** → **`.data/mcp-session-records/`**。

<!-- END:MANUAL:FEATURE_DOC -->
