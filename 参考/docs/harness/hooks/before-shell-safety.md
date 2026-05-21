# before-shell-safety.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/before-shell-safety.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

执行 Shell 前审计命令风险（只读/网络/destructive），返回 allow/deny/ask

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `beforeShellExecution` | — | 30 |

## 源码路径

仓库内：[`harness/hooks/before-shell-safety.mjs`](../../../harness/hooks/before-shell-safety.mjs)

## 文件头注释（摘录）

```text
beforeShellExecution：Shell 命令安全策略（allow / deny / ask）
stdin: { command, cwd?, ... }
```

