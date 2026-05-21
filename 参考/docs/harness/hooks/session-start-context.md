# session-start-context.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/session-start-context.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

注入 HANDOFF.json、AGENT_TASK_PROTOCOL 摘录与 harness-runtime 轨迹供 Agent 开场上下文

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `sessionStart` | — | 30 |

## 源码路径

仓库内：[`harness/hooks/session-start-context.mjs`](../../../harness/hooks/session-start-context.mjs)

## 文件头注释（摘录）

```text
sessionStart: 注入 HANDOFF + 任务协议 YAML +（若存在）运行时轨迹 JSON
```

