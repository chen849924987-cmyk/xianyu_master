# after-file-verify.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/after-file-verify.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

保存后可选跑验证命令并写入 .data/harness-verify.json（HARNESS_AFTER_EDIT_VERIFY=1）

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `afterFileEdit` | `Write` | 300 |

## 源码路径

仓库内：[`harness/hooks/after-file-verify.mjs`](../../../harness/hooks/after-file-verify.mjs)

## 文件头注释（摘录）

```text
afterFileEdit：对命中路径的源码保存后运行验证命令，成功则写入 .data/harness-verify.json
需 HARNESS_AFTER_EDIT_VERIFY=1（默认关闭，避免每次保存全量 build）
stdin: { file_path, edits? }
```

