# 工作台（`dashboard`）

> 本页说明：**这个 Feature 是干什么的**、**代码大致按什么顺序执行**。技术细节以 `.ts` 源码为准。

<!-- AUTO:FEATURE_FOLDER_README -->
> **本区块由 `node harness/lib/sync-feature-folder-readme.mjs`（或 Cursor `afterFileEdit` hook）根据源码自动生成**，请勿手工编辑；要写给用户看的流程说明请改下方「白话流程」区块。

## 源码索引（自动）

- **Feature id**：`dashboard`
- **列表上的名字**：工作台
- **本目录 TypeScript 文件**：`src/features/dashboard/index.ts`

### 命令行怎么跑

```bash
npm run dev -- --feature=dashboard
```

### 其它文档

- **给 AI / MCP 实测的步骤清单**：[`tests/mcp/features/dashboard.md`](../../../tests/mcp/features/dashboard.md)（相对路径从本 README 出发指向仓库内文件）
- **注册表条目**：`tests/mcp/contracts/features-mcp-registry.ts`

### 源码顶部说明（摘录）

```text
对应页面：工作台 / 首页概览（按实际路径修改 goto）
```

<!-- END:AUTO:FEATURE_FOLDER_README -->

<!-- MANUAL:FEATURE_FOLDER_README -->

## 这个 Feature 在干什么？

打开卖家后台的**工作台首页**（概览页）。前提是你已经有有效的登录态，否则会停在登录页。

## 代码大致怎么走？

1. 用 Playwright `page.goto` 打开：`{抖店后台域名}/ffa/mshop/homepage/index`。
2. 打一行日志提示「已打开」。
3. 后续业务步骤可以继续在同一个 `run` 里往下写。

源码只在 **`index.ts`**，非常短，通常当作「从工作台起步」的模板。

<!-- END:MANUAL:FEATURE_FOLDER_README -->
