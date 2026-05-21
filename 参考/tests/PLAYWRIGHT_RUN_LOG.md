# Playwright 测试执行记录（自动化跑测过程）

> 本文由 Agent 在本机执行命令时**逐条记录**，便于对照「环境 → 命令 → 输出 → 问题与修复」。  
> 记录时间（仓库元信息）：**2026-05-11**。

**策略更新**：抖店 Feature 真网在 **`tests/mcp/features/*.md`**（Cursor + Playwright MCP）。**2026-05-12 起**：原 **`tests/specs/**/*.spec.ts`**（含 unit）已移除；离线校验改为 **`tests/mcp/scripts/verify-offline.ts`**（`npm run test`）。下文若仍出现 `test:unit`、`*.spec.ts`、`login-password.e2e.spec.ts` 等，视为**历史跑测记录**，请以 **`tests/README.md`**、**`tests/mcp/protocols/offline-checks.md`** 为准。

---

## 1. 目标

- 安装依赖（若缺失）。  
- 执行 **`npm run test`**（历史记录中曾为 `test:unit` + Playwright spec）。  
- 将完整终端输出与中途问题写入本文，供人类查阅。

---

## 2. 环境快照

| 项 | 值 |
|----|-----|
| 工作目录 | `/Users/yuxuanruan/code/projects/doudian_master` |
| Node.js | `v24.15.0` |
| npm | `11.12.1` |
| `@playwright/test`（`npx playwright --version`） | `1.59.1` |
| 说明 | 首次检查时 **`node_modules` 不存在**；全局 `~/.npm` 缓存曾因权限报错，故改用**项目内缓存目录**安装（见 §3）。 |

---

## 3. 依赖安装（`npm install`）

### 3.1 命令

```bash
cd /Users/yuxuanruan/code/projects/doudian_master
npm install --cache "$(pwd)/.npm-cache" --prefer-offline false
```

### 3.2 结果（摘录）

```
added 234 packages, and audited 235 packages in 6s
found 0 vulnerabilities
```

**说明**：若你本机 `npm install` 在 `~/.npm` 上报 `EACCES`，可用同样方式把缓存指到仓库内可写路径（例如 `.npm-cache`）；该目录默认**未**写入 `.gitignore`，不需要提交时可自行忽略或加入 gitignore。

---

## 4. 第一次执行：`npm run test:unit`（失败）

### 4.1 命令

```bash
npm run test:unit
```

等价于：`npm run build && playwright test unit/login-wall-url.spec.ts unit/password-login-config.spec.ts`。

### 4.2 终端输出（原文）

```
> doudian-master@0.1.0 test:unit
> npm run build && playwright test unit/login-wall-url.spec.ts unit/password-login-config.spec.ts


> doudian-master@0.1.0 build
> tsc

Error: Cannot find module '/Users/yuxuanruan/code/projects/doudian_master/pure/login-wall-cases.js' imported from /Users/yuxuanruan/code/projects/doudian_master/tests/specs/unit/login-wall-url.spec.ts
Error: Cannot find module '/Users/yuxuanruan/code/projects/doudian_master/support/spawn-password-login-configured.js' imported from /Users/yuxuanruan/code/projects/doudian_master/tests/specs/unit/password-login-config.spec.ts
Error: No tests found.
Make sure that arguments are regular expressions matching test files.
You may need to escape symbols like "$" or "*" and quote the arguments.
```

### 4.3 原因说明（白话）

- 用例文件在 **`tests/specs/unit/`** 下，却使用了 **`../../../pure/...`**、**`../../../support/...`**。  
- 从 `unit` 往上三级目录到了**仓库根**，于是 Node 去根目录找 `pure/`、`support/`，正确路径应在 **`tests/pure/`**、**`tests/support/`**。  
- 正确相对路径应为 **`../../pure/...`**、**`../../support/...`**（从 `tests/specs/unit` 到 `tests` 只需两级）。

### 4.4 已做修复（代码）

| 文件 | 调整 |
|------|------|
| `tests/specs/unit/login-wall-url.spec.ts` | `../../../pure` → `../../pure`，`../../../support` → `../../support` |
| `tests/specs/unit/password-login-config.spec.ts` | `../../../support` → `../../support` |
| `tests/specs/e2e/login-password.e2e.spec.ts` | `../../../actions` → `../../actions`，`../../../support` → `../../support` |

---

## 5. 第二次执行：`npm run test:unit`（成功）

### 5.1 命令

```bash
npm run test:unit
```

### 5.2 终端输出（原文）

```
> doudian-master@0.1.0 test:unit
> npm run build && playwright test unit/login-wall-url.spec.ts unit/password-login-config.spec.ts


> doudian-master@0.1.0 build
> tsc


Running 11 tests using 1 worker

(node:26611) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show the full warning)
(node:26611) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show the full warning)
  ✓   1 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › 工作台 pathname 不算登录墙 (1ms)
  ✓   2 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › 登录路径算登录墙 (0ms)
  ✓   3 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › passport 路径 (0ms)
  ✓   4 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › sso 子域 (0ms)
  ✓   5 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › URL 含「扫码」 (0ms)
  ✓   6 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › 工作台 + 查询串仍非墙 (0ms)
  ✓   7 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › 非法 URL 字符串回退为 pathname 匹配 (0ms)
  ✓   8 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › binding 路径 (0ms)
  ✓   9 tests/specs/unit/password-login-config.spec.ts:14:3 › isPasswordLoginConfigured（子进程隔离 env） @unit › 未启用密码登录且无凭据时为 false (23ms)
  ✓  10 tests/specs/unit/password-login-config.spec.ts:19:3 › isPasswordLoginConfigured（子进程隔离 env） @unit › 仅 DOUDIAN_PASSWORD_LOGIN=1 无邮箱密码时为 false (22ms)
  ✓  11 tests/specs/unit/password-login-config.spec.ts:27:3 › isPasswordLoginConfigured（子进程隔离 env） @unit › DOUDIAN_PASSWORD_LOGIN=1 且邮箱密码齐全时为 true (23ms)

  11 passed (490ms)
```

### 5.3 摘要

- **`tsc`**：无报错退出。  
- **Playwright**：**11 条用例全部通过**；约 **0.49s** 完成（单 worker）。  
- **NO_COLOR / FORCE_COLOR**：来自运行环境（如 IDE 终端），一般可忽略。

---

## 6. 全量测试：`npm run test`（含 E2E 门禁）

### 6.1 命令

```bash
npm run test
```

等价于：`npm run build && playwright test`（扫描 `tests/specs` 下全部用例）。

### 6.2 终端输出（原文）

```
> doudian-master@0.1.0 test
> npm run build && playwright test


> doudian-master@0.1.0 build
> tsc


Running 12 tests using 1 worker

(node:26815) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show the full warning)
(node:26815) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show the full warning)
  -   1 tests/specs/e2e/login-password.e2e.spec.ts:23:3 › password login 真网 E2E @douyin-e2e › performPasswordLogin 后可打开工作台
  ✓   2 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › 工作台 pathname 不算登录墙 (1ms)
  ✓   3 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › 登录路径算登录墙 (0ms)
  ✓   4 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › passport 路径 (0ms)
  ✓   5 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › sso 子域 (0ms)
  ✓   6 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › URL 含「扫码」 (0ms)
  ✓   7 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › 工作台 + 查询串仍非墙 (0ms)
  ✓   8 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › 非法 URL 字符串回退为 pathname 匹配 (0ms)
  ✓   9 tests/specs/unit/login-wall-url.spec.ts:24:5 › isLikelyFxgLoginWall @unit › binding 路径 (0ms)
  ✓  10 tests/specs/unit/password-login-config.spec.ts:14:3 › isPasswordLoginConfigured（子进程隔离 env） @unit › 未启用密码登录且无凭据时为 false (23ms)
  ✓  11 tests/specs/unit/password-login-config.spec.ts:19:3 › isPasswordLoginConfigured（子进程隔离 env） @unit › 仅 DOUDIAN_PASSWORD_LOGIN=1 无邮箱密码时为 false (22ms)
  ✓  12 tests/specs/unit/password-login-config.spec.ts:27:3 › isPasswordLoginConfigured（子进程隔离 env） @unit › DOUDIAN_PASSWORD_LOGIN=1 且邮箱密码齐全时为 true (21ms)

  1 skipped
  11 passed (418ms)
```

### 6.3 摘要

- **`1 skipped`**：`tests/specs/e2e/login-password.e2e.spec.ts` 在未设置 **`DOUDIAN_E2E_LOGIN=1`** 时 **`test.skip`**，属设计行为（避免默认连真网）。  
- **`11 passed`**：与 `test:unit` 一致。  
- **退出码**：`0`（skipped 不计为失败）。

---

## 7. 流程串联（给人类的一条龙）

```text
进入仓库根目录
    → npm install（必要时加 --cache 指向可写目录）
    → npm run test:unit
          → npm run build（tsc 生成 dist/）
          → playwright test …（仅 unit 指定文件）
    → npm run test（可选）
          → 同上 build + 全量 specs（E2E 可能 skipped）
```

---

## 8. 截图 / 录屏 / Trace（证据产物）

### 8.1 现状与本次限制

- 本次跑的 `unit/*` 用例 **不会打开页面**，因此不会产生有意义的页面截图/录屏。
- 真正需要页面证据的用例是 `tests/specs/e2e/login-password.e2e.spec.ts`，但它默认 `test.skip`（未设置 `DOUDIAN_E2E_LOGIN=1`）。

### 8.2 已加的自动产物策略（代码层）

已在 `playwright.config.ts` 的 `use` 中启用（失败时保留证据）：

- `trace: "retain-on-failure"`
- `screenshot: "only-on-failure"`
- `video: "retain-on-failure"`

并在 `tests/specs/e2e/login-password.e2e.spec.ts` 中增加了关键节点的主动截图 attach（即便成功也会保留）：

- `landing.png`
- `after-password-login.png`
- `workbench.png`

### 8.3 产物位置（默认）

Playwright 默认会在仓库根目录生成 `test-results/`（trace / video / attachments 等）。  
本次跑完后该目录存在，但由于 E2E 被跳过、unit 不开页面，因此没有页面证据文件。

### 8.4 如何生成「真实页面」截图/录屏（手动一次）

当你本地准备好真网所需环境变量后，执行：

```bash
npm run build
PLAYWRIGHT_HEADED=1 DOUDIAN_E2E_LOGIN=1 DOUDIAN_PASSWORD_LOGIN=1 \
  npx playwright test e2e/login-password.e2e.spec.ts
```

跑完在 `test-results/` 下即可找到：

- 用例 attach 的 `*.png`
- 若用例失败：录屏 `*.webm`、trace `*.zip`

---

## 9. 相关文档

- 日常命令与变量：**[README.md](./README.md)**  
- 架构说明：**[ARCHITECTURE.md](./ARCHITECTURE.md)**  
- 白话入门：**[入门指南.md](./入门指南.md)**

---

*若你本地复现时结果与本文不一致，优先核对：Node 版本、`dist/` 是否最新、`DOUDIAN_E2E_LOGIN` 是否误开、以及 Chromium 是否已 `npm run browser:install`（本次 unit 未启动浏览器，未触发浏览器依赖）。*
