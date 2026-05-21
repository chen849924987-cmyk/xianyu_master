# 登录态校验（工作台）（`session-verify`）

> 本页说明：**这个 Feature 是干什么的**、**代码大致按什么顺序执行**。技术细节以 `.ts` 源码为准。

<!-- AUTO:FEATURE_FOLDER_README -->
> **本区块由 `node harness/lib/sync-feature-folder-readme.mjs`（或 Cursor `afterFileEdit` hook）根据源码自动生成**，请勿手工编辑；要写给用户看的流程说明请改下方「白话流程」区块。

## 源码索引（自动）

- **Feature id**：`session-verify`
- **列表上的名字**：登录态校验（工作台）
- **本目录 TypeScript 文件**：`src/features/session-verify/index.ts`

### 命令行怎么跑

```bash
npm run dev -- --feature=session-verify
```

### 其它文档

- **给 AI / MCP 实测的步骤清单**：[`tests/mcp/features/session-verify.md`](../../../tests/mcp/features/session-verify.md)（相对路径从本 README 出发指向仓库内文件）
- **注册表条目**：`tests/mcp/contracts/features-mcp-registry.ts`

### 源码顶部说明（摘录）

```text
用当前 storageState 打开工作台，根据落地 URL / 标题粗略判断是否仍处于登录态。
```

<!-- END:AUTO:FEATURE_FOLDER_README -->

<!-- MANUAL:FEATURE_FOLDER_README -->

## 这个 Feature 在干什么？

**检查当前保存的登录还有没有用**：用现有 Cookie 去打开工作台，看会不会被踢回登录页。

## 代码大致怎么走？

1. 打日志说明开始校验。
2. 调用 `openWorkbenchAndAssertLoggedIn(page, baseUrl)`：内部会导航并判断是否像登录墙。
3. 把 HTTP 状态、最终 URL、页面标题（截一段）打到日志里，方便你对照。
4. 若断言失败会直接抛错；成功则打印「通过」类日志。

源码在 **`index.ts`**，核心是复用工坊登录校验逻辑。

<!-- END:MANUAL:FEATURE_FOLDER_README -->
