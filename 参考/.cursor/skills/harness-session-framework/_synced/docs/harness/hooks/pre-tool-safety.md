# pre-tool-safety.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/pre-tool-safety.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

Agent 调用 Shell 工具前做与终端一致的安全审计

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `preToolUse` | `Shell` | 30 |

## 源码路径

仓库内：[`harness/hooks/pre-tool-safety.mjs`](../../../harness/hooks/pre-tool-safety.mjs)

## 文件头注释（摘录）

```text
preToolUse：对 Shell 类工具做与 beforeShellExecution 一致的安全审计
stdin: { tool_name / toolName, tool_input / toolInput, ... }
```

