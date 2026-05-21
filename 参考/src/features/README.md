# Feature 模块（`src/features/`）

每个 **已在 CLI 注册的 Feature** 独占一个子目录，并实现 **`FeatureModule`**（见 **`types.ts`**）。注册顺序与列表见 **`index.ts`**。

## 文档放哪？

| 读者 | 路径 | 说明 |
|------|------|------|
| **用户 / 读代码的人** | **`src/features/<目录>/README.md`** | 白话讲「干什么、代码大致怎么走」；上半「源码索引」随保存自动更新，下半可自行润色。 |
| **AI / MCP 实测** | **`tests/mcp/features/<feature-id>.md`** | 步骤清单与断言线索。 |

改源码并保存后，Cursor **`afterFileEdit`** hook 会刷新上述 **`README.md`** 与 MCP 文档里的 **AUTO** 区块；也可手动执行 **`npm run sync:feature-docs`**。

新增 Feature 时：除实现代码并在 **`index.ts`** 注册外，还须更新 **`tests/mcp/contracts/features-mcp-registry.ts`**（与 **`npm run test`** 离线校验一致）。
