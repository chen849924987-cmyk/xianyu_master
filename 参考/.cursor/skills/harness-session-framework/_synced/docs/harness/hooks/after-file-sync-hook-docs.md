# after-file-sync-hook-docs.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/after-file-sync-hook-docs.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

保存 harness/hooks、hooks.json 或 hook 描述 JSON 后刷新 docs/harness/hooks/*.md（HARNESS_SKIP_HOOK_DOC_SYNC）

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `afterFileEdit` | `Write|StrReplace` | 60 |

## 源码路径

仓库内：[`harness/hooks/after-file-sync-hook-docs.mjs`](../../../harness/hooks/after-file-sync-hook-docs.mjs)

## 文件头注释（摘录）

```text
afterFileEdit：更新 harness hook 源码或注册表后，刷新 docs/harness/hooks/*.md
禁用：HARNESS_SKIP_HOOK_DOC_SYNC=1

stdin: { file_path, edits? }
```

