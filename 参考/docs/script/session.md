# 登录态与会话检查

本文档以仓库内 **真实实现** 为准（避免与历史示例漂移）。

## 工作台检查（抖店后台 / fxg）

实现位置：`src/utils/doudian-session.ts` → `openWorkbenchAndAssertLoggedIn(page, baseUrl)`。

行为摘要：

- 打开：`${baseUrl}/ffa/mshop/homepage/index`
- `waitUntil: "domcontentloaded"`，并短暂 `settle`（默认约 3s）等待重定向稳定
- 基于 **pathname + title + URL 文本** 判断是否仍在登录墙；若判定为登录墙且不在工作台路径，则抛错

> 注意：该断言刻意避免“只看 URL 是否包含 homepage 关键字”的误判（例如某些登录页 `target_url` 查询串里可能夹带工作台路径）。

## 飞鸽（IM）工作台检查

实现位置：`src/utils/doudian-session.ts` → `openFeigeWorkspaceAndAssertLoggedIn(page, imBaseUrl)`。

默认打开：`${imBaseUrl}/pc_seller_v2/main/workspace`，并用类似的“登录墙 vs 工作台路径”规则断言。

## 用 Edge profile 导出登录态（免扫码 / 免密码登录链路）

背景：密码登录自动化容易被验证码页（例如 `#captcha_container`）干扰。通过复用 **Edge persistent profile** 的长期登录态，可绕开“脚本走密码登录”的路径。

### 命令

在仓库根目录执行（示例）：

```bash
EDGE_USER_DATA_DIR=.data/edge-profile npm run dev -- --save-session=edge
```

复用 **本机已安装 Edge** 里已有的 Cookie（自动解析用户数据目录；**须先完全退出 Edge**）：

```bash
EDGE_USER_DATA_DIR=system npm run dev -- --save-session=edge
```

`system` 与 `auto` 等价；Windows 一般为 `%LOCALAPPDATA%\Microsoft\Edge\User Data`。多配置时可再加：`EDGE_PROFILE_DIRECTORY=Default`（或 `Profile 1` 等，与 Edge `edge://version` 中「配置文件路径」的末级目录名一致）。

等价写法（显式 opt-in）：

```bash
npm run dev -- --save-session --via=edge
```

写出文件路径：

- 默认：`.data/storage-state.json`
- 覆盖：设置 `STORAGE_STATE_PATH=...`（相对路径会按 `process.cwd()` resolve；见 `src/utils/config.ts`）

### 行为说明

- Edge 模式使用 `chromium.launchPersistentContext(userDataDir, { channel: "msedge", headless: false })`
  - **强制 headed**（`headless=false`），与 `PLAYWRIGHT_HEADED` 是否开启无关（便于首次手动登录与排查）
- 首次会打开工作台 URL；随后多数轮询 **只读当前页 URL/标题**，避免频繁 `goto` 打断验证码/密码输入；间断性地再次打开工作台以防 SSO 卡住（实现见 `src/cli.ts` → `waitUntilWorkbenchLoggedIn`）
  - **首次 profile 未登录**：请在弹出的 Edge 内完成登录；通过后程序会再校验一次工作台并写入 `storage-state`
  - 等待上限默认 10 分钟，可用环境变量调整：`DOUDIAN_EDGE_SAVE_SESSION_WAIT_MS`（5000–600000）

### Profile 目录与锁（重要）

- `EDGE_USER_DATA_DIR`：
  - 未设置时默认使用：`.data/edge-profile`（推荐，避免抢占系统默认 Edge profile）
  - `system` / `auto`：自动解析本机 Edge 用户数据根目录（实现：`src/utils/edge-persistent.ts` → `detectSystemEdgeUserDataDir`）
  - 支持相对路径（相对仓库启动时的 `process.cwd()`）
  - 可选：`EDGE_PROFILE_DIRECTORY` → 传给 Chromium 的 `--profile-directory=...`
- **persistent profile 可能被 Edge 锁定**：若目录正被其他 Edge 实例占用，启动会失败。
  - 处理建议：**关闭正在运行的 Edge** 或改用独立目录（推荐 `.data/edge-profile`）

### 安全与提交纪律

- **不要提交** `.env`、真实账号密码、`storage-state.json`、Edge profile 目录等内容
- 仓库已 `.gitignore` 忽略 `.data/`（本地产物目录）

## Feature 中的推荐用法

```typescript
import { openWorkbenchAndAssertLoggedIn, log } from "../../utils/index.js";

export const someFeature: FeatureModule = {
  id: "some-feature",
  displayName: "某功能",
  async run({ page, baseUrl }) {
    log.info("[some-feature] 检查登录态...");
    await openWorkbenchAndAssertLoggedIn(page, baseUrl);
    // ... 继续业务步骤 ...
  },
};
```

若断言失败，CLI 侧常见提示是重新导出登录态：

- `npm run dev -- --save-session`（Chromium 干净上下文 + 终端 Enter 写入）
- `npm run dev -- --save-session=watch`（Chromium：监听主 frame 导航，按与 `doudian-session` 相同的 URL/标题规则在「未就绪→就绪」边沿自动写入 `STORAGE_STATE_PATH`；实现见 `src/utils/storage-state-autosave.ts`、`src/cli.ts`）
- 或 `npm run dev -- --save-session=edge`（Edge persistent profile 自动导出）
