# Agent Harness（会话交接与确定性边界）

本目录存放 **Cursor Agent 交接、hook、CLI**；业务代码在 `src/` 等目录。

## 仓库环境配置（统一生效）

| 文件 | 说明 |
|------|------|
| **`harness/harness.env`** | 团队默认 `HARNESS_*`（可提交）。仅当某变量在进程里**尚未设置**时才注入，系统 / Cursor 全局环境仍优先。 |
| **`harness/harness.local.env`** | 个人覆盖（**gitignore**）；与上格式相同，键会覆盖 `harness.env` 中的默认值（仍不覆盖已设置的 `process.env`）。 |

加载方式：**Cursor hooks** 使用 `node --import ./harness/lib/load-harness-env.mjs ...`（见 `.cursor/hooks.json`）；**`npm run harness:end`** 与 **`post-commit`** 经 **`import "../lib/load-harness-env.mjs"`** 加载。

修改 **`HARNESS_SKIP_PROTOCOL_SYNC`**、**`HARNESS_SKIP_PROTOCOL_INTENT_SYNC`**、**`HARNESS_SKIP_PROTOCOL_USER_INTENT`**、**`HARNESS_SKIP_COMMIT_PROTOCOL_LOG`**、**`HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL`**、**`HARNESS_COMMIT_PROTOCOL_PATCH`**、**`HARNESS_SKIP_TODOLIST_AUTO_ADD`**、**`HARNESS_SKIP_FEATURE_MCP_DOC_SYNC`**（禁用「改 Feature 源码后刷新 **`tests/mcp/features/*.md`** 与 **`src/features/*/README.md`** 的 AUTO 区块」）、**`HARNESS_HOOK_USAGE_*`** 等：编辑 **`harness/harness.env`**（或本地 **`harness/harness.local.env`**）即可。

## 双轨交接（最小方案）

| 轨道 | 文件 | 含义 |
|------|------|------|
| **意图（人类协议）** | 根目录 **`AGENT_TASK_PROTOCOL.md`** | **`harness:intent` 锚点**：用户 **`更新协议`** / **`/protocol`** 等口令（**`beforeSubmitPrompt`**）或助手 **`<agent_protocol_intent>`**（**`afterAgentResponse`**）自动写入；关闭分别见 **`HARNESS_SKIP_PROTOCOL_USER_INTENT`** / **`HARNESS_SKIP_PROTOCOL_INTENT_SYNC`**。亦可手工 Edit。**「最后一次收尾」** / **「提交记录」** / **「提交改动明细（commit session）」** 仍由收尾脚本与 post-commit 维护。 |
| **现场（机器测量）** | **`.data/harness-runtime.json`** | 工具成功/失败轨迹、`tool_failure_total`；由 **`postToolUse` / `postToolUseFailure`** hooks **自动追加**，gitignore。 |
| **机读摘要** | **`HANDOFF.json`** | 收尾时的结构化交接；含 **`git_digest_markdown`**（原 SESSION_LOG 中的 git 摘要迁入此字段）、可选 **`last_agent_turn`**（`stop` hook）。 |

**「最后一次收尾」何时写入：** 仅在 **`beforeSubmitPrompt` 命中收尾词** 或 **`npm run harness:end`** 时更新；**`stop` hook 不写该节**。**意图锚点（上半部分）**：  
1. **用户口令**（与「commit」同类）：在聊天框发送以 **`更新协议`** / **`同步任务协议`** / **`/protocol`** 等开头的短提示（列表见 **`harness/lib/protocol-intent-user-prompt.mjs`**），后跟 **JSON**、**`<agent_protocol_intent>`** 块，或 **`当前功能：` / `下一步：`** 等中文标签自然语言 — **`beforeSubmitPrompt`** 解析并写入（**`HARNESS_SKIP_PROTOCOL_USER_INTENT=1`** 禁用）。  
2. **助手文末块**：**`<agent_protocol_intent>`** JSON 由 **`afterAgentResponse`** 写入（**`HARNESS_SKIP_PROTOCOL_INTENT_SYNC`**）。  

若 Cursor 未传 **`workspace_roots`**，hooks 用 **`git rev-parse --show-toplevel`**（基于 **`cwd`**）解析仓库根（**`resolveHarnessRepoRoot`**）。

已 **废弃** 维护 **`AGENT_SESSION_LOG.md`**、**`AGENT_UPDATE_LOG.md`**（不再写入；历史叙事依赖 **git log** + **`HANDOFF.git_digest_markdown`**）。

### MCP 实录记录（与 harness-runtime 区分）

- **`postToolUse` → `.data/harness-runtime.json`** 只记工具调用轨迹（名称、耗时等），**不能代替**「在页面上验证了什么」的文字结论。
- 使用 **浏览器类 MCP**（含 **`user-playwright` / Playwright MCP**）做实录且形成结论时：按 **`docs/script/mcp-session-record.md`** 往 **`.data/mcp-session-records/`** 写一条摘要；Feature 步骤见 **`tests/mcp/features/`**；纪律见 **`.cursor/rules/local-mcp-validation.mdc`** 中的「MCP 实录后记录」。

### 向量 / RAG 边界（防污染）

**禁止** 将以下内容写入语义索引：`AGENT_TASK_PROTOCOL.md`、**`.data/harness-runtime.json`**、**`.data/harness-cognitive.json`**。  
**可** 作为长期记忆语料：`HANDOFF.json` 的历史版本、git 提交说明、业务文档等（按需）。

## Skill 层（markdown SOP）

见 **`harness/skills/`**；`.cursor/rules/harness-skills.mdc` 提示 Agent 读取。

- **`npm run harness:end`** — `handoff_tier: fast`
- **`npm run harness:end:full`** 或 **`HARNESS_HANDOFF_FULL=1`** — `handoff_tier: full`

## 目录结构

| 路径 | 作用 |
|------|------|
| **`harness/harness.env`** / **`lib/load-harness-env.mjs`** | 仓库级 `HARNESS_*` 默认值。 |
| **`hooks/prompt-session-end.mjs`** | **`beforeSubmitPrompt`**：收尾词 → …；**「更新协议」类口令** → 刷新 **`AGENT_TASK_PROTOCOL.md`** 意图锚点；**`generation_id` 防抖**。 |
| **`hooks/session-start-context.mjs`** | **`sessionStart`**：注入 **HANDOFF + 任务协议 Markdown + runtime 摘录**。 |
| **`hooks/after-agent-response.mjs`** | 缓存助手回复；可选解析 **`<agent_protocol_intent>`** → 刷新协议 **意图锚点**。 |
| **`hooks/agent-stop.mjs`** | **`stop`**：合并 **`HANDOFF.last_agent_turn`**；可选提交 handoff；可选 **`followup_message`**（认知切换或代码评审）。 |
| **`hooks/post-tool-runtime.mjs`** | **`postToolUse`**：追加工具成功轨迹。 |
| **`hooks/post-tool-failure-runtime.mjs`** | **`postToolUseFailure`**：失败计数 + 事件。 |
| **`hooks/before-shell-safety.mjs`** / **`pre-tool-safety.mjs`** | Shell 安全审计。 |
| **`hooks/after-file-verify.mjs`** | 可选编辑后验证（`HARNESS_AFTER_EDIT_VERIFY`）。 |
| **`hooks/after-file-sync-harness-skill.mjs`** | 保存 **`docs/`** / **`harness/`** 后刷新 Cursor Skill 镜像 **`_synced/`**（**`HARNESS_SKIP_CURSOR_SKILL_SYNC`**）。 |
| **`hooks/after-file-sync-hook-docs.mjs`** | 保存 **`harness/hooks/*.mjs`**、**`.cursor/hooks.json`**、**`hook-script-descriptions.json`** 后生成 **`docs/harness/hooks/*.md`**（**`HARNESS_SKIP_HOOK_DOC_SYNC`**）。 |
| **`skills/`** | `start.md`、`commit.md`、`handoff.md`。 |
| **`cli/end-session.mjs`** | `npm run harness:end` / `--full`。 |
| **`lib/`** | `run-hook.mjs`（包装各 hook 并记次数）、`hook-usage-tracker.mjs`、`session-end-core.mjs`、`stop-code-review-followup.mjs`、`todolist-auto-add.mjs`、`protocol-sync.mjs`、`protocol-intent-from-response.mjs`、`protocol-intent-user-prompt.mjs`、`agent-protocol-md.mjs`、`runtime-state.mjs`、`verify-evidence.mjs`、`cognitive-modes.mjs`、`workspace-root.mjs`、`debounce.mjs`、`shell-safety.mjs`、`git-utils.mjs`。 |
| **`git/run-post-commit.mjs`** | 每次提交向 **`AGENT_TASK_PROTOCOL.md`** 追加单行提交记录 + **提交改动明细（commit session，`git show`）**；**`HANDOFF.json`** / 协议若仍有未提交改动则 **`chore: sync handoff files`**。 |
| **`git/check-commit-msg-stop-hook.mjs`** + **`.githooks/commit-msg`** | 拦截 **`chore: agent turn handoff (stop hook)`** 且暂存区**仅有** `HANDOFF.json` / `AGENT_TASK_PROTOCOL.md`、且 diff **合计 churn（插入+删除）≤ `HARNESS_STOP_HOOK_COMMIT_MAX_CHURN`（默认 120）** 的提交，避免 stop hook 每轮 Agent 结束都打一条噪声提交。放行：任意其它路径一并暂存、或 churn 超阈值、或 **`HARNESS_ALLOW_STOP_HOOK_COMMIT=1`**。需已执行 **`npm run setup:hooks`**（`core.hooksPath=.githooks`）。 |
| **`git/append-commit-protocol-log.mjs`** | 由 post-commit 调用：写入当前 HEAD 的一行摘要 + **明细区 `git show`（默认 `--stat`，可选 patch）**。 |
| **`lib/sync-cursor-harness-skill.mjs`** | 把 **`docs/`**、**`harness/`** 镜像到 **`.cursor/skills/harness-session-framework/_synced/`**；命令 **`npm run sync:harness-skill`**；保存 `docs/`、`harness/` 下文件时可由 **`hooks/after-file-sync-harness-skill.mjs`** 触发（**`HARNESS_SKIP_CURSOR_SKILL_SYNC`** 关闭）。 |
| **`lib/sync-hook-docs.mjs`** | 为 **`harness/hooks/*.mjs`** 生成 **`docs/harness/hooks/*.md`** 索引；命令 **`npm run sync:hook-docs`**；见 **`hooks/after-file-sync-hook-docs.mjs`**。 |

### Git：拦截 trivial stop-hook 提交

**原因：** **`hooks/agent-stop.mjs`** 在每轮 Agent 结束时会合并 **`HANDOFF.last_agent_turn`** 并调用 **`commitHandoffArtifacts`**；只要 `HANDOFF.json` 有变更就会 `git commit`。防抖（**`HARNESS_AGENT_STOP_DEBOUNCE_MS`**，默认 12s）只在「指纹相同」时跳过，而指纹含助手回复摘要等，多数轮次仍会落库提交。

**对策：** 本仓库提供 **`commit-msg`** 钩子（见上表）。被拒绝时工作区仍保留已修改的 `HANDOFF.json`，可稍后随真实改动一并提交，或临时 **`HARNESS_ALLOW_STOP_HOOK_COMMIT=1`** 再提交。

## 根目录产物

| 文件 | 说明 |
|------|------|
| `HANDOFF.json` | 机读交接；`handoff_tier`、`git_digest_markdown`、`last_verification`（若启用验证）等。 |
| `AGENT_TASK_PROTOCOL.md` | 任务协议（热状态，勿进 RAG）；含自动提交记录、**提交改动明细（commit session）**与收尾摘要锚点。 |
| `AGENT_TODOLIST.md` | 可选；收尾词中带 `1.1` 等可勾选；**表中无该行时自动插入**（章五及以上会先建 `## N、扩展任务`）。 |
| `.data/session-log-anchor` | 本地 HEAD 锚点（gitignore）。 |
| `.data/harness-runtime.json` | 运行时轨迹（gitignore）。 |
| `.data/harness-verify.json` | 验证证据（gitignore）。 |

## 依赖与环境

- **Node.js** ≥ 20，**Git** 在 PATH；脚本 **LF**（`.gitattributes`）。

## 一次性配置

```bash
npm run setup:hooks
```

## 工作流程摘要

1. **收尾**：短收尾词或 **`npm run harness:end`** → 写 **`HANDOFF`**（含 git 摘要 markdown）、可选 commit → **`chore: handoff (cursor hook)`** 同步提交 HANDOFF/协议。
2. **`stop`**：轻量更新 **`last_agent_turn`**，不更新 session 锚点。
3. **post-commit**：向 **`AGENT_TASK_PROTOCOL.md`** 追加本次 commit **一行记录** + **`git show` 改动明细块**（可选完整 patch）；若 **HANDOFF / 协议** 仍有工作区改动则再 **`chore: sync handoff files`**（内部提交带 **`SKIP_PROTOCOL_COMMIT_LOG`**，单行与明细均跳过，避免无限追加）。
4. **开场**：`sessionStart` 注入 HANDOFF + 协议 + runtime 摘录。

### 验证门禁（可选）

见 **`HARNESS_REQUIRE_VERIFY`**、**`HARNESS_VERIFY_CMD`** 等（**`harness/lib/verify-evidence.mjs`**）。

### 认知层切换（可选）

**`HARNESS_AUTO_MODE_SWITCH`**（**`harness/lib/cognitive-modes.mjs`**）。

### Hooks 调用统计与 Markdown 报告（可选）

**`.cursor/hooks.json`** 中各 command hook 经 **`harness/lib/run-hook.mjs <事件名> <脚本路径>`** 包装：每次执行写入 **`.data/hook-usage.json`**（汇总 + 最近若干条明细），并按 **`HARNESS_HOOK_USAGE_MD`**（默认开）刷新 **`HARNESS_HOOK_USAGE_MD_PATH`**（默认 **`docs/hook-usage-report.md`**）。

- **`HARNESS_HOOK_USAGE_TRACK=0`**：关闭统计（包装器仍透传子进程，仅不写 JSON）。
- **`HARNESS_HOOK_USAGE_MD=0`**：只写 JSON，不生成 / 更新 Markdown。
- 报告含：**Cursor 事件名**、**脚本文件名**、**调用次数 / 失败次数 / 平均耗时**、**最近调用列表**。

### stop 后自动代码评审（可选）

启用 **`HARNESS_STOP_CODE_REVIEW=1`**（**`harness/harness.env`** 或环境变量）后，在 **`stop`** 事件完成 handoff 且工作区在指定路径上仍有 **`git diff HEAD`** 时，**`agent-stop.mjs`** 会向 Cursor 输出 **`followup_message`**，等价于自动追加一条用户消息，让**同一对话**再跑一轮去做评审并把结果写入 **`docs/agent-reviews/`**。

- **不是**再拉起第二个独立 Agent 进程；若要「另一个 Agent / 另一模型」或 CI 无人值守，请用 **Cursor SDK**（`@cursor/sdk`）脚本串两次 `Agent.prompt`。
- **与认知层互斥**：若本轮触发了挫败 **`followup_message`**，则不再发评审 followup。
- **去重**：对 **`HARNESS_STOP_CODE_REVIEW_PATHSPEC`**（默认含 `src`、`package.json`、`tsconfig.json`、`web` 等）内 diff 做哈希，同一 diff 不重复提示；状态在 **`.data/harness-stop-review-state.json`**（gitignore）。
- **`HARNESS_STOP_CODE_REVIEW_ON_STATUS`**：默认仅 **`completed`**；可改成逗号列表（如包含 **`error`**）。
- 若评审轮常被截断：调高 **`.cursor/hooks.json`** → **`stop`** → **`loop_limit`**。

## 调试

- Cursor：**查看 → 输出 → Hooks**。
- `npm run post-commit:run`

## 安全与隐私

- **`HANDOFF.json`** / commit message 可能含用户原话；请按需脱敏。

## 与业务代码的关系

Harness 只管会话边界与交接；抖店自动化在 **`src/`**。
