# 闲鱼工具 · Playwright 登录态操作手册（给其他项目 AI 用）

> **用途**：说明在 **闲鱼相关自动化工具**（Node + Playwright、`storageState` 持久化登录）里如何**获取、保存、使用**登录态。  
> **读者**：自动化助手 — **严格按顺序执行**；短信/扫码/风控必须人工处理；**不要用错浏览器**（MCP ≠ Playwright）。

---

## 1. 一句话结论

- 登录态 = 一个 **JSON 文件**（Playwright `storageState`），常见默认路径：**`<项目根>/.data/storage-state.json`**（以目标仓库代码为准）。  
- 必须用目标项目提供的 **`--save-session`**（或等价命令）在 **Playwright 启动的 Chromium** 里完成闲鱼侧登录，再在终端 **Enter** 写入文件。  
- 跑脚本时由 Playwright **读取该文件**注入 Cookie；**没有有效文件 ⇒ 视为未登录**。

---

## 2. 最容易犯的错误（必读）

### 2.1 「浏览器 MCP」里的登录 ≠ 这份 JSON

- IDE **浏览器 MCP** 里登录成功，**不会**自动出现在你工具里的 `storage-state.json`。  
- 仅有 JSON，也 **不会**让 MCP 标签页带上同一 Cookie。  

**要写 JSON**：只用 Playwright 的 `--save-session`（或你们包装的同逻辑）。  
**要验证 CLI 是否登录**：跑你们项目里的 **登录校验 / 冒烟 feature**，不要只靠 MCP 快照。

### 2.2 验证码与风控只能人工

闲鱼/阿里登录常见：短信、扫码、滑块、风控拦截。**AI 不得假定已登录**。

### 2.3 不要把登录态提交到 Git

`storage-state.json` 含会话 Cookie。**加入 `.gitignore`，禁止提交**。

---

## 3. 闲鱼入口与多域名（给 AI 的上下文）

- 闲鱼 **网页端主站**常见为：**`https://www.goofish.com`**（域名若变更以业务与配置为准）。  
- 登录过程中常会 **跳转到阿里系登录域**（例如淘宝账号体系相关域名）。只要在 **同一个 Playwright BrowserContext** 里完成整段登录，保存下来的 `storageState` 通常会包含后续请求所需的 Cookie（具体以实际抓包/脚本为准）。  
- 若你的工具还要访问 **其它子域或后台**（例如单独的配置里写了第二个 `BASE_URL`），保存会话时应在 **同一轮浏览器会话** 内打开并登录那些页面，否则 JSON 里可能缺 Cookie。

**规则**：以 **闲鱼工具仓库里的配置文件 / README** 里的 `BASE_URL`、环境变量名为准；本文的 `goofish.com` 仅为常见默认值示例。

---

## 4. 前置条件（一次性）

在**闲鱼工具项目根目录**：

| 步骤 | 命令 / 动作 |
|------|----------------|
| 安装依赖 | `npm install`（或项目文档指定的方式） |
| 安装 Chromium | `npx playwright install chromium`（或项目提供的 `npm run browser:install`） |
| Node 版本 | 以目标项目 `package.json` 的 `engines` 为准 |

---

## 5. 标准流程：写入登录态（必经）

命令名称需与 **闲鱼工具** 一致；若从本仓库 **doudian-master** 抄架构，常见形态为：

### 5.1 有界面浏览器（推荐）

```bash
PLAYWRIGHT_HEADED=1 npm run dev -- --save-session
```

**Windows CMD** 示例：

```cmd
set PLAYWRIGHT_HEADED=1 && npm run dev -- --save-session
```

若闲鱼项目 entry 不是 `npm run dev`，改成该项目的 CLI 启动方式（见对方 `package.json`）。

### 5.2 在浏览器里要做什么

1. 等待 **Playwright 打开的 Chromium**（不是 MCP）。  
2. 地址栏打开 **项目配置的闲鱼入口**（默认可试 **`https://www.goofish.com`**，最终以 env / 配置为准）。  
3. **人工完成登录**（含跳转、验证码、扫码等）。  
4. 确认已是登录后可见的页面（例如个人相关入口、不再卡在登录页 — 以你们脚本判定为准）。  
5. 回到**启动该命令的终端**，按一次 **Enter**。  

### 5.3 成功标志

- 终端打印 **已保存登录态** 类日志及 **绝对路径**。  
- 该路径下 JSON **非空**，且含 `cookies` 等字段。

### 5.4 脚本通常不会自动打开首页

多数实现是：启动浏览器 → 等你按 Enter → 导出当前上下文。因此 **须自行在 Chromium 里导航到闲鱼并完成登录**，再按 Enter。

---

## 6. 标准流程：使用登录态跑功能

（命令以闲鱼项目为准，示意）

```bash
npm run dev -- --feature=<功能 id>
npm run dev -- --list
```

若报「无登录态」「JSON 损坏」：回到 **第 5 节** 重存，或检查 `STORAGE_STATE_PATH` 是否指错文件。

---

## 7. 环境变量（建议命名 · 以对方代码为准）

| 变量 | 含义 |
|------|------|
| `XIANYU_BASE_URL` / `GOOFISH_BASE_URL` / 项目自定 | 闲鱼（或卖家后台）入口 URL，**不要**末尾多余 `/` |
| `STORAGE_STATE_PATH` | 登录态 JSON 路径；多账号可用不同文件名区分 |
| `PLAYWRIGHT_HEADED` | `1` / `true` / `yes` / `on` ⇒ 显示浏览器窗口 |

子域多的时候：可为第二站点再加 `XIANYU_*_URL`，并在保存会话时 **在同一浏览器里登录该站点**。

---

## 8. 校验登录态是否仍有效

- 运行闲鱼项目里自带的 **session 校验 / 打开首页探测**（若有）。  
- 若频繁掉登录：重新 `--save-session`；减少账号风控触发（频率、环境异常等）。

---

## 9. 常见问题

| 现象 | 可能原因 | 处理 |
|------|-----------|------|
| 仍跳转登录页 | JSON 缺失、过期、路径错 | 重跑 save-session；检查 `STORAGE_STATE_PATH` |
| 部分接口 403 | 缺少某子域 Cookie | 保存会话时在同一 Chromium 访问并登录该子域 |
| MCP 已登录、CLI 未登录 | 两套浏览器 | 必须用 Playwright 流程写文件 |

---

## 10. 给其他 AI 的执行清单（可复制）

```text
[ ] 打开闲鱼工具仓库，读 README / config 确认 CLI 命令与 BASE_URL 环境变量名
[ ] npm install；安装 Chromium（playwright install）
[ ] PLAYWRIGHT_HEADED=1 + 项目约定的 save-session 命令
[ ] 在 Playwright Chromium 中打开配置的闲鱼入口（示例 https://www.goofish.com）
[ ] 人工完成阿里系登录流程与验证
[ ] 若脚本还依赖其它域名，在同一浏览器内登录那些站点
[ ] 回终端按 Enter，确认「已保存登录态」与非空 JSON
[ ] 运行项目的校验 feature 或业务 feature
[ ] 勿将 storage-state.json、.env 提交 Git
```

---

## 11. 与「抖店版」手册的关系

- **抖店后台**专用步骤、域名、变量名见同目录：**`AI-handbook-doudian-login-session.md`**。  
- 闲鱼与抖店 **不可共用**同一份 `storage-state`（站点不同）；两个项目各存各的 JSON。
