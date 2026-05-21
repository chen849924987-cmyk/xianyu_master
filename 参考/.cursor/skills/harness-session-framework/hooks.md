# Hook Reference

## Hook Inventory

| Hook | Trigger | Script | Key Behavior |
|------|---------|--------|--------------|
| `sessionStart` | New Composer/Agent session | `session-start-context.mjs` | Inject HANDOFF + protocol + runtime context |
| `stop` | Assistant stops (error/complete) | `agent-stop.mjs` | Merge `HANDOFF.last_agent_turn`; optional `git commit` |
| `beforeSubmitPrompt` | User sends message | `prompt-session-end.mjs` | Detect end words; may block with `continue:false` |
| `postToolUse` | Tool succeeds | `post-tool-runtime.mjs` | Append success event to runtime |
| `postToolUseFailure` | Tool fails | `post-tool-failure-runtime.mjs` | Append failure event; increment counter |
| Git `commit-msg` | `git commit` | `.githooks/commit-msg` → `harness/git/check-commit-msg-stop-hook.mjs` | Optional: block trivial stop-hook handoff-only commits |

## Detailed Hook Behaviors

### sessionStart

**Trigger:** New Cursor Agent session begins

**Actions:**
1. Load harness environment variables
2. Resolve repository root (from `workspace_roots` or git)
3. Read `HANDOFF.json` → inject as context
4. Read `AGENT_TASK_PROTOCOL.md` → inject as context
5. (Optional) Read `.data/harness-runtime.json` excerpt
6. (Optional) Read `AGENT_TODOLIST.md`
7. Generate git status + recent log summary

**Context Injected:**
- Git digest from last handoff
- Current task protocol
- Suggested next steps
- Recent commits

### stop

**Trigger:** Assistant turn ends (`completed`, `error`, or `aborted`).

**Script:** `harness/hooks/agent-stop.mjs` → `runAgentStopHandoff` in `harness/lib/session-end-core.mjs`.

**Actions (order matters):**
1. Load environment (`load-harness-env`).
2. **Cognitive mode:** If `HARNESS_AUTO_MODE_SWITCH=1` yields a `followup_message`, emit it and **return** (no handoff write this turn).
3. **Debounce:** Compute fingerprint (`getAgentStopFingerprint`): status, loop count, `HEAD` short, last assistant reply excerpt (~500 chars), `git diff --stat`. If same fingerprint within `HARNESS_AGENT_STOP_DEBOUNCE_MS` (default 12s), skip entirely (`shouldThrottleAgentStop`).
4. **Handoff merge:** `mergeHandoffLastAgentTurn` — writes `HANDOFF.last_agent_turn` (source `stop_hook`, excerpt, diff stat, timestamps).
5. **Git commit attempt:** `commitHandoffArtifacts(root, "chore: agent turn handoff (stop hook)")` — `git add` only changed files among `HANDOFF.json`, `AGENT_TASK_PROTOCOL.md`, then `git commit`. Failures are non-fatal (logged).
6. Record fingerprint timestamp for debounce (`recordAgentStop`).
7. **Optional:** `HARNESS_STOP_CODE_REVIEW` may append a `followup_message` for another assistant turn.

**Why many commits?** Each turn usually changes `last_agent_turn` JSON → staged diff exists → commit runs. Debounce only helps when fingerprint repeats within the window.

**Output:** Updated `HANDOFF.json`; optional git commit.

### Git `commit-msg` hook (repository, not Cursor)

**Purpose:** Reduce git history noise from step 5 above.

**Files:** `.githooks/commit-msg` → `harness/git/check-commit-msg-stop-hook.mjs` (loads `harness/harness.env` / `harness.local.env`).

**Behavior:** Rejects commits whose **subject** is exactly `chore: agent turn handoff (stop hook)` when **all** staged paths are only `HANDOFF.json` and/or `AGENT_TASK_PROTOCOL.md` **and** total churn (insertions + deletions from `git diff --cached --numstat`) is **≤ `HARNESS_STOP_HOOK_COMMIT_MAX_CHURN`** (default 120). Mixed commits (e.g. `src/` included) are allowed.

**Bypass:** `HARNESS_ALLOW_STOP_HOOK_COMMIT=1`. **Requires** `git config core.hooksPath .githooks` (e.g. `npm run setup:hooks`).

### beforeSubmitPrompt

**Trigger:** User submits a message

**Actions:**
1. Debounce check (prevents duplicate processing)
2. Detect end-session words:
   - "完成了", "结束", "收工", "交接", "handoff"
   - "保存进度", "今天到这", "done", "wrap up"
3. Detect protocol update words:
   - "更新协议", "同步任务协议", "/protocol"
4. If end word detected:
   - Run `harness:end` (or block if verification required)
5. If protocol word detected:
   - Parse message content (natural language or JSON)
   - Update `AGENT_TASK_PROTOCOL.md` intent anchor

**Blocking:**
- If `HARNESS_REQUIRE_VERIFY=1` and no valid verification:
  - Return `{continue: false, message: "Verification required..."}`

### postToolUse / postToolUseFailure

**Trigger:** After every tool execution

**Actions:**
1. Load environment
2. Append event to `.data/harness-runtime.json`:
   ```json
   {"type": "tool_use", "tool": "Read", "file": "...", "timestamp": "..."}
   ```
3. For failures, increment `tool_failure_total`

**Purpose:**
- Debugging trail
- Frustration detection (failure frequency)
- Usage analytics

## Utility Hooks

### afterFileEdit (Optional)

Trigger: After any file edit by agent

Script: `after-file-verify.mjs`

Actions:
- If `HARNESS_AFTER_EDIT_VERIFY=1`:
  - Run `HARNESS_VERIFY_CMD`
  - Update `.data/harness-verify.json`

### preToolSafety (Optional)

Trigger: Before Shell tool execution

Script: `pre-tool-safety.mjs` or `before-shell-safety.mjs`

Actions:
- Audit command for dangerous patterns
- May block or warn

## Hook Configuration

### Loop Limits

Some hooks have `loop_limit` to prevent infinite loops:

```json
{
  "hooks": {
    "stop": {
      "command": "...",
      "loop_limit": 3
    }
  }
}
```

### Exit Codes

Hooks communicate via exit codes and stdout:

| Exit | Meaning |
|------|---------|
| 0 | Success (continue) |
| 1 | Block with `continue:false` |
| Other | Error (may be retried) |

### Debouncing

Controlled via environment:

- `HARNESS_DEBOUNCE_SHORT_MS`: 8000 (8s) - for quick successive events
- `HARNESS_DEBOUNCE_MS`: 45000 (45s) - for end-session detection
- `HARNESS_AGENT_STOP_DEBOUNCE_MS`: 12000 (12s) - for stop hook **fingerprint** dedup (`HARNESS_FORCE_STOP=1` skips)

## Hook Wrapper

For tracking usage statistics, hooks can be wrapped:

```json
{
  "hooks": {
    "sessionStart": {
      "command": "node harness/lib/run-hook.mjs sessionStart harness/hooks/session-start-context.mjs"
    }
  }
}
```

The wrapper:
1. Times execution
2. Records success/failure
3. Updates `.data/hook-usage.json`
4. Generates Markdown report (if enabled)
