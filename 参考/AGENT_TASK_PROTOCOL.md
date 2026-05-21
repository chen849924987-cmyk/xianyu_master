# 任务协议（人类可读 · 热状态）

> Agent 每 session 开场阅读本文；「意图」可由 **afterAgentResponse** hook 根据助手文末 `**<agent_protocol_intent>`** JSON 自动刷新。**切勿将此文件纳入语义/RAG 向量索引**。

与 **HANDOFF.json**、**.data/harness-runtime.json** 分工见 **harness/README.md**。

<!-- harness:intent:start -->

## 当前功能

抖店 Playwright CLI：登录态 `storageState`、`chain-smoke`、`session-verify`、`login`（根路径 → 工作台自检）、`dashboard`、`feige-workspace`（飞鸽工作台，对齐 **AGENT_TODOLIST** 三、3.1 打开会话站点）。

## 已完成

- CLI：`npm run dev -- --save-session`、`--feature=<id>`、`npm run smoke`
- `src/utils/doudian-session.ts`：工作台 / 飞鸽登录态断言复用
- `session-verify`、`login`：后台工作台路径校验；`feige-workspace`：`im.jinritemai.com` 飞鸽路径探测（Cookie 依赖保存会话时的域名覆盖）

## 下一步

- **晓风上货页面登录**：实现晓风 / 低价好物相关域（如 `xfdyorder.zzbtool.com` 等）的登录态检测、失败分支与可复用的 session 策略（与抖店 `storageState`、`--save-session` 流程衔接；落点优先 `src/features/xf-ali-find-low-goods` 或抽至 `src/utils` 供多 feature 复用）

## 备注

环境变量：`DOUDIAN_BASE_URL`、`DOUDIAN_IM_BASE_URL`、`STORAGE_STATE_PATH`、`PLAYWRIGHT_HEADED`。

<!-- harness:intent:end -->
---

## 提交记录（自动生成）

每条对应一次 **git commit**（按时间顺序追加）。禁用：`HARNESS_SKIP_COMMIT_PROTOCOL_LOG=1` 或内部同步提交。

- **2026-05-11T02:40:00+08:00** · `755a155` · docs: add coding standards and automatic reminder hook
- **2026-05-08T22:21:45+08:00** · `6ea8d01` · refactor(harness): task protocol as Markdown + commit log on post-commit
- **2026-05-08T22:30:05+08:00** · `aa6c1f9` · feat(harness): sync protocol intent from assistant reply and user phrases
- **2026-05-10T13:53:41+08:00** · `01d63fb` · feat: smoke and session-verify features, MCP login workflow rule
- **2026-05-10T15:07:27+08:00** · `da16676` · feat(harness): commit-detail sessions in AGENT_TASK_PROTOCOL

---

## 提交改动明细（自动生成 · commit session）

每次 **git commit** 后在下方追加一块 **可读改动会话**（默认：提交说明 + `**git show --stat`**）。需要 完整 unified diff 时：提交前设置 `**HARNESS_COMMIT_PROTOCOL_PATCH=1`**。仅关掉本节（保留上方单行提交记录）：`**HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL=1**`。

#### `da16676` · 2026-05-10 15:07:27 +0800 · feat(harness): commit-detail sessions in AGENT_TASK_PROTOCOL

*medium + stat*

---

## 最后一次收尾（自动生成）

由 **npm run harness:end** 或收尾关键词触发；禁用本节：`harness/harness.env` 中 `HARNESS_SKIP_PROTOCOL_SYNC=1`。

*尚无收尾记录。*

---

## 提交记录（自动生成）

每条对应一次 **git commit**（按时间顺序追加）。禁用：`HARNESS_SKIP_COMMIT_PROTOCOL_LOG=1` 或内部同步提交。



- **2026-05-10T21:37:16+08:00** · `bf18e9b` · feat: web console, API server, feige & xf features
- **2026-05-10T21:54:08+08:00** · `b9a2656` · feat(harness): optional stop-triggered code review followup
- **2026-05-10T22:06:55+08:00** · `8b8026c` · feat: hook usage tracking wrapper and dashboard charts
- **2026-05-10T23:58:36+08:00** · `8b4e182` · feat(web): Tailwind admin shell, shadcn UI, router pages
- **2026-05-11T01:20:17+08:00** · `859a2ef` · feat(harness,web): hook trigger summaries and provenance UI
- **2026-05-11T02:28:36+08:00** · `5274cdb` · feat(tests,login): Playwright E2E tests and password login module
- **2026-05-11T02:28:55+08:00** · `c5c7b9c` · feat(config,session,login): auto-login support and env loading fixes
- **2026-05-11T02:29:11+08:00** · `807aef2` · feat(cli,web): feature run history and admin UI improvements
- **2026-05-11T02:40:38+08:00** · `755a155` · docs: add coding standards and automatic reminder hook
- **2026-05-11T02:43:22+08:00** · `ef40f88` · docs: add human-readable summary to coding standards commit
- **2026-05-11T02:44:58+08:00** · `211edd3` · docs: remove CODING_STANDARDS.md in favor of split docs/
- **2026-05-11T10:19:13+08:00** · `730b22a` · docs: add harness-session-framework skill and evaluation documentation



---

## 提交改动明细（自动生成 · commit session）

每次 **git commit** 后在下方追加一块 **可读改动会话**（默认：`git show` 的提交说明 + **--stat**）。需要 **完整 unified diff** 时：提交前设置环境变量 `HARNESS_COMMIT_PROTOCOL_PATCH=1`。禁用本节（仍保留单行「提交记录」）：`HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL=1`。



#### `bf18e9b` · 2026-05-10 21:37:16 +0800 · feat: web console, API server, feige & xf features

*medium + stat*

---

#### `b9a2656` · 2026-05-10 21:54:08 +0800 · feat(harness): optional stop-triggered code review followup

*medium + stat*

---

#### `8b8026c` · 2026-05-10 22:06:55 +0800 · feat: hook usage tracking wrapper and dashboard charts

*medium + stat*

---

#### `8b4e182` · 2026-05-10 23:58:36 +0800 · feat(web): Tailwind admin shell, shadcn UI, router pages

*medium + stat*

---

#### `859a2ef` · 2026-05-11 01:20:17 +0800 · feat(harness,web): hook trigger summaries and provenance UI

*medium + stat*

---

#### `5274cdb` · 2026-05-11 02:28:36 +0800 · feat(tests,login): Playwright E2E tests and password login module

*medium + stat*

---

#### `c5c7b9c` · 2026-05-11 02:28:55 +0800 · feat(config,session,login): auto-login support and env loading fixes

*medium + stat*

---

#### `807aef2` · 2026-05-11 02:29:11 +0800 · feat(cli,web): feature run history and admin UI improvements

*medium + stat*

---

#### `755a155` · 2026-05-11 02:40:38 +0800 · docs: add coding standards and automatic reminder hook

*medium + stat*

*人类可读总结：*

**新增代码规范体系** - 共 42 个文件，3894 行内容

1. **根目录合订版** (`CODING_STANDARDS.md`) - 完整的代码规范文档，包含所有模块的规范
2. **细分规范目录** (`docs/`)：
  - `general/` - 通用规范（命名、导入、注释、提交等）
  - `script/` - Playwright 脚本规范（FeatureModule、选择器、日志等）
  - `backend/` - Express API 规范（响应格式、路由、SSE 等）
  - `frontend/` - React + Tailwind 规范（组件、样式、状态管理等）
  - `test/` - Playwright 测试规范（结构、断言、标签等）
3. **自动提醒机制**：
  - 新增 `after-file-standards.mjs` hook
  - AI 修改代码时自动提醒遵循对应模块规范
  - 显示关键规范文件位置

入口文档：`docs/CODING_GUIDE.md`

---

#### `ef40f88` · 2026-05-11 02:43:22 +0800 · docs: add human-readable summary to coding standards commit

*medium + stat*

---

#### `211edd3` · 2026-05-11 02:44:58 +0800 · docs: remove CODING_STANDARDS.md in favor of split docs/

*medium + stat*

---

#### `730b22a` · 2026-05-11 10:19:13 +0800 · docs: add harness-session-framework skill and evaluation documentation

*medium + stat*



---

## 最后一次收尾（自动生成）

由 **npm run harness:end** 或收尾关键词触发；禁用本节：`harness/harness.env` 中 `HARNESS_SKIP_PROTOCOL_SYNC=1`。



- **本地时间**：`2026-05-11 15:42`
- **handoff_tier**：`fast`
- **session_prompt**：`commit`
- **hook_note**：`已检测收尾关键词（tier=fast）。 已执行 git add -A 并提交。`
- **head_short**：`210dc91`
- **conversation_id**：`824f0834-1b0c-46e1-88ed-a0d27a33a295`

**git_digest_excerpt**

```text
#### `git status -sb`

```text
## main...origin/main [ahead 33]
```

*无本地锚点（首次在本机收尾，或已删除 .data/session-log-anchor）* **最近 15 条提交：**

```text
210dc91 chore: 会话收尾 2026-05-11 07:42
b5f3fd5 chore: agent turn handoff (stop hook)
a45780c chore: agent turn handoff (stop hook)
daaecbc chore: agent turn handoff (stop hook)
129931c chore: agent turn handoff (stop hook)
48c8a1d chore: agent turn handoff (stop hook)
d81108a chore: agent turn handoff (stop hook)
46a51c8 chore: agent turn handoff (stop hook)
c82613d chore: agent turn handoff (stop hook)
ff459db chore: agent turn handoff (stop hook)
7da201c chore: agent turn handoff (stop hook)
4ce03c9 chore: agent turn handoff (stop hook)
f1add62 chore: agent turn handoff (stop hook)
7c252cf chore: agent turn handoff (stop hook)
36bc05b chore: agent turn handoff (stop hook)
```

```

<!-- harness:auto:end -->
```

---

## 提交记录（自动生成）

每条对应一次 **git commit**（按时间顺序追加）。禁用：`HARNESS_SKIP_COMMIT_PROTOCOL_LOG=1` 或内部同步提交。

<!-- harness:commit-log:start -->





- **2026-05-12T00:18:57+08:00** · `4e22a91` · feat: MCP-first tests, feature README sync, xf and web UI updates
- **2026-05-12T00:41:00+08:00** · `dce6177` · feat: storage watch autosave and commit-msg gate for stop hook
- **2026-05-12T00:48:52+08:00** · `123afb8` · feat(harness,docs): skill mirror, hook markdown docs, and skill framework docs

<!-- harness:commit-log:end -->

---

## 提交改动明细（自动生成 · commit session）

每次 **git commit** 后在下方追加一块 **可读改动会话**（默认：`git show` 的提交说明 + **--stat**）。需要 **完整 unified diff** 时：提交前设置环境变量 `HARNESS_COMMIT_PROTOCOL_PATCH=1`。禁用本节（仍保留单行「提交记录」）：`HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL=1`。

<!-- harness:commit-detail:start -->





#### `4e22a91` · 2026-05-12 00:18:57 +0800 · feat: MCP-first tests, feature README sync, xf and web UI updates

_medium + stat_

~~~text
commit 4e22a91e478942401ffc4baf16cab4331c1596dd
Author: Cursor Hook <hook@local>
Date:   Tue May 12 00:18:57 2026 +0800

    feat: MCP-first tests, feature README sync, xf and web UI updates
    
    - Tests: remove Playwright specs; add verify-offline.ts and tests/mcp layout
    - Docs/hooks: sync-all-feature-docs, per-feature README under src/features/
    - Harness: feature-source-meta, MCP + folder readme presets, afterFileEdit hook
    - xf: ui-pipeline and expanded low-goods flow; page-fail snapshot helper
    - Web: feature progress components, API/types, FeatureDetailPage
    - Misc: playwright note, docs/test and README pointers, AGENT_TASK_PROTOCOL trim
    
    Co-authored-by: Cursor <cursoragent@cursor.com>

 .cursor/hooks.json                                 |   5 +
 .cursor/rules/local-mcp-validation.mdc             |  13 +
 .env.example                                       |   6 +-
 AGENT_TASK_PROTOCOL.md                             | 508 +-------------
 README.md                                          |   4 +-
 docs/CODING_GUIDE.md                               |   2 +-
 docs/frontend/README.md                            |   1 +
 docs/frontend/feature-progress-ui.md               | 111 ++++
 docs/script/README.md                              |   2 +
 docs/script/feature-module.md                      |   4 +
 docs/script/mcp-session-record.md                  |  67 ++
 docs/script/session.md                             |  14 +-
 docs/test/environment.md                           |  42 +-
 docs/test/import.md                                |   3 +-
 docs/test/naming.md                                |   9 +-
 docs/test/structure.md                             |  22 +-
 docs/test/tags.md                                  |  14 +-
 harness/README.md                                  |   7 +-
 harness/harness.env                                |   3 +
 harness/hooks/after-file-standards.mjs             |   2 +-
 harness/hooks/after-file-sync-feature-mcp-docs.mjs | 110 ++++
 harness/lib/feature-doc-manual-presets.mjs         |  80 +++
 harness/lib/feature-folder-readme-presets.mjs      |  91 +++
 harness/lib/feature-source-meta.mjs                |  74 +++
 harness/lib/sync-all-feature-docs.mjs              |  18 +
 harness/lib/sync-feature-folder-readme.mjs         | 176 +++++
 harness/lib/sync-feature-mcp-docs.mjs              | 247 +++++++
 harness/lib/sync-readme-features.mjs               |  17 +-
 package.json                                       |   4 +-
 playwright.config.ts                               |   1 +
 src/cli.ts                                         |  61 +-
 src/features/README.md                             |  14 +
 src/features/chain-smoke/README.md                 |  52 ++
 src/features/dashboard/README.md                   |  47 ++
 src/features/feige-workspace/README.md             |  47 ++
 src/features/login/README.md                       |  50 ++
 src/features/session-verify/README.md              |  48 ++
 src/features/xf-ali-find-low-goods/README.md       |  78 +++
 src/features/xf-ali-find-low-goods/index.ts        | 726 ++++++++++++++++++---
 src/features/xf-ali-find-low-goods/ui-pipeline.ts  |  83 +++
 src/server/main.ts                                 |  71 +-
 src/utils/browser.ts                               |  41 +-
 src/utils/doudian-session.ts                       |  16 +
 src/utils/edge-persistent.ts                       |  69 +-
 src/utils/index.ts                                 |   5 +
 src/utils/page-fail-snapshot.ts                    |  26 +
 tests/ARCHITECTURE.md                              | 236 ++-----
 tests/PLAYWRIGHT_RUN_LOG.md                        |   4 +-
 tests/README.md                                    |  59 +-
 tests/fixtures/storage-state-empty.json            |   4 +
 tests/mcp/README.md                                |  29 +
 tests/mcp/contracts/features-mcp-registry.ts       |  62 ++
 tests/mcp/contracts/xf-low-goods-mcp-contract.ts   |  28 +
 tests/mcp/features/chain-smoke.md                  |  61 ++
 tests/mcp/features/dashboard.md                    |  58 ++
 tests/mcp/features/feige-workspace.md              |  57 ++
 tests/mcp/features/login.md                        |  59 ++
 tests/mcp/features/session-verify.md               |  55 ++
 tests/mcp/features/xf-ali-find-low-goods.md        |  83 +++
 tests/mcp/protocols/offline-checks.md              |  31 +
 tests/mcp/scripts/verify-offline.ts                | 158 +++++
 tests/specs/README.md                              |   8 +
 tests/specs/e2e/login-password.e2e.spec.ts         |  94 ---
 tests/specs/unit/login-wall-url.spec.ts            |  28 -
 tests/specs/unit/password-login-config.spec.ts     |  36 -
 tests/support/spawn-password-login-configured.ts   |  12 +-
 ...205\245\351\227\250\346\214\207\345\215\227.md" | 117 +---
 web/src/api/client.ts                              |  33 +
 web/src/api/types.ts                               |   9 +
 web/src/components/features/XfLowGoodsProgress.tsx | 165 +++++
 web/src/lib/feature-routes.ts                      |   3 +
 web/src/lib/parse-job-steps.ts                     |  87 +++
 web/src/pages/FeatureDetailPage.tsx                | 180 ++++-
 web/tsconfig.json                                  |   3 +-
 web/vite.config.ts                                 |   1 +
 75 files changed, 3712 insertions(+), 1139 deletions(-)

~~~

---

#### `dce6177` · 2026-05-12 00:41:00 +0800 · feat: storage watch autosave and commit-msg gate for stop hook

_medium + stat_

~~~text
commit dce61771d56bf8239e45b9dfa476a5914ca0e4a8
Author: Cursor Hook <hook@local>
Date:   Tue May 12 00:41:00 2026 +0800

    feat: storage watch autosave and commit-msg gate for stop hook
    
    - Add --save-session=watch and storage-state-autosave (URL/title edge + optional FXG response envs).
    
    - login: write STORAGE_STATE_PATH after workbench verify when DOUDIAN_SAVE_SESSION_AFTER_LOGIN.
    
    - commit-msg hook blocks trivial stop-hook commits (HANDOFF-only, churn threshold); document HARNESS_* overrides.
    
    Co-authored-by: Cursor <cursoragent@cursor.com>

 .env.example                               |  10 +-
 .githooks/commit-msg                       |   6 ++
 README.md                                  |   7 +-
 docs/script/session.md                     |   1 +
 harness/README.md                          |   7 ++
 harness/git/check-commit-msg-stop-hook.mjs | 100 +++++++++++++++++
 harness/harness.env                        |   5 +
 harness/lib/session-end-core.mjs           |  11 +-
 src/cli.ts                                 |  47 +++++++-
 src/features/login/README.md               |   2 +-
 src/features/login/index.ts                |   7 +-
 src/utils/config.ts                        |   2 +-
 src/utils/doudian-session.ts               |  12 ++-
 src/utils/index.ts                         |   2 +
 src/utils/storage-state-autosave.ts        | 165 +++++++++++++++++++++++++++++
 15 files changed, 366 insertions(+), 18 deletions(-)

~~~

---

#### `123afb8` · 2026-05-12 00:48:52 +0800 · feat(harness,docs): skill mirror, hook markdown docs, and skill framework docs

_medium + stat_

~~~text
commit 123afb8b57cc6c93a3eee1e55eb662373e35ceb0
Author: Cursor Hook <hook@local>
Date:   Tue May 12 00:48:52 2026 +0800

    feat(harness,docs): skill mirror, hook markdown docs, and skill framework docs
    
    - sync:harness-skill + after-file-sync-harness-skill: mirror docs/ and harness/ into Cursor skill _synced/
    
    - sync:hook-docs + after-file-sync-hook-docs: generate docs/harness/hooks/*.md from hooks.json and hook-script-descriptions.json
    
    - Update harness-session-framework skill markdown (stop hook, commit-msg, env); README scripts and harness README table
    
    Co-authored-by: Cursor <cursoragent@cursor.com>

 .cursor/hooks.json                                 |  10 +
 .cursor/skills/harness-session-framework/SKILL.md  |  48 +-
 .../harness-session-framework/_synced/README.md    |   8 +
 .../_synced/docs/CODING_GUIDE.md                   | 126 ++++
 .../_synced/docs/agent-reviews/.gitkeep            |   0
 .../_synced/docs/backend/README.md                 |  14 +
 .../_synced/docs/backend/api-response.md           |  80 +++
 .../_synced/docs/backend/process.md                | 101 ++++
 .../_synced/docs/backend/routes.md                 |  64 +++
 .../_synced/docs/backend/sse.md                    |  91 +++
 .../_synced/docs/backend/static-spa.md             |  69 +++
 .../_synced/docs/backend/types.md                  |  72 +++
 .../_synced/docs/frontend/README.md                |  17 +
 .../_synced/docs/frontend/api-client.md            | 104 ++++
 .../_synced/docs/frontend/feature-progress-ui.md   | 111 ++++
 .../_synced/docs/frontend/imports.md               |  76 +++
 .../_synced/docs/frontend/layout.md                | 115 ++++
 .../_synced/docs/frontend/react-components.md      | 132 +++++
 .../_synced/docs/frontend/routing.md               | 102 ++++
 .../_synced/docs/frontend/state.md                 | 119 ++++
 .../_synced/docs/frontend/tailwind-css.md          |  91 +++
 .../_synced/docs/frontend/ui-components.md         | 133 +++++
 .../_synced/docs/general/README.md                 |  13 +
 .../_synced/docs/general/comments.md               |  80 +++
 .../_synced/docs/general/commits.md                |  77 +++
 .../_synced/docs/general/imports.md                |  72 +++
 .../_synced/docs/general/naming.md                 |  52 ++
 .../_synced/docs/general/typescript.md             |  67 +++
 .../_synced/docs/harness-evaluation.md             | 468 +++++++++++++++
 .../_synced/docs/harness/README.md                 |   4 +
 .../_synced/docs/harness/hooks/README.md           |  24 +
 .../docs/harness/hooks/after-agent-response.md     |  26 +
 .../harness/hooks/after-file-readme-features.md    |  27 +
 .../docs/harness/hooks/after-file-standards.md     |  26 +
 .../hooks/after-file-sync-feature-mcp-docs.md      |  29 +
 .../harness/hooks/after-file-sync-harness-skill.md |  27 +
 .../harness/hooks/after-file-sync-hook-docs.md     |  27 +
 .../docs/harness/hooks/after-file-verify.md        |  26 +
 .../_synced/docs/harness/hooks/agent-stop.md       |  26 +
 .../docs/harness/hooks/before-shell-safety.md      |  25 +
 .../harness/hooks/post-tool-failure-runtime.md     |  24 +
 .../docs/harness/hooks/post-tool-runtime.md        |  24 +
 .../_synced/docs/harness/hooks/pre-tool-safety.md  |  25 +
 .../docs/harness/hooks/prompt-session-end.md       |  26 +
 .../docs/harness/hooks/session-start-context.md    |  24 +
 .../_synced/docs/hook-usage-report.md              | 207 +++++++
 .../_synced/docs/script/README.md                  |  17 +
 .../_synced/docs/script/async-error.md             |  98 ++++
 .../_synced/docs/script/browser.md                 |  93 +++
 .../_synced/docs/script/config.md                  | 107 ++++
 .../_synced/docs/script/feature-module.md          |  81 +++
 .../_synced/docs/script/logging.md                 |  79 +++
 .../_synced/docs/script/mcp-session-record.md      |  67 +++
 .../_synced/docs/script/selectors.md               |  91 +++
 .../_synced/docs/script/session.md                 |  97 ++++
 .../_synced/docs/test/README.md                    |  18 +
 .../_synced/docs/test/assertions.md                | 102 ++++
 .../_synced/docs/test/config.md                    | 110 ++++
 .../_synced/docs/test/environment.md               |  79 +++
 .../_synced/docs/test/import.md                    |  77 +++
 .../_synced/docs/test/naming.md                    |  47 ++
 .../_synced/docs/test/structure.md                 | 117 ++++
 .../_synced/docs/test/tags.md                      |  78 +++
 .../_synced/harness/README.md                      | 144 +++++
 .../_synced/harness/cli/end-session.mjs            |  53 ++
 .../harness/git/append-commit-protocol-log.mjs     |  70 +++
 .../harness/git/check-commit-msg-stop-hook.mjs     | 100 ++++
 .../_synced/harness/git/run-post-commit.mjs        |  76 +++
 .../_synced/harness/harness.env                    |  73 +++
 .../_synced/harness/hooks/after-agent-response.mjs |  43 ++
 .../harness/hooks/after-file-readme-features.mjs   |  89 +++
 .../_synced/harness/hooks/after-file-standards.mjs | 168 ++++++
 .../hooks/after-file-sync-feature-mcp-docs.mjs     | 110 ++++
 .../hooks/after-file-sync-harness-skill.mjs        |  91 +++
 .../harness/hooks/after-file-sync-hook-docs.mjs    |  93 +++
 .../_synced/harness/hooks/after-file-verify.mjs    |  64 +++
 .../_synced/harness/hooks/agent-stop.mjs           |  70 +++
 .../_synced/harness/hooks/before-shell-safety.mjs  |  30 +
 .../harness/hooks/post-tool-failure-runtime.mjs    |  36 ++
 .../_synced/harness/hooks/post-tool-runtime.mjs    |  36 ++
 .../_synced/harness/hooks/pre-tool-safety.mjs      |  37 ++
 .../_synced/harness/hooks/prompt-session-end.mjs   |  81 +++
 .../harness/hooks/session-start-context.mjs        |  97 ++++
 .../_synced/harness/lib/agent-protocol-md.mjs      | 216 +++++++
 .../_synced/harness/lib/cognitive-modes.mjs        | 238 ++++++++
 .../_synced/harness/lib/debounce.mjs               |  82 +++
 .../harness/lib/feature-doc-manual-presets.mjs     |  80 +++
 .../harness/lib/feature-folder-readme-presets.mjs  |  91 +++
 .../_synced/harness/lib/feature-source-meta.mjs    |  74 +++
 .../_synced/harness/lib/git-utils.mjs              |  32 ++
 .../harness/lib/hook-script-descriptions.json      |  17 +
 .../_synced/harness/lib/hook-trigger-summary.mjs   | 432 ++++++++++++++
 .../_synced/harness/lib/hook-usage-tracker.mjs     | 239 ++++++++
 .../_synced/harness/lib/load-harness-env.mjs       |  51 ++
 .../harness/lib/protocol-intent-from-response.mjs  |  86 +++
 .../harness/lib/protocol-intent-user-prompt.mjs    | 181 ++++++
 .../_synced/harness/lib/protocol-sync.mjs          |  58 ++
 .../_synced/harness/lib/run-hook.mjs               |  79 +++
 .../_synced/harness/lib/runtime-state.mjs          |  99 ++++
 .../_synced/harness/lib/session-end-core.mjs       | 632 +++++++++++++++++++++
 .../_synced/harness/lib/shell-safety.mjs           |  74 +++
 .../harness/lib/stop-code-review-followup.mjs      | 100 ++++
 .../_synced/harness/lib/sync-all-feature-docs.mjs  |  18 +
 .../harness/lib/sync-cursor-harness-skill.mjs      |  79 +++
 .../harness/lib/sync-feature-folder-readme.mjs     | 176 ++++++
 .../_synced/harness/lib/sync-feature-mcp-docs.mjs  | 247 ++++++++
 .../_synced/harness/lib/sync-hook-docs.mjs         | 177 ++++++
 .../_synced/harness/lib/sync-readme-features.mjs   | 172 ++++++
 .../_synced/harness/lib/todolist-auto-add.mjs      | 143 +++++
 .../_synced/harness/lib/verify-evidence.mjs        | 221 +++++++
 .../_synced/harness/lib/workspace-root.mjs         |  63 ++
 .../_synced/harness/skills/README.md               |  11 +
 .../_synced/harness/skills/commit.md               |  36 ++
 .../_synced/harness/skills/handoff.md              | 118 ++++
 .../_synced/harness/skills/start.md                |  38 ++
 .../harness-session-framework/architecture.md      |   5 +
 .../skills/harness-session-framework/env-config.md |  17 +-
 .../skills/harness-session-framework/examples.md   |   5 +
 .cursor/skills/harness-session-framework/hooks.md  |  41 +-
 README.md                                          |   2 +-
 docs/harness/README.md                             |   4 +
 docs/harness/hooks/README.md                       |  24 +
 docs/harness/hooks/after-agent-response.md         |  26 +
 docs/harness/hooks/after-file-readme-features.md   |  27 +
 docs/harness/hooks/after-file-standards.md         |  26 +
 .../hooks/after-file-sync-feature-mcp-docs.md      |  29 +
 .../harness/hooks/after-file-sync-harness-skill.md |  27 +
 docs/harness/hooks/after-file-sync-hook-docs.md    |  27 +
 docs/harness/hooks/after-file-verify.md            |  26 +
 docs/harness/hooks/agent-stop.md                   |  26 +
 docs/harness/hooks/before-shell-safety.md          |  25 +
 docs/harness/hooks/post-tool-failure-runtime.md    |  24 +
 docs/harness/hooks/post-tool-runtime.md            |  24 +
 docs/harness/hooks/pre-tool-safety.md              |  25 +
 docs/harness/hooks/prompt-session-end.md           |  26 +
 docs/harness/hooks/session-start-context.md        |  24 +
 harness/README.md                                  |   7 +-
 harness/harness.env                                |   6 +
 harness/hooks/after-file-sync-harness-skill.mjs    |  91 +++
 harness/hooks/after-file-sync-hook-docs.mjs        |  93 +++
 harness/lib/hook-script-descriptions.json          |   4 +
 harness/lib/sync-cursor-harness-skill.mjs          |  79 +++
 harness/lib/sync-hook-docs.mjs                     | 177 ++++++
 package.json                                       |   2 +
 144 files changed, 11283 insertions(+), 24 deletions(-)

~~~


<!-- harness:commit-detail:end -->

---

## 最后一次收尾（自动生成）

由 **npm run harness:end** 或收尾关键词触发；禁用本节：`harness/harness.env` 中 `HARNESS_SKIP_PROTOCOL_SYNC=1`。

<!-- harness:auto:start -->

_尚无收尾记录。_

<!-- harness:auto:end -->
