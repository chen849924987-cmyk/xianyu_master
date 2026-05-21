# 飞鸽工作台（`feige-workspace`）

> 本页说明：**这个 Feature 是干什么的**、**代码大致按什么顺序执行**。技术细节以 `.ts` 源码为准。

<!-- AUTO:FEATURE_FOLDER_README -->
> **本区块由 `node harness/lib/sync-feature-folder-readme.mjs`（或 Cursor `afterFileEdit` hook）根据源码自动生成**，请勿手工编辑；要写给用户看的流程说明请改下方「白话流程」区块。

## 源码索引（自动）

- **Feature id**：`feige-workspace`
- **列表上的名字**：飞鸽工作台
- **本目录 TypeScript 文件**：`src/features/feige-workspace/index.ts`

### 命令行怎么跑

```bash
npm run dev -- --feature=feige-workspace
```

### 其它文档

- **给 AI / MCP 实测的步骤清单**：[`tests/mcp/features/feige-workspace.md`](../../../tests/mcp/features/feige-workspace.md)（相对路径从本 README 出发指向仓库内文件）
- **注册表条目**：`tests/mcp/contracts/features-mcp-registry.ts`

### 源码顶部说明（摘录）

```text
飞鸽客服工作台（对齐 AGENT_TODOLIST 三、3.1 打开会话站点）。
```

<!-- END:AUTO:FEATURE_FOLDER_README -->

<!-- MANUAL:FEATURE_FOLDER_README -->

## 这个 Feature 在干什么？

打开 **飞鸽**（抖店客服 IM）工作台网页，确认能进到客服站点而不是无关登录页。

## 代码大致怎么走？

1. 从配置读 IM 根地址（常见 `im.jinritemai.com`，可由环境变量覆盖）。
2. 调用 `openFeigeWorkspaceAndAssertLoggedIn`：打开 IM、等待加载、按 URL/标题等判断是否像登录拦截。
3. 日志输出 HTTP、URL、标题摘要。

源码在 **`index.ts`**。**注意**：保存登录态时要覆盖 IM 域名，否则光有后台 Cookie 也可能进不去飞鸽。

<!-- END:MANUAL:FEATURE_FOLDER_README -->
