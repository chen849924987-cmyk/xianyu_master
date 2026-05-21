# 登录（`login`）

> 本页说明：**这个 Feature 是干什么的**、**代码大致按什么顺序执行**。技术细节以 `.ts` 源码为准。

<!-- AUTO:FEATURE_FOLDER_README -->
> **本区块由 `node harness/lib/sync-feature-folder-readme.mjs`（或 Cursor `afterFileEdit` hook）根据源码自动生成**，请勿手工编辑；要写给用户看的流程说明请改下方「白话流程」区块。

## 源码索引（自动）

- **Feature id**：`login`
- **列表上的名字**：登录
- **本目录 TypeScript 文件**：`src/features/login/index.ts`

### 命令行怎么跑

```bash
npm run dev -- --feature=login
```

### 其它文档

- **给 AI / MCP 实测的步骤清单**：[`tests/mcp/features/login.md`](../../../tests/mcp/features/login.md)（相对路径从本 README 出发指向仓库内文件）
- **注册表条目**：`tests/mcp/contracts/features-mcp-registry.ts`

### 源码顶部说明（摘录）

```text
默认：门户落地 + 工作台校验（依赖已有 storageState）。
配置 DOUDIAN_PASSWORD_LOGIN 与邮箱密码后：自动走门户邮箱登录；遇滑块需在 headed 下人工完成。
```

<!-- END:AUTO:FEATURE_FOLDER_README -->

<!-- MANUAL:FEATURE_FOLDER_README -->

## 这个 Feature 在干什么？

帮你完成「**登录抖店后台**」这件事：要么用**已经保存好的登录状态文件**，要么按配置用**邮箱 + 密码自动登录**（遇到滑块/验证码通常要人在浏览器里帮一下）。

## 代码大致怎么走？

1. **看配置**：调用 `isPasswordLoginConfigured()` 判断是否走「自动密码登录」分支。
2. **分支 A — 不配密码**：打开门户首页（`baseUrl/`），假设本地已有可用的 `storage-state`；稍作等待后继续下一步。
3. **分支 B — 配了密码**：走 `performPasswordLogin`（具体填表、点按钮在工具函数里）。
4. **统一收尾**：调用 `openWorkbenchAndAssertLoggedIn`，确认最终落到**工作台**而不是登录墙。
5. **可选写回登录态**：若设置 `DOUDIAN_SAVE_SESSION_AFTER_LOGIN=1`，在工作台校验通过后可把当前 Cookie 写回 `STORAGE_STATE_PATH`（密码登录与仅靠已有 storage 打开门户两种路径都会写）。

细节都在 **`index.ts`**；密码相关底层在 **`src/utils/`**（与抖店页面结构绑定）。

<!-- END:MANUAL:FEATURE_FOLDER_README -->
