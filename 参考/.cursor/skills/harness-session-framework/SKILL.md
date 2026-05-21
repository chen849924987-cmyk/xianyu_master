---
name: harness-session-framework
description: >
  Implements a dual-track handoff system for Cursor Agent sessions with deterministic boundaries, environment configuration, git integration, and verification gates. Covers Cursor hooks (sessionStart, stop, beforeSubmitPrompt, postToolUse), stop-hook HANDOFF merges and optional git commits, and repo-side commit-msg noise control. Use when setting up session management, agent handoffs, task protocols, or automated commit workflows for long-running Cursor Agent projects.
disable-model-invocation: true
---

# Agent Session Harness Framework

A minimal yet comprehensive system for managing Cursor Agent session boundaries, handoffs, and deterministic state transitions.

## Repo mirror (`_synced/`)

Authoritative docs for this skill live under **`docs/`** and **`harness/`** at the repository root. They are **copied** into **`_synced/docs/`** and **`_synced/harness/`** so the Agent can read them from the skill folder without leaving the workspace layout.

- **Manual:** `npm run sync:harness-skill`
- **Automatic:** saving any file under `docs/` or `harness/` triggers **`after-file-sync-harness-skill`** (unless `HARNESS_SKIP_CURSOR_SKILL_SYNC=1`).
- **Do not edit `_synced/` by hand** — changes would be overwritten on the next sync.

The hand-authored overview below ([Architecture](architecture.md), [Hooks](hooks.md), etc.) complements the mirror; when in doubt, prefer **`_synced/harness/README.md`** and **`_synced/docs/`**.

## Core Concepts

### Dual-Track Handoff

| Track | File | Purpose |
|-------|------|---------|
| **Intent (Human Protocol)** | `AGENT_TASK_PROTOCOL.md` | Hot state for current feature, completed steps, next steps, blockers. Written via user commands (`/protocol`, `更新协议`) or `<agent_protocol_intent>` JSON blocks. |
| **Field (Machine Measurements)** | `.data/harness-runtime.json` | Tool success/failure trails, failure counts. Auto-appended by `postToolUse`/`postToolUseFailure` hooks. Git-ignored. |
| **Machine Summary** | `HANDOFF.json` | Structured handoff with `git_digest_markdown`, optional `last_agent_turn`, verification state. |

### Session Lifecycle

```
sessionStart → [tool operations] → stop (HANDOFF.last_agent_turn + optional git commit)
                    ↓                    ↓
              postToolUse           commit-msg may reject trivial stop-hook commits
                    ↓
              post-commit (auto-log after user/agent commits)
                    ↓
              harness:end (full handoff when user ends session)
```

**Stop hook vs full handoff:** `stop` updates `HANDOFF.json` and may run `git commit -m "chore: agent turn handoff (stop hook)"` when handoff files changed. Repositories that ship **`.githooks/commit-msg`** can **block** tiny commits that only touch `HANDOFF.json` / `AGENT_TASK_PROTOCOL.md` (see [Hook Reference](hooks.md)). Working tree may stay dirty until a meaningful commit.

## Quick Start

### 1. Bootstrap Harness (New Project)

#### Option A: Via Skill (Recommended)

When starting a new project, ask the Agent:

```
"为这个项目安装 harness-session-framework"
"setup harness framework"
"初始化 agent session harness"
```

The Agent will:
1. Copy the `harness/` directory structure
2. Create `.cursor/hooks.json`
3. Update `package.json` scripts
4. Setup `.data/` directory with `.gitignore`
5. Create initial `HANDOFF.json` and `AGENT_TASK_PROTOCOL.md`

#### Option B: Manual Copy

```bash
# Copy from skill template
cp -r /path/to/skill/template/harness ./
cp /path/to/skill/template/.cursor/hooks.json ./.cursor/

# Then:
npm run setup:hooks   # core.hooksPath=.githooks → post-commit + commit-msg (stop-hook gate)
```

### 2. Essential Files

Create in repository root:

| File | Required | Description |
|------|----------|-------------|
| `harness/harness.env` | Yes | Team defaults for `HARNESS_*` variables |
| `AGENT_TASK_PROTOCOL.md` | Auto-created | Intent anchor with commit log sections |
| `HANDOFF.json` | Auto-created | Machine-readable handoff |
| `.data/` | Auto-created | Git-ignored runtime data |

### 3. Daily Workflow

**Start session:**
```
User: "开场" / "/start" / "继续上次"
→ Read HANDOFF.json + AGENT_TASK_PROTOCOL.md + git status
→ Provide ≤12 line briefing
```

**During session:**
- Hooks auto-collect tool usage to `.data/harness-runtime.json`
- Use `<agent_protocol_intent>` JSON blocks or `/protocol` commands to update intent

**End session:**
```bash
# Fast handoff (default)
npm run harness:end

# Full handoff with git digest
npm run harness:end:full
# or: HARNESS_HANDOFF_FULL=1 npm run harness:end
```

**After commit:**
- Post-commit hook auto-appends to `AGENT_TASK_PROTOCOL.md` commit log
- Optional: full `git show --stat` or patch detail

**After each Agent turn (`stop` hook):**
- Merges `HANDOFF.last_agent_turn` (assistant excerpt, diff stat, etc.)
- Attempts `git commit` for `HANDOFF.json` / `AGENT_TASK_PROTOCOL.md` only when changed
- If `commit-msg` rejects the commit (trivial stop-hook gate), changes remain unstaged/uncommitted until you bundle them or set `HARNESS_ALLOW_STOP_HOOK_COMMIT=1` (see [env-config.md](env-config.md))

## Configuration

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `HARNESS_SKIP_PROTOCOL_SYNC` | 0 | Disable protocol file updates |
| `HARNESS_SKIP_COMMIT_PROTOCOL_LOG` | 0 | Disable commit log appending |
| `HARNESS_COMMIT_PROTOCOL_PATCH` | 0 | Include full patch in commit detail |
| `HARNESS_REQUIRE_VERIFY` | 0 | Gate handoff on verification evidence |
| `HARNESS_VERIFY_CMD` | - | Command to generate `.data/harness-verify.json` |
| `HARNESS_AUTO_MODE_SWITCH` | 0 | Auto-switch cognitive mode on frustration |
| `HARNESS_HANDOFF_FULL` | 0 | Default to full handoff tier |
| `HARNESS_STOP_HOOK_COMMIT_MAX_CHURN` | 120 | `commit-msg`: allow stop-hook commit if staged churn (ins+del) exceeds this |
| `HARNESS_ALLOW_STOP_HOOK_COMMIT` | unset | Set to `1` to bypass trivial stop-hook commit-msg gate |

### File Locations

```
harness/
├── harness.env              # Team defaults (committed)
├── harness.local.env        # Personal overrides (git-ignored)
├── README.md                # Full documentation
├── cli/
│   └── end-session.mjs      # npm run harness:end
├── git/
│   ├── run-post-commit.mjs       # Commit log integration (via .githooks/post-commit)
│   └── check-commit-msg-stop-hook.mjs  # Optional: block noisy stop-hook commits (.githooks/commit-msg)
├── hooks/
│   ├── session-start-context.mjs
│   ├── agent-stop.mjs
│   ├── prompt-session-end.mjs
│   ├── post-tool-runtime.mjs
│   └── post-tool-failure-runtime.mjs
├── lib/
│   ├── load-harness-env.mjs
│   ├── protocol-sync.mjs
│   ├── runtime-state.mjs
│   └── verify-evidence.mjs
└── skills/
    ├── start.md
    ├── handoff.md
    └── commit.md
```

## Hook Integration

### .cursor/hooks.json

```json
{
  "hooks": {
    "sessionStart": {
      "command": "node --import ./harness/lib/load-harness-env.mjs harness/hooks/session-start-context.mjs"
    },
    "stop": {
      "command": "node --import ./harness/lib/load-harness-env.mjs harness/hooks/agent-stop.mjs",
      "loop_limit": 3
    },
    "beforeSubmitPrompt": {
      "command": "node --import ./harness/lib/load-harness-env.mjs harness/hooks/prompt-session-end.mjs"
    },
    "postToolUse": {
      "command": "node --import ./harness/lib/load-harness-env.mjs harness/hooks/post-tool-runtime.mjs"
    },
    "postToolUseFailure": {
      "command": "node --import ./harness/lib/load-harness-env.mjs harness/hooks/post-tool-failure-runtime.mjs"
    }
  }
}
```

## Intent Update Methods

### Method 1: User Commands

Send messages starting with:
- `更新协议`
- `同步任务协议`
- `/protocol`

Followed by structured content:

```text
更新协议
当前功能：抖店自动化
已完成：登录模块重构
下一步：1) 测试飞鸽工作台 2) 优化错误处理
阻塞：无
```

### Method 2: Assistant JSON Blocks

End assistant response with:

```xml
<agent_protocol_intent>
{"active_feature":"doudian-automation","completed_steps":["login refactor"],"next_steps":["test feige workspace","error handling"],"blocked_on":"","recent_notes":""}
</agent_protocol_intent>
```

## Verification Gates

Enable with `HARNESS_REQUIRE_VERIFY=1`:

1. Define verification command: `HARNESS_VERIFY_CMD="npm run build"`
2. Command must produce `.data/harness-verify.json` with workspace signature
3. Handoff blocked if verification missing or stale

## RAG Boundaries

**Never index in vector/RAG:**
- `AGENT_TASK_PROTOCOL.md` (hot state)
- `.data/harness-runtime.json` (machine measurements)
- `.data/harness-cognitive.json` (mode switches)

**Safe for long-term memory:**
- `HANDOFF.json` historical versions
- Git commit messages
- Business documentation

## New Project Setup Workflow

When asked to "setup harness framework" or "install agent session harness":

### Step 1 - Gather Project Info

Check existing structure:
- `package.json` exists? (detect package manager: npm/yarn/pnpm)
- `.cursor/` exists? (may have existing hooks)
- `.gitignore` exists? (need to add `.data/`)

### Step 2 - Copy Scaffold

Copy these from skill template:
```
harness/                      → ./harness/
├── cli/
├── git/
├── hooks/
├── lib/
├── skills/
├── harness.env
└── README.md
```

### Step 3 - Create Cursor Hooks

Create `.cursor/hooks.json` (merge with existing if present):
- sessionStart → session-start-context.mjs
- stop → agent-stop.mjs
- beforeSubmitPrompt → prompt-session-end.mjs
- postToolUse → post-tool-runtime.mjs
- postToolUseFailure → post-tool-failure-runtime.mjs
- (Optional) beforeShellExecution, preToolUse, afterFileEdit

### Step 4 - Update Package Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "harness:end": "node harness/cli/end-session.mjs",
    "harness:end:full": "HARNESS_HANDOFF_FULL=1 node harness/cli/end-session.mjs",
    "post-commit:run": "node harness/git/run-post-commit.mjs",
    "setup:hooks": "git config core.hooksPath .githooks"
  }
}
```

### Step 5 - Setup Data Directory

```bash
mkdir .data
# Add to .gitignore: .data/
```

### Step 6 - Create Initial State Files

Create `HANDOFF.json`:
```json
{
  "version": 1,
  "schema": "project-handoff",
  "handoff_tier": "fast",
  "updated_at": "...",
  "git": { "head": "", "head_short": "", "anchor_before": "" },
  "files_touched": [],
  "next_suggested": ["Customize harness/harness.env", "Test with npm run harness:end"]
}
```

Create `AGENT_TASK_PROTOCOL.md` with empty intent anchor.

### Step 7 - Git hooks path

```bash
npm run setup:hooks   # git config core.hooksPath .githooks
```

Ensures **post-commit** (protocol log) and, when present, **commit-msg** (trivial stop-hook gate). Without this, only Cursor hooks run; git-side hooks are inactive.

### Step 8 - Report

Confirm to user:
- Harness installed at `./harness/`
- Hooks configured in `.cursor/hooks.json`
- `npm run setup:hooks` run so `.githooks/` applies
- Run `npm run harness:end` to test
- Customize `harness/harness.env` for project needs

## Additional Resources

- [Architecture Details](architecture.md) - Deep dive into dual-track design
- [Hook Reference](hooks.md) - All hooks and their triggers
- [Environment Configuration](env-config.md) - Complete variable reference
- [Examples](examples.md) - Sample workflows and outputs
- [Install Script](scripts/install.mjs) - Automated installer reference
