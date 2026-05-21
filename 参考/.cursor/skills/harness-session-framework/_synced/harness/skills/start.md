---
name: start
description: >
  新 Composer / Agent 会话开场。用户触发词示例：「开场」「/start」「接上HANDOFF」「继续上次」。
---

# Start — 新 Session 开场（Fast）

> **目标**：用 ≤ **3 轮**（尽量 **1 条用户消息里并行多个 Read**）拼出 briefing，不要全文朗读 `HANDOFF.json`。

## Step 1 — Gather（**1 条助手消息，工具并行**）

同时发起：

| # | 动作 | 目的 |
|---|------|------|
| 1 | Read `HANDOFF.json` | 机读交接、`last_agent_turn`、`last_verification`（若有） |
| 2 | Read `AGENT_TASK_PROTOCOL.md` | 当前意图（用户也可用 **`更新协议`** / **`/protocol`** 等口令直接刷新，见 **`handoff.md`**） |
| 3 | （若存在）Read `.data/harness-runtime.json` | 工具轨迹与失败计数（gitignore；无则跳过） |
| 4 | Shell：`git status -sb` + `git log -5 --oneline` | 当前分支与最近提交 |
| 5 | （可选）Read `AGENT_TODOLIST.md` 若存在 | 未勾选任务 |

## Step 2 — Analyze（**纯推理，0 工具**）

整理 **≤12 行** briefing：

- **当前目标**（一句）
- **上次结论 / 阻塞**（如有）
- **验证状态**：若启用了 `HARNESS_REQUIRE_VERIFY`，说明最近一次 `.data/harness-verify.json` 是否在时效内（不要编造，没有就说未启用或未跑）
- **下一步 3 条**（可执行、可验证）

## Step 3 — Report

输出 briefing；若信息不足，**只问 1 个**澄清问题。

## 可选

若另有 `AGENT_BRIEF.md`，在 Step 1 **并行 Read** 末尾 **100 行**。
