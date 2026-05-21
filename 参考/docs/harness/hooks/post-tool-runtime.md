# post-tool-runtime.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/post-tool-runtime.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

工具成功后向 .data/harness-runtime.json 追加一条成功轨迹

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `postToolUse` | — | 15 |

## 源码路径

仓库内：[`harness/hooks/post-tool-runtime.mjs`](../../../harness/hooks/post-tool-runtime.mjs)

## 文件头注释（摘录）

```text
postToolUse：追加运行时轨迹（不外泄大块 tool_output）
```

