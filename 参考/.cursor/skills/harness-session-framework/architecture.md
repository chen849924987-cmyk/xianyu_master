# Architecture Details

## Design Philosophy

The harness framework follows three principles:

1. **Deterministic Boundaries**: Session start/end are explicit events with structured outputs
2. **Minimal Overhead**: Hot state files are Markdown/JSON for human inspection; no databases
3. **Git-Native**: All long-term history lives in git; harness just provides session-scoped context

## Dual-Track Design

### Why Two Tracks?

| Aspect | Intent Track | Field Track |
|--------|--------------|-------------|
| **Written by** | Human (user/assistant) | Machine (hooks) |
| **Frequency** | On milestone/intention change | Every tool use |
| **Content** | Goals, plans, blockers | Success/failure metrics |
| **Persistence** | Committed (session boundary) | Git-ignored (runtime only) |
| **Purpose** | Reorientation on session start | Debugging, pattern detection |

### File Relationships

```
┌─────────────────────────────────────┐
│  AGENT_TASK_PROTOCOL.md (Intent)   │
│  - Current feature                 │
│  - Completed steps                  │
│  - Next steps                       │
│  - Blockers                         │
│  - Commit log (auto)               │
└─────────────────────────────────────┘
           ↓ (on handoff)
┌─────────────────────────────────────┐
│  HANDOFF.json (Machine Summary)      │
│  - git_digest_markdown             │
│  - last_agent_turn                 │
│  - handoff_tier                    │
└─────────────────────────────────────┘
           ↓ (runtime, git-ignored)
┌─────────────────────────────────────┐
│  .data/harness-runtime.json        │
│  - tool_success events             │
│  - tool_failure events             │
│  - failure counts                  │
└─────────────────────────────────────┘
```

## State Transitions

### Normal Flow

```
User: "开始新功能 X"
  ↓
sessionStart hook
  - Read HANDOFF.json → context injection
  - Read AGENT_TASK_PROTOCOL.md → context injection
  - git status → context injection
  ↓
[Assistant provides briefing]
  ↓
[Tool operations...]
  ↓
postToolUse/postToolUseFailure hooks
  - Append to harness-runtime.json
  ↓
stop hook (each assistant turn ends)
  - merge HANDOFF.last_agent_turn
  - optional: git commit "chore: agent turn handoff (stop hook)"
  - optional: commit-msg rejects trivial handoff-only commits → files stay dirty
  ↓
User: "完成了" (or "收尾" / "handoff")
  ↓
beforeSubmitPrompt hook (end-session word detected)
  - Debounce check
  - May block with continue:false (if verification required)
  ↓
npm run harness:end (or auto-triggered)
  - Write HANDOFF.json
  - Update AGENT_TASK_PROTOCOL.md "last handoff" anchor
  - Optional: git commit
  ↓
Git commit (if user commits)
  ↓
post-commit hook
  - Append commit line to protocol
  - Append git show --stat to commit detail section
```

### Frustration Flow (if HARNESS_AUTO_MODE_SWITCH=1)

```
[Repeated tool failures...]
  ↓
stop hook detects frustration pattern
  ↓
Add followup_message to HANDOFF.last_agent_turn
  ↓
Cursor sends followup_message as user message
  ↓
Assistant suggests mode switch or gets extra context
```

## Data Formats

### HANDOFF.json

```json
{
  "version": 1,
  "schema": "project-handoff",
  "handoff_tier": "fast",
  "updated_at": "2026-05-11T02:45:00.000Z",
  "updated_at_local": "2026-05-11 10:45",
  "session_end_prompt": "完成了",
  "conversation_id": "abc-123",
  "git": {
    "head": "caefa927...",
    "head_short": "caefa92",
    "anchor_before": "4d18ce2..."
  },
  "todolist": {
    "task_ids_in_prompt": [],
    "updated": [],
    "skipped": []
  },
  "files_touched": [...],
  "next_suggested": [...],
  "git_digest_markdown": "...",
  "last_agent_turn": {
    "timestamp": "...",
    "summary": "...",
    "followup_message": null
  },
  "last_verification": {
    "timestamp": "...",
    "workspace_sig": "sha256:...",
    "cmd": "npm run build"
  }
}
```

### AGENT_TASK_PROTOCOL.md Anchors

```markdown
<!-- harness:intent:start -->
## Current Feature
...
<!-- harness:intent:end -->

<!-- harness:commit-log:start -->
- **2026-05-11** · `abc1234` · feat: something
<!-- harness:commit-log:end -->

<!-- harness:commit-detail:start -->
#### `abc1234` · feat: something
...
<!-- harness:commit-detail:end -->

<!-- harness:last-handoff:start -->
...
<!-- harness:last-handoff:end -->
```

### harness-runtime.json

```json
{
  "session_start": "2026-05-11T02:30:00.000Z",
  "events": [
    {"type": "tool_use", "tool": "Read", "success": true, "timestamp": "..."},
    {"type": "tool_failure", "tool": "Shell", "error": "exit 1", "timestamp": "..."}
  ],
  "tool_failure_total": 1
}
```

## Security Considerations

1. **HANDOFF.json may contain user messages** - review before sharing
2. **Never commit credentials** - use harness.local.env for secrets
3. **Runtime files are git-ignored** - prevents accidental leakage of tool outputs

## Performance

- All file operations are local (no network)
- JSON append uses read-modify-write (suitable for single-user Cursor sessions)
- Debouncing prevents duplicate handoffs (HARNESS_DEBOUNCE_MS default: 45s)
