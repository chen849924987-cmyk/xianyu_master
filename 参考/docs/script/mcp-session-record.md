# MCP 实录后记录规范

适用于通过 **Cursor 浏览器类 MCP**（如 `cursor-ide-browser`）或 **`user-playwright`（Playwright MCP）** 完成的页面验证、DOM 探测、`browser_run_code_unsafe` 试验等「实录」工作。

## 为什么要记

- 实录结论若不落盘，下一轮会话只剩口述，**无法对照** URL、选择器、阻塞点。
- 与 CLI `storage-state.json`、`.data/ui-job-artifacts/` 分工：MCP 侧行为**单独留痕**，避免和 Playwright 子进程日志混在一起。

## 何时必须写

在单次任务中，只要满足任一条件，**结束前**应留下一条记录：

- 用 MCP 做过 **`browser_navigate` / `browser_snapshot` / `browser_click`** 等并据此改了代码或协议；或
- 用过 **`browser_run_code_unsafe`**（含带 `storageState` 路径的探测）；或
- 用 MCP 确认了**登录墙 / 风控 / 选择器是否命中**等阻塞或结论；或
- 按 **`tests/mcp/features/*.md`** 完成了与 **`src/features/`** 对应的 Feature 验证（无论 pass/fail）。

纯列表工具（如仅 `browser_tabs` list）且无结论时可省略。

## 写在哪里（推荐）

目录在 **`.data/` 下**（整目录已被 `.gitignore`，勿提交）：

```text
.data/mcp-session-records/
```

每条会话一个文件，命名建议：

```text
mcp-{YYYYMMDD}-{简短主题}.md
```

例如：`mcp-20260511-xf-fuwu-common-services.md`。

同一自然日多次实录可在同一文件末尾追加 `---` 分隔块，或分文件均可。

## 记录模板（复制填空）

```markdown
## MCP 实录摘要

- **时间（本地）**：
- **MCP**：user-playwright / cursor-ide-browser / 其他：
- **任务目标**：（例如：验证服务市场「常用服务」内晓风入口）
- **起始 URL**：
- **结束 URL**（若与起始不同）：
- **是否使用 storageState**：（否 / 是，仅写绝对路径文件名，勿贴 Cookie）
- **关键操作**：（导航 → 快照 → 点击 … 简要）
- **结论**：（例如： narrow panel 内 `filter({ hasText: titleRe })` 可稳定命中）
- **阻塞 / 需人工**：（无 / 验证码 / 登录墙 …）
- **关联代码或文档**：（PR、commit、`src/features/...` 路径）
```

## 禁止写入的内容

- `storage-state.json` / `.env` **全文或片段**
- Cookie、Token、账号密码、验证码图片中的敏感信息

路径级别提及（如「已用 `.data/storage-state.json`」）允许。

## 与仓库文档的关系

- Feature 级 MCP 步骤清单：**`tests/mcp/README.md`**、**`tests/mcp/features/`**。
- 流程纪律（何时快照 BEFORE/AFTER、lock 等）见 **`.cursor/rules/local-mcp-validation.mdc`**。
- Playwright CLI 与 MCP **登录态不共用**的说明亦在同规则内。
