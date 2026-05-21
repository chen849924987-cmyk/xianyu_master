# Skill 层（SOP）

Cursor 没有 Claude Code 的 `/slash` 内置命令；这里的 **skill = 一份 markdown SOP**。当用户说出意图（或打出 `/handoff` 等助记词）时，Agent **打开对应文件并按步骤执行**，最后调用 **脚本/hooks** 做确定性落盘。

| 文件 | 用途 | 用户触发示例 |
|------|------|----------------|
| [`start.md`](start.md) | 新会话开场 briefing | 「开场」「/start」「接上昨天的活」 |
| [`commit.md`](commit.md) | 提交前验证与 message | 「提交」「/commit」「我要 commit」 |
| [`handoff.md`](handoff.md) | Session 收尾（Fast / Full） | 「收工」「交接」「/handoff」「今天到这」 |

与代码的关系：**边界/交接/验证** 已由 `harness/hooks/` 与 `npm run harness:end` 实现；**双轨**为 **`AGENT_TASK_PROTOCOL.md`（意图）** + **`.data/harness-runtime.json`（现场）** + **`HANDOFF.json`（机读摘要）**。skill 把意图收敛成 **并行 Read + 一条 CLI/收尾词**。
