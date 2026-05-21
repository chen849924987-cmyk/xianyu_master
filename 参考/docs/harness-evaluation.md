# Harness 工程综合评价

## 一句话总结

你的 Harness 工程是一个**"AI 助手 Session 管理框架"**，类似于给 Cursor 装了一个"黑匣子"和"行车记录仪"，让每个工作会话都有记录、可追溯、有交接。

---

## 通俗理解：Harness 是做什么的？

想象你和 AI 助手一起做一个长期项目：

| 场景 | 没有 Harness | 有 Harness |
|------|-------------|-----------|
| 新会话开始 | "我之前做到哪了？" → 翻聊天记录 | 自动显示：当前任务、上次改动、已完成的步骤 |
| 工作过程中 | AI 改文件 → 改崩了 → 不知道怎么恢复 | 每次编辑后自动验证（如 `npm run build`），发现问题立刻提醒 |
| 会话结束 | 说"完成了" → 但其实没 commit → 下次重来 | 说"完成"自动触发：勾掉 TODO、git commit、生成交接文档 |
| 多会话协作 | 每个会话独立，历史碎片化 | 所有会话通过 `HANDOFF.json` 串联，像连续剧一样连贯 |

**核心设计思想**：
1. **双轨交接**：人类看 `AGENT_TASK_PROTOCOL.md`（意图），机器看 `.data/harness-runtime.json`（现场）
2. **钩子驱动**：在 Cursor 的各个时机（session 开始、工具调用后、文件编辑后、Agent 停止时）自动执行逻辑
3. **确定性落盘**：关键信息写进文件，不依赖 AI"记得"

---

## 模块详解 + 实际例子

### 1. Hooks 层（事件监听与触发）

#### ① `session-start-context.mjs` - 开场白注入
**作用**：每次新开一个 Chat，自动告诉 AI 当前项目状态

**例子**：
```
你打开 Cursor，新建一个对话
↓
Hook 自动执行，读取 HANDOFF.json、AGENT_TASK_PROTOCOL.md、runtime.json
↓
AI 收到这样的开场上下文：

"当前在做抖店 Playwright CLI 项目
  已完成：登录态保存、session 校验
  下一步：飞鸽工作台自动化
  上次提交：feat: web console, API server
  工具最近成功率：98%"
```

**价值**：不用每次跟 AI 说"我之前做了啥"

---

#### ② `prompt-session-end.mjs` - 收尾词检测
**作用**：你说"完成了""done""finished"，系统自动触发收尾流程

**例子**：
```
你："功能做完了，可以提交"
↓
Hook 检测到你说了"做完了"，触发收尾
↓
系统自动：
  1. 提取你说的话里的任务编号（如"1.1"）
  2. 去 AGENT_TODOLIST.md 把对应任务勾上 ✓
  3. 运行 git commit
  4. 更新 HANDOFF.json
  5. 更新 AGENT_TASK_PROTOCOL.md 的"最后一次收尾"记录
```

**价值**：用自然语言结束工作，不用记命令

---

#### ③ `post-tool-runtime.mjs` + `post-tool-failure-runtime.mjs` - 工具调用记录
**作用**：每次 AI 使用工具（读文件、写文件、执行命令）都记录下来

**例子**：
```
AI 调用 Read 工具读取 config.ts
↓
Hook 记录：
  {
    "at": "2026-05-11T14:23:00Z",
    "kind": "tool_ok",
    "tool": "Read",
    "summary": "config.ts (305 lines)"
  }

AI 调用 Shell 执行 npm run build，结果失败了
↓
Hook 记录：
  {
    "at": "2026-05-11T14:25:00Z",
    "kind": "tool_fail",
    "tool": "Shell",
    "summary": "npm run build (exit 1)"
  }
  tool_failure_total + 1
```

**价值**：知道 AI 干了啥、有没有出错，排查问题时看 runtime 记录就知道

---

#### ④ `after-file-verify.mjs` - 编辑后自动验证
**作用**：保存源代码文件后，自动运行验证命令（默认 `npm run build`）

**例子**：
```
AI 修改了 src/utils/config.ts
↓
你保存文件
↓
Hook 检测到是源码文件（匹配 src/**、*.ts、package.json 等）
↓
自动执行 npm run build
↓
如果编译成功：
  写入 .data/harness-verify.json：
  {
    "exit_code": 0,
    "passed": true,
    "timestamp": "...",
    "tree_signature": "HEAD + diff hash"
  }

如果编译失败：
  提示错误，不让你"干净"地收尾
```

**价值**：防止"改完代码觉得没问题，结果提交后 build 挂了"

---

#### ⑤ `agent-stop.mjs` - Agent 停止时的处理
**作用**：当一个 AI 轮次结束时（正常完成/出错/中断），做轻量级记录

**例子**：
```
AI 回答完了，或者你点了 Stop
↓
Hook 执行：
  1. 检查是否完成/出错/中断
  2. 如果不是重复触发（防抖），更新 HANDOFF.json 的 last_agent_turn
  3. 如果启用了 HARNESS_STOP_CODE_REVIEW=1，且工作区有未提交改动：
     生成代码评审报告，输出到 docs/agent-reviews/
```

**价值**：每个会话都有记录，可以追溯

---

### 2. Lib 核心层（业务逻辑）

#### ① `session-end-core.mjs` - 收尾总指挥
**作用**：所有收尾操作的 orchestrator（协调者）

**例子**：
```
你说"完成了"
↓
进入 session-end-core.mjs 的 runUserTriggeredSessionEnd()
↓
执行流程：
  1. 检查是否需要验证门禁（HARNESS_REQUIRE_VERIFY）
     → 如果验证失败，拒绝收尾，告诉你"先解决问题"
  2. 提取任务 ID（从你的话里找 1.1、2.3 这种格式）
  3. 更新 AGENT_TODOLIST.md（把对应任务勾上）
  4. git add + commit
  5. 生成 HANDOFF.json
  6. 同步 AGENT_TASK_PROTOCOL.md
  7. 输出完成报告
```

**价值**：一套标准化的收尾流程，不漏步骤

---

#### ② `runtime-state.mjs` - 现场记录员
**作用**：维护 `.data/harness-runtime.json`，记录工具调用轨迹

**例子**：
```javascript
// 文件中记录的数据结构示例
{
  "version": 1,
  "schema": "doudian-master-runtime",
  "tool_failure_total": 2,  // 总共失败了2次
  "recent_events": [
    {"at": "2026-05-11T10:00:00Z", "kind": "tool_ok", "tool": "Read", "summary": "README.md"},
    {"at": "2026-05-11T10:05:00Z", "kind": "tool_ok", "tool": "Write", "summary": "config.ts"},
    {"at": "2026-05-11T10:06:00Z", "kind": "tool_fail", "tool": "Shell", "summary": "npm test (exit 1)"},
    // ... 保留最近60条
  ]
}
```

**价值**：排查问题时有"案底"可查，知道哪步出错

---

#### ③ `verify-evidence.mjs` - 验证门禁守卫
**作用**：确保质量，防止带着错误提交

**例子**：
```javascript
// 场景1：编辑后自动验证
你修改了 src/features/login.ts
→ fileTriggersAfterEditVerify() 返回 true（命中验证路径）
→ runVerifyAndRecordEvidence() 执行 npm run build
→ 编译成功 → 写入 harness-verify.json

// 场景2：收尾前检查
你说"完成了"
→ getVerifyBlockReason() 检查：
   - 有没有 harness-verify.json？
   - 验证是不是最近2小时内？
   - 工作区文件有没有变化（对比 tree_signature）？
→ 如果验证过期了 → 拒绝收尾，提示"请先运行验证"
```

**价值**：质量保证，不让未经验证的代码轻易提交

---

#### ④ `protocol-sync.mjs` - 协议同步员
**作用**：把收尾信息写进人类可读的 `AGENT_TASK_PROTOCOL.md`

**例子**：
```
收尾完成后
↓
在 AGENT_TASK_PROTOCOL.md 的"最后一次收尾"区块写入：

## 最后一次收尾（自动生成）

- **时间**：2026-05-11 14:30（北京时间）
- **层级**：fast
- **会话提示**："完成飞鸽工作台路径探测"
- **Git HEAD**：caefa92
- **Hook 备注**：CLI harness:end（tier=fast）。工作区无变更，已跳过 commit。
```

**价值**：人类随时能看项目状态，不用翻聊天记录

---

#### ⑤ `cognitive-modes.mjs` - 认知层切换器（高级功能）
**作用**：当 AI 连续失败多次，自动切换到更深入的推理模式

**例子**：
```
AI 连续 3 次工具调用失败
↓
检测到挫败模式
↓
输出建议：
"检测到多次失败，建议：
  1. 切换到 plan 模式重新设计
  2. 或阅读相关文件后再尝试
"
或者：
HARNESS_AUTO_MODE_SWITCH=1 时，直接自动触发 followup 切模式
```

**价值**：避免 AI 在一个坑里反复横跳

---

### 3. CLI 层（用户命令）

#### `cli/end-session.mjs` - 命令行收尾
**作用**：`npm run harness:end` 的实现

**例子**：
```bash
# 快速收尾（默认）
npm run harness:end
→ 执行 runUserTriggeredSessionEnd()，tier=fast

# 完整收尾
npm run harness:end:full
→ HARNESS_HANDOFF_FULL=1，生成更详细的交接文档

# 带自定义消息
npm run harness:end -- --message "完成了飞鸽模块"
→ 用自定义消息提交
```

---

### 4. Git 集成层

#### `git/run-post-commit.mjs` - 提交后处理
**作用**：git commit 后自动更新协议文档

**例子**：
```
git commit -m "feat: add login module"
↓
post-commit hook 触发
↓
读取最新提交信息
↓
在 AGENT_TASK_PROTOCOL.md 末尾追加：

- **2026-05-11T14:30:00+08:00** · `abc1234` · feat: add login module

#### `abc1234` · 2026-05-11 14:30:00 +0800 · feat: add login module
*medium + stat*

~~~text
commit abc1234...
Author: ...
Date: ...

    feat: add login module
    
    - Add password login
    - Add session storage
    - Add verify flow

 src/login.ts | 100 ++++++++++++++++++
 1 file changed, 100 insertions(+)
~~~
```

**价值**：提交历史自动同步到协议文档，一目了然

---

### 5. Skills 层（SOP 文档）

#### `skills/start.md`、`handoff.md`、`commit.md`
**作用**：给 AI 看的"操作手册"

**例子**：
```
skills/start.md 告诉 AI：
"开场时要读取 HANDOFF.json、AGENT_TASK_PROTOCOL.md、runtime.json，
 然后总结给用户"

skills/handoff.md 告诉 AI：
"收尾时要写 HANDOFF.json，包含：
  - handoff_tier（fast/full）
  - 当前 Git HEAD
  - 本次会话修改的文件列表
  - 下一步建议"
```

**价值**：AI 行为标准化，不同会话表现一致

---

## 优点（做得好的地方）

| 优点 | 说明 |
|-----|------|
| **架构清晰** | 分层明确：Hooks → Lib → CLI → Git，各司其职 |
| **双轨设计巧妙** | 机器读 JSON，人类读 Markdown，各取所需 |
| **自动化程度高** | 开口说"完成"就能触发全套流程，零 friction |
| **质量门禁完善** | 编辑后自动验证、收尾前强制检查，防止低级错误 |
| **可观测性强** | runtime 记录、hook 使用统计、git 提交记录，全程可追溯 |
| **配置灵活** | 环境变量控制开关，不同场景可灵活启用/禁用功能 |
| **防重复机制** | 多处防抖设计（fingerprint、generation_id），避免重复触发 |
| **RAG 隔离意识** | 明确区分"热状态"（协议、runtime）和冷数据，避免污染向量索引 |
| **Skill 化思维** | 把最佳实践沉淀为 Skill 文档，可复制到其他项目 |

---

## 缺点 + 改进建议

### 1. 学习曲线较陡
**问题**：新用户要理解"双轨交接""协议同步""runtime 轨迹"等概念，需要一定时间

**改进**：
- 添加一个 `docs/harness-quickstart.md`，用"第一步、第二步"的方式引导
- 做一个初始化命令 `npm run harness:init`，自动配置 .cursor/hooks.json 和示例文件

---

### 2. 环境变量较多，容易混淆
**问题**：HARNESS_REQUIRE_VERIFY、HARNESS_AFTER_EDIT_VERIFY、HARNESS_SKIP_PROTOCOL_SYNC 等变量散落在 harness.env 和文档中

**改进**：
- 做一个环境变量速查表
- 或者做一个 CLI 配置命令：`npm run harness:config` 交互式设置

---

### 3. 验证机制单一
**问题**：目前验证主要靠 `npm run build`，对于非 TS 项目（如纯 Python、Go）不够通用

**改进**：
- 支持可配置的验证命令：`HARNESS_VERIFY_COMMAND="make test"`
- 支持多阶段验证：lint → build → test

---

### 4. 没有可视化 Dashboard
**问题**：hook 使用统计、runtime 数据都在 JSON 里，不够直观

**改进**：
- 已经有了 `web/` 目录（Vite + React），可以扩展一个 Harness Dashboard：
  - Hook 调用热力图
  - 工具成功率趋势
  - Session 时长统计
  - 失败类型分布

---

### 5. 错误恢复机制较弱
**问题**：当收尾流程卡住（如 git commit 失败），没有清晰的恢复指引

**改进**：
- 添加`收尾故障排查指南`文档
- 收尾失败时输出清晰的下一步建议

---

### 6. 多分支场景未充分处理
**问题**：在 feature 分支上收尾后切换到 main 分支，HANDOFF.json 可能显示过时信息

**改进**：
- 在 HANDOFF.json 中记录分支名
- Session Start 时检测分支变化，提示"已切换分支，信息可能不适用"

---

### 7. 可测试性待加强
**问题**：Hooks 和 Lib 函数大多是直接操作文件系统，单元测试较难写

**改进**：
- 引入依赖注入模式，允许传入 mock 文件系统
- 添加集成测试用例，测试完整 Session 流程

---

## 总体评分

| 维度 | 评分 | 评价 |
|-----|------|------|
| 架构设计 | ⭐⭐⭐⭐⭐ | 分层清晰，概念明确 |
| 自动化程度 | ⭐⭐⭐⭐⭐ | 几乎全程自动化 |
| 可维护性 | ⭐⭐⭐⭐ | 代码结构好，但注释可以更多 |
| 易用性 | ⭐⭐⭐ | 概念多，需要文档支持 |
| 可扩展性 | ⭐⭐⭐⭐ | 模块化设计，容易扩展新 hook |
| 健壮性 | ⭐⭐⭐⭐ | 有防抖、验证等机制 |

**总分**：4.3/5 —— 这是一个**工程化程度很高**的 Session 管理框架，适合长期项目、团队协作场景。

---

## 推荐阅读顺序

如果你是新接触这个工程，建议按这个顺序理解：

1. 先读 `harness/README.md` —— 了解整体架构
2. 读 `HANDOFF.json` —— 看实际生成的交接数据
3. 读 `AGENT_TASK_PROTOCOL.md` —— 了解任务协议
4. 看 `.data/harness-runtime.json` —— 理解现场记录
5. 挑一个 Hook（如 `hooks/prompt-session-end.mjs`）跟踪整个流程
6. 阅读本文（harness-evaluation.md）获得全局视角

---

*文档生成时间：2026-05-11*
*适用于：抖店 Playwright CLI 项目（doudian_master）*
