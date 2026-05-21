---
name: commit
description: >
  提交前动作链。用户触发词：「提交」「/commit」「git commit」「收尾前先提交」。
---

# Commit — 提交前验证（Fast）

> **原则**：不让模型自证「跑过检查」。能跑脚本就用 **`npm run build`**（或团队约定命令）产生 **exit 0**；若启用 **`HARNESS_REQUIRE_VERIFY=1`**，还需 **`.data/harness-verify.json`** 与当前工作区签名一致且在时效内（见 `harness/README.md`）。

## Step 1 — Gather（可并行）

| # | 动作 |
|---|------|
| 1 | Shell：`git status -sb` + `git diff --stat` |
| 2 | （若改动了 `src/` 或 `tsconfig`）Shell：`npm run build` |

构建失败：**不要** `git commit`；修到绿或请用户确认跳过范围。

## Step 2 — Message

- **subject**：`feat:` / `fix:` / `chore:` + 简短英文或中文主题（与仓库近期 commit 风格一致）
- **body**（可选）：要点列表；**不要**贴密钥或客户隐私

## Step 3 — Commit

```bash
git add -A   # 或按文件精选
git commit -m "subject" -m "body..."
```

> **说明**：本仓库不再维护 `AGENT_UPDATE_LOG.md`；提交记录以 **git log** 为准。**post-commit** 还会在 **`AGENT_TASK_PROTOCOL.md`** 的「提交记录」追加一行，并在「提交改动明细（commit session）」追加 **`git show`**（默认 `--stat`）；需要全文 diff 时提交前设置 **`HARNESS_COMMIT_PROTOCOL_PATCH=1`**（见 **`harness/harness.env`**）。

## Full（可选）

大量改动或发版前：加跑 **`npm test`**（若项目有）、或 Playwright 约定测试；仍遵守 **`HARNESS_REQUIRE_VERIFY`** 门禁。
