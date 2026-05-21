# Feature：`session-verify`（登录态校验（工作台））

> 本文档面向：**新手读懂用途** + **AI 按 MCP 做实测**。上方摘要随源码自动更新；下方「手册区」可人工润色。

<!-- AUTO:FEATURE_DOC -->
> **本区块由仓库 hook / `node harness/lib/sync-feature-mcp-docs.mjs` 根据源码自动生成**，请勿手工编辑；要写补充说明请改下方「手册区」。

## 同步摘要（机读）

- **id**：`session-verify`
- **名称**：登录态校验（工作台）
- **源码目录**：`src/features/session-verify/`
- **相关文件**：src/features/session-verify/index.ts

### 源码顶部说明（摘录）

```text
用当前 storageState 打开工作台，根据落地 URL / 标题粗略判断是否仍处于登录态。
```

### CLI 快速对照

```bash
npm run dev -- --feature=session-verify
```

### 注册表

- 本 Feature 在 **`tests/mcp/contracts/features-mcp-registry.ts`** 中登记；离线对齐见 **`npm run test`**。

### MCP 推荐顺序（给 AI 的步骤骨架）

- 与 **dashboard** 相同入口（storage + 工作台路径）。
- 对照 CLI 日志：`HTTP`、`finalUrl`、`title`；快照应显示仍停留在后台而非登录墙。

### MCP 实录要求

- 结论写入 **`.data/mcp-session-records/`**，模板 **`docs/script/mcp-session-record.md`**。
- Playwright MCP 工具名以 Cursor 启用 **`user-playwright`** 为准（如 `browser_navigate` / `browser_snapshot` / `browser_run_code_unsafe`）。

<!-- END:AUTO:FEATURE_DOC -->

<!-- MANUAL:FEATURE_DOC -->

## 给新手看的（白话）

用来**检查「我现在还算不算登录成功」**：用当前保存的 Cookie 去打开工作台，看落地页是不是又被踢回登录。

## 给 AI 写 MCP 测试时的要点

- 与 **dashboard** 类似：带 storage 打开工作台路径。
- 对照源码日志里的 **HTTP 状态、finalUrl、title**；快照中确认 **未命中典型登录墙**。
- CLI 对照：`npm run dev -- --feature=session-verify`。

<!-- END:MANUAL:FEATURE_DOC -->
