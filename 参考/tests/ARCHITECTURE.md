# 测试体系说明（人类可读）

本文描述 **`tests/`** 的设计：**Feature 真网由 AI + Playwright MCP 按 markdown 验证**；**离线对齐与纯逻辑**由 **`tests/mcp/scripts/verify-offline.ts`**（`npm run test`）执行。**不再**维护 Playwright **`tests/specs/**/*.spec.ts`**。

更细的编码规范见仓库 **[`docs/test/`](../docs/test/README.md)**（命名、环境变量等）。白话入门见 **[入门指南.md](./入门指南.md)**。

---

## 1. 这套测试解决什么问题

| 目标 | 说明 |
|------|------|
| **可重复离线验证** | 注册表、`xf` 契约、登录墙启发式、密码登录配置检测：一键 **`npm run test`**（含 `tsc`）。 |
| **Feature 真网** | 全部注册在 `src/features/index.ts` 的 Feature，由 AI 在 Cursor 内按 **`tests/mcp/features/<id>.md`** 使用 **`user-playwright`** 执行；实录 **`.data/mcp-session-records/`**（**`docs/script/mcp-session-record.md`**）。 |
| **机读对齐** | **`tests/mcp/contracts/features-mcp-registry.ts`**、`xf-low-goods-mcp-contract.ts` 由 **`verify-offline.ts`** 与 `dist/` 对照。 |
| **真网不经离线脚本** | 抖店 / 晓风页面不开在无头自动化 spec 里；避免 CI 误耗账号。 |
| **人类可维护** | 重复页面步骤集中在 **`tests/actions/`**，表驱动数据在 **`tests/pure/`**。 |

---

## 2. 目录全景

```
tests/
├── README.md / ARCHITECTURE.md / 入门指南.md
├── tsconfig.json
├── specs/README.md          # 说明：已无 *.spec.ts
├── actions/                 # 页面级语义动作（对照 dist / CLI）
├── pure/                    # 表驱动数据（与浏览器无关）
├── mcp/
│   ├── README.md
│   ├── protocols/offline-checks.md   # AI 离线验收协议
│   ├── scripts/verify-offline.ts     # 离线断言（npm test）
│   ├── features/*.md                # Feature 真网 MCP 步骤
│   └── contracts/*.ts                 # 注册表与 xf 契约
└── support/                 # 仓库根解析、子进程 worker
```

---

## 3. 从克隆到跑通

### 3.1 一次性准备

1. **`npm install`**
2. **`npm run browser:install`**（仅当你要用 Playwright MCP / codegen 时）
3. 可选 **`.env`**：见根目录 **`.env.example`**、**[`docs/test/environment.md`](../docs/test/environment.md)**

### 3.2 离线校验

```bash
npm run test
```

等价于 **`npm run build`** 后 **`tsx tests/mcp/scripts/verify-offline.ts`**。

### 3.3 Feature 真网（MCP）

1. **`tests/mcp/features/<feature-id>.md`**
2. Cursor 启用 **`user-playwright`**
3. 结论落 **`docs/script/mcp-session-record.md`** 模板至 **`.data/mcp-session-records/`**

AI 离线步骤总览：**[`tests/mcp/protocols/offline-checks.md`](./mcp/protocols/offline-checks.md)**。

---

## 4. 数据流概要

### 4.1 登录墙表驱动 + `dist`

`tests/pure/login-wall-cases.ts` → **`verify-offline.ts`** 动态 `import(dist/utils/doudian-password-login.js)` → 逐条比对 `isLikelyFxgLoginWall`。

### 4.2 密码登录配置（子进程）

`tests/support/is-password-login-configured-worker.mjs` + **`spawn-password-login-configured.ts`**（`DOUDIAN_SKIP_REPO_DOTENV=1`）→ **`verify-offline.ts`** 三组 env 场景。

### 4.3 Feature 真网

**`tests/mcp/features/*.md`** + Playwright MCP；**`tests/actions/`** 可对齐 CLI 步骤。

---

## 5. 与仓库其它模块的关系

| 模块 | 关系 |
|------|------|
| **`src/features/*`** | CLI 调度；与 **`tests/mcp/features/`** 一一验收对应。 |
| **`harness/`** | Cursor 会话收尾；不参与 `npm test` 链。 |
| **`docs/test/`** | 命名等规范；与本文件互补。 |
| **`.cursor/rules/local-mcp-validation.mdc`** | `storage-state` 与 MCP 浏览器 Cookie 差异说明。 |

---

## 6. 新增验收的推荐步骤

1. **Feature 源码** → 在 **`src/features/`** 注册并实现；保存后 Cursor **`afterFileEdit`** 会刷新 **`tests/mcp/features/<id>.md`** 的 AUTO 区块（亦可手动 **`npm run sync:feature-docs`**）。
2. **仅离线** → 若触及契约或注册表，改 **`tests/mcp/contracts/`**，跑 **`npm run test`**。
3. **真网** → 确认 **`FEATURE_MCP_REGISTRY`** 含新 **`<id>`**（与 `listFeatures()` 一致）。
4. **依赖 `src`** → 离线脚本通过 **`dist/`** 加载（须先 build）。

---

## 7. 常见问题

| 现象 | 可能原因 |
|------|----------|
| `verify-offline` 无法 import `dist/...` | 未 **`npm run build`** 或 `tsc` 报错。 |
| 找不到某 Feature 的 MCP 步骤 | **`tests/mcp/contracts/features-mcp-registry.ts`**、**`tests/mcp/README.md`**。 |
| `npx playwright test` 报无测试 | 预期行为：本仓库 **`tests/specs`** 不再含 `*.spec.ts`；真网走 MCP。 |

---

## 8. 相关文件索引

| 文件 | 作用 |
|------|------|
| [`package.json`](../package.json) | `test` 脚本 |
| [`playwright.config.ts`](../playwright.config.ts) | 保留 codegen；默认无 spec |
| [`tests/mcp/scripts/verify-offline.ts`](./mcp/scripts/verify-offline.ts) | 离线断言 |
| [`tests/support/repo-root.ts`](./support/repo-root.ts) | 解析仓库根 |

---

*若移动脚本或契约路径，请同步 **`tests/mcp/protocols/offline-checks.md`** 与本文。*
