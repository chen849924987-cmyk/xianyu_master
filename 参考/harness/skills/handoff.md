---
name: handoff
description: >
  Session 收尾。用户触发词：「结束」「收工」「交接」「handoff」「保存进度」「今天到这」「完成了」（短句收尾词会触发 hook，但本 SOP负责先收敛上下文）。
---

# Handoff — Session 收尾

> **设计**：**脚本落盘**（`HANDOFF.json` 含 `git_digest_markdown`、`AGENT_TASK_PROTOCOL.md` 可选人工更新 / 可选 `git commit`）由 **`npm run harness:end`** 或 **收尾关键词 + hook** 执行；本 skill 负责 **分析与并行 Gather**，避免漏总结。

## Fast Path（默认）

### 性能约束

- **目标**：≤ **4 次「助手轮次」里的工具调用批次**（尽量 **并行**）。
- **禁止**：为了「认真」而顺序 Read 十几个无关文件。

### Step 1 — Gather（**1 条消息，并行**）

| # | 动作 | 目的 |
|---|------|------|
| 1 | Shell：`git log -5 --oneline` + `git status -sb` + `git diff --stat` | 现状与变更体量 |
| 2 | Read `HANDOFF.json` | 合并前核对已有 `last_agent_turn` |
| 3 | Read `AGENT_TASK_PROTOCOL.md`（可选并行 `AGENT_TODOLIST.md`） | 意图 / 下一步 |

### Step 2 — Analyze（**0 工具**）

写 **≤15 行**：

- **Session summary**：做了什么 / 未完成什么
- **blocked_on**（若有）
- **next_3_steps**（下一会话第一件事要可验证）
- **Gap**（计划 vs 实际：DONE / PARTIAL / SKIPPED）
- **Session Wisdom**（可选）：仅当有可复用决策或踩坑才写一条；否则跳过（避免污染日志）

### Step 3 — 确定性落盘（必须）

收尾脚本会 **自动覆盖 `AGENT_TASK_PROTOCOL.md` 中「最后一次收尾」锚点区**（摘要 + git digest 摘录）。**「当前功能 / 已完成 / 下一步 / 阻塞 / 备注」**：可在 Step 2 后 **手动 Edit**；或在任意助手回复文末输出 **`<agent_protocol_intent>`** JSON 块（由 **`afterAgentResponse`** hook 写入意图锚点，见 **`harness/README.md`**）。**每次 git commit** 会在「提交记录」区追加一行，并在「提交改动明细（commit session）」区追加 **`git show`** 摘要（默认含 `--stat`，可选 patch），见 **`harness/git/run-post-commit.mjs`**。

**`<agent_protocol_intent>` 示例（放在回复最后即可，用户可见）**：

```xml
<agent_protocol_intent>
{"active_feature":"…","completed_steps":["…"],"next_steps":["…"],"blocked_on":"…","recent_notes":"…"}
</agent_protocol_intent>
```

支持别名：`current_feature`、`completed`、`next`、`blocked`、`notes`；列表项为字符串数组。

### 用户口令（聊天框，类似「commit」）

发送一条 **以口令开头** 的消息（完整列表见仓库 **`harness/lib/protocol-intent-user-prompt.mjs`**），例如 **`更新协议`**、`同步任务协议`、`/protocol`，后面跟结构化内容即可触发 **`beforeSubmitPrompt`** 写意图区（无需再走一轮 Agent）。

**自然语言标签示例：**

```text
更新协议
当前功能：抖店 harness
已完成：接通 post-commit，写过 README
下一步：自测一轮 git commit
阻塞：
备注：随便记一句
```

**JSON 示例：**

```text
/protocol {"active_feature":"x","completed_steps":["a"],"next_steps":["b"],"blocked_on":"","recent_notes":"-"}
```

**二选一（优先 CLI，便于 CI/终端一致）**：

```bash
npm run harness:end
```

完整收尾（**tier=full**，写入 `HANDOFF.handoff_tier` 与 `git_digest_markdown`）：

```bash
npm run harness:end:full
```

或在聊天框发送**短收尾词**（如 `完成`）触发 hook（见 `harness/hooks/prompt-session-end.mjs`）。

> 若启用 **`HARNESS_REQUIRE_VERIFY=1`** 且证据无效：CLI 会失败；聊天收尾可能被 **`continue: false`** 拦截——应先跑 `npm run build` 生成有效 `.data/harness-verify.json`。

### Step 4 — Report

输出 Step 2 的摘要 + 一句「已执行 `harness:end` / 已发收尾词」。

---

## Full Path（显式）

在用户说 **「完整交接」「phase 收尾」「handoff full」** 或运行 **`npm run harness:end:full`** 时启用。

在 **Fast** 之外追加（**条件执行**，无则跳过）：

| 标签 | 动作 |
|------|------|
| A | 阅读 `HANDOFF.git_digest_markdown` + 最近 `git log`，提炼一条「跨 session 约束」写入回复（可选） |
| B | 扫描 diff 是否含 **敏感信息**（token、密码）；若有，提醒脱敏再提交 |
| C | 若 `README.md` / `harness/README.md` 与本次改动明显不一致，列一条 **文档债**（可选 issue 式一行） |
| D | 大型重构：建议用户本地再跑 **`npm run build`**（若未启用自动验证） |

**不做**（当前仓库无基础设施）：向量 flush、自动 codebase-index、30 天 archive —— 若你需要，可另开脚本再挂到 `harness/git/`。

---

## 与 harness 五层的对应

| 层 | 本 skill 中的体现 |
|----|-------------------|
| 边界 | 遵守验证门禁；危险命令由 hook 拦 |
| 记忆 | Full 时多读 `HANDOFF.git_digest_markdown` + git log；长期 RAG 勿索引任务协议/runtime |
| 交接 | **必须**调用 `harness:end` 或收尾词 |
| 认知 | 挫败切换由 `HARNESS_AUTO_MODE_SWITCH` + `stop` hook |
| 技能 | 本文件即 SOP |
