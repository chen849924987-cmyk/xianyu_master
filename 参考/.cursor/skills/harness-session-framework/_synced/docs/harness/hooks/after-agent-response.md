# after-agent-response.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/after-agent-response.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

缓存本轮助手全文；解析文末 <agent_protocol_intent> 同步协议意图区

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `afterAgentResponse` | — | 30 |

## 源码路径

仓库内：[`harness/hooks/after-agent-response.mjs`](../../../harness/hooks/after-agent-response.mjs)

## 文件头注释（摘录）

```text
afterAgentResponse：缓存本轮助手回复；若文末含 <agent_protocol_intent> JSON 则刷新 AGENT_TASK_PROTOCOL.md 意图区
stdin: { text, workspace_roots?, cwd? }
stdout: 无必需字段；输出空对象即可
```

