# post-tool-failure-runtime.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/post-tool-failure-runtime.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

工具失败时累计失败计数并记录错误摘要

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `postToolUseFailure` | — | 15 |

## 源码路径

仓库内：[`harness/hooks/post-tool-failure-runtime.mjs`](../../../harness/hooks/post-tool-failure-runtime.mjs)

## 文件头注释（摘录）

```text
postToolUseFailure：累计失败与错误摘要
```

