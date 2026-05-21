# Environment Configuration Reference

## Configuration Hierarchy

```
1. Operating system / Cursor global env (highest priority)
2. Process.env already set
3. harness/harness.local.env (personal overrides)
4. harness/harness.env (team defaults)
5. Hardcoded defaults in scripts (lowest priority)
```

## Core Variables

### Protocol Synchronization

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_SKIP_PROTOCOL_SYNC` | 0 | Disable all protocol file updates |
| `HARNESS_SKIP_PROTOCOL_INTENT_SYNC` | 0 | Disable `<agent_protocol_intent>` parsing |
| `HARNESS_SKIP_PROTOCOL_USER_INTENT` | 0 | Disable user command parsing (`/protocol`) |
| `HARNESS_SKIP_COMMIT_PROTOCOL_LOG` | 0 | Disable commit line appending |
| `HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL` | 0 | Disable commit detail (git show) appending |
| `HARNESS_COMMIT_PROTOCOL_PATCH` | 0 | Include full unified diff in commit detail |

### Handoff Tier

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_HANDOFF_FULL` | 0 | Default to full handoff (with git digest analysis) |

### Todo List

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_SKIP_TODOLIST_AUTO_ADD` | 0 | Disable auto-inserting todo items from intent |

### Verification Gates

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_REQUIRE_VERIFY` | 0 | Require verification before handoff |
| `HARNESS_AFTER_EDIT_VERIFY` | 0 | Auto-verify after each file edit |
| `HARNESS_VERIFY_CMD` | - | Command to run for verification (e.g., `npm run build`) |
| `HARNESS_VERIFY_PATHSPECS` | `src package.json tsconfig.json` | Files/directories to include in workspace signature |
| `HARNESS_VERIFY_MAX_AGE_MS` | 600000 (10min) | Maximum age for valid verification |

### Hook Usage Tracking

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_HOOK_USAGE_TRACK` | 1 | Enable hook usage tracking |
| `HARNESS_HOOK_USAGE_MD` | 1 | Generate Markdown report |
| `HARNESS_HOOK_USAGE_MD_PATH` | `docs/hook-usage-report.md` | Path for Markdown report |

### Stop Code Review

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_STOP_CODE_REVIEW` | 0 | Enable automatic code review followup |
| `HARNESS_STOP_CODE_REVIEW_PATHSPEC` | `src,package.json,tsconfig.json,web` | Paths to check for diff |
| `HARNESS_STOP_CODE_REVIEW_ON_STATUS` | `completed` | Trigger on: `completed`, `error`, or both |

### Cognitive Mode Switching

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_AUTO_MODE_SWITCH` | 0 | Enable automatic mode switching on frustration |
| `HARNESS_FRUSTRATION_WINDOW_MS` | 1200000 (20min) | Time window for failure counting |
| `HARNESS_FRUSTRATION_MIN_HITS` | 2 | Failures needed to trigger frustration |
| `HARNESS_FRUSTRATION_MAX_FOLLOWUPS` | 1 | Maximum followup messages per session |

### README Features Sync

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_SKIP_README_FEATURES_SYNC` | 0 | Disable auto-syncing feature list to README |

### Debouncing

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_DEBOUNCE_SHORT_MS` | 8000 | Short debounce for quick events |
| `HARNESS_DEBOUNCE_MS` | 45000 | Standard debounce for end-session |
| `HARNESS_AGENT_STOP_DEBOUNCE_MS` | 12000 | Same fingerprint dedup window for **Cursor `stop` hook** |

### Git `commit-msg` gate (trivial stop-hook commits)

Used by `harness/git/check-commit-msg-stop-hook.mjs` when `.githooks/commit-msg` is installed (`npm run setup:hooks`).

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_STOP_HOOK_COMMIT_MAX_CHURN` | 120 | If staged churn (insertions + deletions) for handoff-only commits **exceeds** this, the stop-hook commit is **allowed** |
| `HARNESS_ALLOW_STOP_HOOK_COMMIT` | unset | Set to `1` to **disable** the gate for that commit |

These variables are read from `process.env` after merging `harness/harness.env` and `harness/harness.local.env` (the hook imports `load-harness-env`).

### CLI / Debugging

| Variable | Default | Description |
|------------|---------|-------------|
| `HARNESS_ROOT` | (auto-detect) | Force repository root |
| `HARNESS_CONVERSATION_ID` | - | Override conversation ID |
| `HARNESS_GENERATION_ID` | - | Override generation ID |
| `HARNESS_FORCE_END` | 0 | Force end session without checks |
| `HARNESS_FORCE_STOP` | 0 | Force stop without debounce |
| `HARNESS_DEBUG_ENV` | 0 | Print environment loading debug info |

## Sample harness.env

```bash
# Protocol
HARNESS_SKIP_PROTOCOL_SYNC=0
# HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL=1

# Handoff
HARNESS_HANDOFF_FULL=0

# Verification (enable for stricter projects)
# HARNESS_REQUIRE_VERIFY=1
# HARNESS_VERIFY_CMD=npm run build
# HARNESS_VERIFY_MAX_AGE_MS=300000

# Tracking
HARNESS_HOOK_USAGE_TRACK=1
HARNESS_HOOK_USAGE_MD=1
# HARNESS_HOOK_USAGE_MD_PATH=.data/hook-usage-report.md

# Code review (enable for thorough reviews)
# HARNESS_STOP_CODE_REVIEW=1
# HARNESS_STOP_CODE_REVIEW_PATHSPEC=src,web,tests

# Frustration handling
# HARNESS_AUTO_MODE_SWITCH=1
# HARNESS_FRUSTRATION_MIN_HITS=3

# Stop-hook commit noise (optional; requires commit-msg hook)
# HARNESS_STOP_HOOK_COMMIT_MAX_CHURN=120
# HARNESS_ALLOW_STOP_HOOK_COMMIT=1
```

## Sample harness.local.env

```bash
# Personal overrides (git-ignored)
# Never commit this file

# Disable tracking for faster local dev
HARNESS_HOOK_USAGE_TRACK=0
HARNESS_HOOK_USAGE_MD=0

# Stricter verification locally
HARNESS_REQUIRE_VERIFY=1
HARNESS_VERIFY_CMD=npm run build

# Debug mode when developing harness itself
# HARNESS_DEBUG_ENV=1
```
