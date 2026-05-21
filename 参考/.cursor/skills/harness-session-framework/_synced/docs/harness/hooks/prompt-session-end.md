# prompt-session-end.mjs

> **自动生成**：由 `harness/lib/sync-hook-docs.mjs` 写入；请勿手工改本节以上正文。更新 **`harness/hooks/prompt-session-end.mjs`**、**`.cursor/hooks.json`** 或 **`harness/lib/hook-script-descriptions.json`** 后保存对应文件会触发 `after-file-sync-hook-docs` 刷新本页。

## 摘要

收尾关键词触发会话收尾与可选 git 提交；解析「更新协议」类口令写 AGENT_TASK_PROTOCOL；记录认知信号

## Cursor 注册（`.cursor/hooks.json`）

| Cursor 事件 | matcher | timeout（秒） |
|-------------|---------|----------------|
| `beforeSubmitPrompt` | — | 120 |

## 源码路径

仓库内：[`harness/hooks/prompt-session-end.mjs`](../../../harness/hooks/prompt-session-end.mjs)

## 文件头注释（摘录）

```text
beforeSubmitPrompt：收尾用语时 git 提交、AGENT_*、HANDOFF 等
stdin: Cursor JSON（prompt、workspace_roots、conversation_id、generation_id、cwd 等）
stdout: { "continue": true }
```

