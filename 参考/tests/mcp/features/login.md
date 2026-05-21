# Feature：`login`（登录）

> 本文档面向：**新手读懂用途** + **AI 按 MCP 做实测**。上方摘要随源码自动更新；下方「手册区」可人工润色。

<!-- AUTO:FEATURE_DOC -->
> **本区块由仓库 hook / `node harness/lib/sync-feature-mcp-docs.mjs` 根据源码自动生成**，请勿手工编辑；要写补充说明请改下方「手册区」。

## 同步摘要（机读）

- **id**：`login`
- **名称**：登录
- **源码目录**：`src/features/login/`
- **相关文件**：src/features/login/index.ts

### 源码顶部说明（摘录）

```text
默认：门户落地 + 工作台校验（依赖已有 storageState）。
配置 DOUDIAN_PASSWORD_LOGIN 与邮箱密码后：自动走门户邮箱登录；遇滑块需在 headed 下人工完成。
```

### CLI 快速对照

```bash
npm run dev -- --feature=login
```

### 注册表

- 本 Feature 在 **`tests/mcp/contracts/features-mcp-registry.ts`** 中登记；离线对齐见 **`npm run test`**。

### MCP 推荐顺序（给 AI 的步骤骨架）

- **路径 A（仅有 storage）**：用带 `storageState` 的浏览器上下文打开门户根路径 → 按 `openWorkbenchAndAssertLoggedIn` 落到工作台（常见 `/ffa/mshop/homepage/index`），快照中不应像典型登录墙。
- **路径 B（密码登录）**：仅在本地 `.env` 已配置且合规时使用自动化填表；遇滑块/验证码 → **暂停脚本**，人工处理后继续 BEFORE/AFTER 快照。

### MCP 实录要求

- 结论写入 **`.data/mcp-session-records/`**，模板 **`docs/script/mcp-session-record.md`**。
- Playwright MCP 工具名以 Cursor 启用 **`user-playwright`** 为准（如 `browser_navigate` / `browser_snapshot` / `browser_run_code_unsafe`）。

<!-- END:AUTO:FEATURE_DOC -->

<!-- MANUAL:FEATURE_DOC -->

## 给新手看的（白话）

这是「登录抖店后台」相关的脚本：  
- 若你**已经**用别的方式保存过登录状态（本仓库里是 `.data/storage-state.json` 一类文件），它会打开门户首页并**尝试确认你已经登录**。  
- 若你在本机 `.env` 里配置了**邮箱 + 密码自动登录**，它会走自动填表登录（遇到滑块/验证码时往往需要**真人**在浏览器里点一下）。

## 给 AI 写 MCP 测试时的要点

- **两条分支**：未配置密码登录 → 依赖 **storageState**；已配置 `DOUDIAN_PASSWORD_LOGIN` + 邮箱密码 → **`performPasswordLogin`**（ headed，验证码停自动化）。
- 最终都要落到 **工作台已登录** 的判定（与 `openWorkbenchAndAssertLoggedIn` / `doudian-session` 启发式一致），路径常见 **`/ffa/mshop/homepage/index`**。
- **不要**在对话里粘贴真实密码；对照 **`tests/actions/doudian/password-login.ts`** 与 **`.cursor/rules/local-mcp-validation.mdc`**。
- CLI 对照：`npm run dev -- --feature=login`。

<!-- END:MANUAL:FEATURE_DOC -->
