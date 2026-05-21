# after-file-sync-feature-mcp-docs.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/after-file-sync-feature-mcp-docs.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

保存 src/features 后刷新 tests/mcp/features/*.md 与 src/features/*/README.md 的 AUTO 区块（HARNESS_SKIP_FEATURE_MCP_DOC_SYNC）

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `afterFileEdit` | `Write|StrReplace` | 90 |

## 源码路径

仓库内：[`harness/hooks/after-file-sync-feature-mcp-docs.mjs`](../../../harness/hooks/after-file-sync-feature-mcp-docs.mjs)

## 文件头注释（摘录）

```text
afterFileEdit：保存 src/features 下源码或注册表后，刷新
- tests/mcp/features/<id>.md 的 AUTO 区块
- src/features/<dir>/README.md 的 AUTO 区块（用户向流程说明的索引区）
禁用：HARNESS_SKIP_FEATURE_MCP_DOC_SYNC=1

stdin: { file_path, edits? }
```

