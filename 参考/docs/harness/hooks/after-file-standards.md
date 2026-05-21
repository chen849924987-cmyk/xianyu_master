# after-file-standards.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/after-file-standards.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

afterFileEdit：按路径提示对应 docs 代码规范片段（stdout reminder）

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `afterFileEdit` | `Write|StrReplace` | 60 |

## 源码路径

仓库内：[`harness/hooks/after-file-standards.mjs`](../../../harness/hooks/after-file-standards.mjs)

## 文件头注释（摘录）

```text
afterFileEdit：AI 修改代码时，提醒遵循对应模块的代码规范
stdin: { file_path, edits? }
stdout: { reminder?: string, standards_files?: string[] }
```

