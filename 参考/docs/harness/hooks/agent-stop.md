# agent-stop.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/agent-stop.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

本轮结束时写 HANDOFF.last_agent_turn；可选挫败切换或代码评审 followup_message

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `stop` | — | 120 |

## 源码路径

仓库内：[`harness/hooks/agent-stop.mjs`](../../../harness/hooks/agent-stop.mjs)

## 文件头注释（摘录）

```text
stop：Agent 一轮结束（用户未发收尾词）时追加轻量 SESSION_LOG + HANDOFF.last_agent_turn
stdin: { status, loop_count, workspace_roots?, cwd? }
stdout: {} 或 { followup_message }（认知层切换 / 可选代码评审，见 harness/README.md）
```

