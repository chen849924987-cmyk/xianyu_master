# Feature：`feige-workspace`（飞鸽工作台）

> 本文档面向：**新手读懂用途** + **AI 按 MCP 做实测**。上方摘要随源码自动更新；下方「手册区」可人工润色。

<!-- AUTO:FEATURE_DOC -->
> **本区块由仓库 hook / `node harness/lib/sync-feature-mcp-docs.mjs` 根据源码自动生成**，请勿手工编辑；要写补充说明请改下方「手册区」。

## 同步摘要（机读）

- **id**：`feige-workspace`
- **名称**：飞鸽工作台
- **源码目录**：`src/features/feige-workspace/`
- **相关文件**：src/features/feige-workspace/index.ts

### 源码顶部说明（摘录）

```text
飞鸽客服工作台（对齐 AGENT_TODOLIST 三、3.1 打开会话站点）。
```

### CLI 快速对照

```bash
npm run dev -- --feature=feige-workspace
```

### 注册表

- 本 Feature 在 **`tests/mcp/contracts/features-mcp-registry.ts`** 中登记；离线对齐见 **`npm run test`**。

### MCP 推荐顺序（给 AI 的步骤骨架）

1. 使用含 IM Cookie 的 `storageState`
2. **`browser_navigate`** → `DOUDIAN_IM_BASE_URL`（常为 `https://im.jinritemai.com`）
3. **期望**：进入飞鸽相关界面或未拦截在无关登录页

### MCP 实录要求

- 结论写入 **`.data/mcp-session-records/`**，模板 **`docs/script/mcp-session-record.md`**。
- Playwright MCP 工具名以 Cursor 启用 **`user-playwright`** 为准（如 `browser_navigate` / `browser_snapshot` / `browser_run_code_unsafe`）。

<!-- END:AUTO:FEATURE_DOC -->

<!-- MANUAL:FEATURE_DOC -->

## 给新手看的（白话）

打开 **飞鸽**（抖店客服聊天工作台）对应的网站。  
注意：保存登录状态时，要覆盖到 **飞鸽用的域名**，否则光有后台 Cookie 也可能进不去飞鸽。

## 给 AI 写 MCP 测试时的要点

- **前置**：storage 里需包含 **IM 域** Cookie（常见 `im.jinritemai.com`，以 `DOUDIAN_IM_BASE_URL` 为准）。
- MCP：`goto` IM 根 URL → snapshot → 期望不像无关登录拦截页。
- CLI 对照：`npm run dev -- --feature=feige-workspace`。

<!-- END:MANUAL:FEATURE_DOC -->
