# Examples

## Example 0: New Project Initialization

### User Request

```
"为我的新项目安装 harness-session-framework"
"setup harness framework in this project"
"初始化 agent session harness"
```

### Agent Actions

```bash
# 1. Check project structure
ls -la
# → Shows: package.json (npm), src/, .git/ exists

# 2. Copy harness/ from skill template
cp -r ~/.cursor/skills/harness-session-framework/template/harness ./

# 3. Create .cursor/hooks.json
mkdir -p .cursor
cat > .cursor/hooks.json << 'EOF'
{
  "version": 1,
  "hooks": {
    "sessionStart": { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs sessionStart harness/hooks/session-start-context.mjs", "timeout": 30 },
    "stop": { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs stop harness/hooks/agent-stop.mjs", "timeout": 120, "loop_limit": 5 },
    "beforeSubmitPrompt": { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs beforeSubmitPrompt harness/hooks/prompt-session-end.mjs", "timeout": 120 },
    "postToolUse": { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs postToolUse harness/hooks/post-tool-runtime.mjs", "timeout": 15 },
    "postToolUseFailure": { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs postToolUseFailure harness/hooks/post-tool-failure-runtime.mjs", "timeout": 15 }
  }
}
EOF

# 4. Update package.json
npm pkg set scripts.harness:end="node harness/cli/end-session.mjs"
npm pkg set scripts.["harness:end:full"]="HARNESS_HANDOFF_FULL=1 node harness/cli/end-session.mjs"
npm pkg set scripts.[post-commit:run]="node harness/git/run-post-commit.mjs"

# 5. Setup .data/ directory
mkdir -p .data
echo ".data/" >> .gitignore

# 6. Create initial HANDOFF.json and AGENT_TASK_PROTOCOL.md
# (See Example 1 for content)

# 7. Enable repo git hooks (post-commit + optional commit-msg gate)
npm run setup:hooks
```

### Agent Response

```
✅ Harness Framework 已安装完成！

安装内容：
  ✓ harness/ 目录 (cli, git, hooks, lib, skills)
  ✓ .cursor/hooks.json (5 个核心 hooks)
  ✓ package.json 新增 3 个脚本
  ✓ .data/ 目录 (git-ignored)
  ✓ HANDOFF.json (初始状态)
  ✓ AGENT_TASK_PROTOCOL.md (任务协议模板)
  ✓ npm run setup:hooks → core.hooksPath=.githooks（协议提交日志 + stop-hook commit-msg 门禁）

下一步：
  1. 编辑 harness/harness.env 调整项目默认配置
  2. 运行 npm run harness:end 测试收尾流程
  3. 阅读 harness/README.md 了解完整功能

常用命令：
  npm run harness:end       # 快速收尾
  npm run harness:end:full  # 完整交接（含 git 摘要）
  npm run setup:hooks       # 若尚未配置，启用 .githooks
```

## Example 1: Basic Setup

### Project Structure

```
my-project/
├── src/
│   └── index.ts
├── harness/
│   ├── harness.env
│   ├── cli/
│   ├── git/
│   ├── hooks/
│   ├── lib/
│   └── README.md
├── .cursor/
│   └── hooks.json
├── .data/              # git-ignored
├── AGENT_TASK_PROTOCOL.md
└── HANDOFF.json
```

### Step-by-Step Bootstrap

```bash
# 1. Copy harness/ from template
# 2. Create .cursor/hooks.json:
cat > .cursor/hooks.json << 'EOF'
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
EOF

# 3. Setup environment
cp harness/harness.env harness/harness.local.env

# 4. Run setup
npm run setup:hooks  # or manually verify hooks.json is valid
```

## Example 2: Session Workflow

### Starting a Session

**User:** "开场"

**Assistant reads:**
- `HANDOFF.json` → Last handoff tier, git digest
- `AGENT_TASK_PROTOCOL.md` → Current intent
- `.data/harness-runtime.json` → Recent failures (if any)
- `git status -sb` + `git log -5`

**Assistant responds:**
```
Briefing:
- Current: Implementing user authentication
- Last: Completed login form UI
- Blocked: None
- Next: 1) Connect to API 2) Add validation 3) Error handling
```

### During Session

**User:** "更新协议
当前功能：用户认证模块
已完成：登录表单 UI、API 接口定义
下一步：1) 实现 API 调用 2) 添加表单验证 3) 错误处理
阻塞：需要后端提供测试账号"

**Hook automatically updates:** `AGENT_TASK_PROTOCOL.md` intent anchor

### Ending a Session

**User:** "完成了"

**Hook detects end word → runs:** `npm run harness:end`

**Result:**
- `HANDOFF.json` updated with current git HEAD
- `AGENT_TASK_PROTOCOL.md` "last handoff" anchor updated
- Optional commit: `chore: handoff (cursor hook)`

## Example 3: Protocol Update Methods

### Method A: Natural Language

```
更新协议
当前功能：支付系统集成
已完成：支付宝 SDK 接入、订单创建接口
下一步：1) 测试支付回调 2) 退款流程 3) 对账报表
阻塞：等待支付宝沙箱账号审批
备注：需要在生产环境配置 webhook
```

### Method B: JSON

```
/protocol {"active_feature":"payment-integration","completed_steps":["alipay sdk","order api"],"next_steps":["test webhook","refund flow","reconciliation"],"blocked_on":"alipay sandbox approval"}
```

### Method C: Assistant Block

Assistant ends response with:

```xml
<agent_protocol_intent>
{"active_feature":"payment-integration","completed":["alipay sdk","order api"],"next":["test webhook","refund flow"],"blocked":"alipay sandbox approval"}
</agent_protocol_intent>
```

## Example 4: Git Commit Integration

### After Commit

```bash
git add .
git commit -m "feat(payment): implement alipay sdk integration

- Add Alipay SDK configuration
- Implement order creation endpoint
- Add payment callback handler
- Include unit tests"
```

**Post-commit hook automatically appends to `AGENT_TASK_PROTOCOL.md`:**

```markdown
<!-- harness:commit-log:start -->
- **2026-05-11T14:30:00+08:00** · `a1b2c3d` · feat(payment): implement alipay sdk integration
<!-- harness:commit-log:end -->

<!-- harness:commit-detail:start -->
#### `a1b2c3d` · 2026-05-11 14:30:00 +0800 · feat(payment): implement alipay sdk integration

*medium + stat*

```text
commit a1b2c3d...
Author: ...
Date: ...

    feat(payment): implement alipay sdk integration
    ...

 src/payment/alipay.ts | 45 +++++++++
 src/payment/types.ts | 12 +++
 2 files changed, 57 insertions(+)
```

---
<!-- harness:commit-detail:end -->
```

## Example 5: Verification Gate

### Enabling Verification

**harness/harness.env:**
```bash
HARNESS_REQUIRE_VERIFY=1
HARNESS_VERIFY_CMD=npm run build
HARNESS_VERIFY_MAX_AGE_MS=300000
```

### Verification Flow

1. Agent makes edits
2. Runs `npm run build` → generates `.data/harness-verify.json`
3. User says: "完成了"
4. Hook checks verification exists and is fresh
5. Handoff proceeds

### Without Verification

**User:** "完成了"

**Response:**
```
Cannot handoff: verification required.

Please run the verification command:
npm run build

Or override: HARNESS_REQUIRE_VERIFY=0 npm run harness:end
```

## Example 6: Full Handoff

### Triggering Full Handoff

**User:** "完整交接" / "phase 收尾" / "handoff full"

Or:
```bash
npm run harness:end:full
```

### Additional Checks

Beyond fast handoff, full handoff:
1. Reads `HANDOFF.git_digest_markdown` for cross-session constraints
2. Scans diff for sensitive patterns (tokens, passwords)
3. Checks README consistency
4. Suggests local rebuild for large refactors

### Example Output

```markdown
## Session Summary

**Completed:**
- Implemented payment webhook handler
- Added refund API endpoint
- Updated documentation

**Blocked:**
- None

**Next 3 Steps:**
1. Deploy to staging and test with Alipay sandbox
2. Add monitoring alerts for payment failures
3. Implement retry logic for failed webhooks

**Session Wisdom:**
- Alipay SDK requires different config for sandbox vs production

**Git Status:**
- 3 commits ahead of main
- 5 files changed (+234/-45)

**Checks:**
- [x] No secrets in diff
- [x] README features synced
- [x] Build passes
```

## Example 7: Frustration Recovery

### Scenario

Multiple tool failures in succession:
1. `Shell: npm test` → exit 1
2. `Read: missing-file.ts` → file not found
3. `Shell: git push` → rejected (non-fast-forward)

### Automatic Response (if HARNESS_AUTO_MODE_SWITCH=1)

**stop hook detects:** 3 failures in 10 minutes

**Assistant receives followup:**
```
Noticing several consecutive failures. Suggestions:

1. Switch to Plan mode to design a recovery strategy
2. Or run: git status && git pull --rebase
3. Or let me analyze the test failures first
```

## Example 8: Hook Usage Report

### Generated Report

**File:** `docs/hook-usage-report.md`

```markdown
# Hook Usage Report

Generated: 2026-05-11 10:30

## Summary

| Hook | Calls | Failures | Avg Time |
|------|-------|----------|----------|
| sessionStart | 15 | 0 | 450ms |
| stop | 42 | 1 | 120ms |
| beforeSubmitPrompt | 89 | 0 | 80ms |
| postToolUse | 342 | 0 | 15ms |
| postToolUseFailure | 12 | 0 | 12ms |

## Recent Calls

| Time | Hook | Duration | Status |
|------|------|----------|--------|
| 10:25 | postToolUse | 12ms | OK |
| 10:24 | stop | 110ms | OK |
| 10:20 | beforeSubmitPrompt | 75ms | OK |
```

### Raw Data

**File:** `.data/hook-usage.json`

```json
{
  "version": 1,
  "updated_at": "2026-05-11T02:30:00.000Z",
  "hooks": {
    "sessionStart": {"calls": 15, "failures": 0, "total_ms": 6750},
    "stop": {"calls": 42, "failures": 1, "total_ms": 5040}
  },
  "recent": [...]
}
```

## Example 9: Merging with Existing Hooks

### Scenario

Project already has `.cursor/hooks.json`:

```json
{
  "hooks": {
    "beforeSubmitPrompt": [
      { "command": "node scripts/custom-check.mjs" }
    ]
  }
}
```

### Merge Strategy

Add harness hooks as additional entries (don't replace):

```json
{
  "version": 1,
  "hooks": {
    "beforeSubmitPrompt": [
      { "command": "node scripts/custom-check.mjs" },
      { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs beforeSubmitPrompt harness/hooks/prompt-session-end.mjs", "timeout": 120 }
    ],
    "sessionStart": [
      { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs sessionStart harness/hooks/session-start-context.mjs", "timeout": 30 }
    ],
    "stop": [
      { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs stop harness/hooks/agent-stop.mjs", "timeout": 120, "loop_limit": 5 }
    ],
    "postToolUse": [
      { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs postToolUse harness/hooks/post-tool-runtime.mjs", "timeout": 15 }
    ],
    "postToolUseFailure": [
      { "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs postToolUseFailure harness/hooks/post-tool-failure-runtime.mjs", "timeout": 15 }
    ]
  }
}
```

### Handling Conflicts

If both hooks need to block/continue:
- Cursor respects `continue: false` from any hook
- Order matters: hooks run in array order
- Use `timeout` to prevent one slow hook from blocking others
