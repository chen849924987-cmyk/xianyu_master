# after-file-readme-features.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/after-file-readme-features.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

保存 feature 注册或模块后刷新根 README 功能表（可 HARNESS_SKIP_README_FEATURES_SYNC）

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `afterFileEdit` | `Write` | 60 |

## 源码路径

仓库内：[`harness/hooks/after-file-readme-features.mjs`](../../../harness/hooks/after-file-readme-features.mjs)

## 文件头注释（摘录）

```text
afterFileEdit：保存 src/features 注册表或任一 feature 模块后，自动刷新 README.md 中的功能列表区块。
禁用：HARNESS_SKIP_README_FEATURES_SYNC=1

stdin: { file_path, edits? }
```

