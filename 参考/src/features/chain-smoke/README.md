# 链路冒烟（公网示例页）（`chain-smoke`）

> 本页说明：**这个 Feature 是干什么的**、**代码大致按什么顺序执行**。技术细节以 `.ts` 源码为准。

<!-- AUTO:FEATURE_FOLDER_README -->
> **本区块由 `node harness/lib/sync-feature-folder-readme.mjs`（或 Cursor `afterFileEdit` hook）根据源码自动生成**，请勿手工编辑；要写给用户看的流程说明请改下方「白话流程」区块。

## 源码索引（自动）

- **Feature id**：`chain-smoke`
- **列表上的名字**：链路冒烟（公网示例页）
- **本目录 TypeScript 文件**：`src/features/chain-smoke/index.ts`

### 命令行怎么跑

```bash
npm run dev -- --feature=chain-smoke
```

### 其它文档

- **给 AI / MCP 实测的步骤清单**：[`tests/mcp/features/chain-smoke.md`](../../../tests/mcp/features/chain-smoke.md)（相对路径从本 README 出发指向仓库内文件）
- **注册表条目**：`tests/mcp/contracts/features-mcp-registry.ts`

### 源码顶部说明（摘录）

```text
不依赖抖店账号，用于验证 CLI → launchContext → feature.run 整条链路
```

### 代码里出现的网址（自动列出）

- https://example.com/

<!-- END:AUTO:FEATURE_FOLDER_README -->

<!-- MANUAL:FEATURE_FOLDER_README -->

## 这个 Feature 在干什么？

像「体检」一样：**不登录抖店**，只打开一个公开网页，确认程序能正常启动浏览器、打开页面、读到标题。用来证明整条工具链没坏。

## 代码大致怎么走？

1. **入口**：`FeatureModule.run` 收到 Playwright 的 `page`。
2. **打开页面**：访问常量里的示例网址（`example.com`）。
3. **检查结果**：HTTP 要成功；页面标题里要出现「Example Domain」字样。
4. **结束**：打日志；不对就抛错，让你在终端立刻看到。

对应源码主要在 **`index.ts`** 里，逻辑很短，适合新人先看懂「Feature 长什么样」。

<!-- END:MANUAL:FEATURE_FOLDER_README -->
