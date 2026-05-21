# after-file-sync-harness-skill.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/after-file-sync-harness-skill.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

保存 docs/、harness/ 后镜像到 .cursor/skills/harness-session-framework/_synced（可 HARNESS_SKIP_CURSOR_SKILL_SYNC）

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `afterFileEdit` | `Write|StrReplace` | 120 |

## 源码路径

仓库内：[`harness/hooks/after-file-sync-harness-skill.mjs`](../../../harness/hooks/after-file-sync-harness-skill.mjs)

## 文件头注释（摘录）

```text
afterFileEdit：保存 docs/ 或 harness/ 下文件后，把镜像同步到 Cursor Skill（_synced/）。
禁用：HARNESS_SKIP_CURSOR_SKILL_SYNC=1

stdin: { file_path, edits? }
```

