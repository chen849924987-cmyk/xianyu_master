# 闲鱼自动化助手 (xianyu-master)

> **版本**：v2.0.0（架构已转型）
> **项目状态**：已完成前后端分离改造

---

## 项目简介

闲鱼自动化助手是一款基于 **Node.js + Playwright** 构建的闲鱼电商运营自动化工具。它能够帮助卖家自动完成店铺数据采集、商品监控、自动回复、批量发布等日常运营操作，大幅提升运营效率。

本项目已完成 **前后端分离架构转型**：
- **`frontend/`** — 前端静态页面（HTML + CSS + JS），通过 HTTP API 与后端通信
- **`backend/`** — 后端 Node.js HTTP 服务器（非 Electron），提供 REST API + SSE 实时推送

---

## 核心能力一览

| 能力分类 | 具体功能 | 状态 |
|---------|---------|------|
| 📊 数据采集 | 店铺每日售出数据采集 | ✅ 可用 |
| 🔍 商品监控 | 关键词搜索店铺链接 | ✅ 可用 |
| 💬 聊天管理 | 自动聊天链接处理 | ✅ 可用 |
| 🤖 自动回复 | 根据关键词自动回复买家 | ✅ 可用 |
| 📢 批量发布 | 商品链接批量发布 | ✅ 可用 |
| 🔗 链接处理 | 店铺链接数据提取与分析 | ✅ 可用 |
| 📎 资源处理 | 链接中的资源（图片/视频）处理 | ✅ 可用 |
| 📅 定时任务 | 基于 cron 表达式的任务调度 | ✅ 可用 |
| 📈 数据报表 | Excel 格式的运营数据导出 | ✅ 可用 |
| 🔌 飞书集成 | 飞书聊天链接获取与交互 | ✅ 可用 |

---

## 技术栈

### 当前架构

| 层级 | 技术选型 |
|------|---------|
| **后端运行时** | Node.js (ES Modules / CJS) |
| **前端** | HTML + CSS + JS (直接 HTTP 请求) |
| **浏览器自动化** | Playwright (Chromium) |
| **浏览器连接** | CDP (Chrome DevTools Protocol) |
| **任务调度** | node-cron |
| **数据存储** | JSON 文件存储 / Excel (xlsx) |
| **图像处理** | sharp |
| **实时推送** | Server-Sent Events (SSE) |

---

## 技术栈文档

详见：[docs/tech-stack.md](./tech-stack.md)

---

## 快速开始

### 前置条件

- **Node.js** ≥ 18.x（推荐 20.x）
- **pnpm**（推荐）或 npm
- **Chromium**（Playwright 所需）

### 安装

```bash
# 1. 克隆项目
git clone <仓库地址>
cd xianyu_master

# 2. 安装依赖
pnpm install

# 3. 安装 Playwright 浏览器
npx playwright install chromium
```

### 配置浏览器连接

本项目支持两种浏览器运行模式：

**模式一：连接本机已有 Chrome（推荐）**
```bash
# 启动 Chrome 远程调试模式
backend\scripts\start_chrome.bat
```

**模式二：由 Playwright 自动启动浏览器**
在任务脚本中将 `USE_EXISTING_BROWSER` 设为 `false` 即可。

### 运行任务

```bash
# 方式一：启动 Web 管理界面
npm start
# 访问 http://localhost:3000

# 方式二：命令行交互菜单
npm run menu

# 方式三：直接运行特定任务脚本
node backend/tasks/get_shop_review_data.js
```

### 登录态管理

详细操作请参考：`docs/AI-handbook-xianyu-login-session.md`

---

## 项目结构

```
xianyu_master/
├── docs/                          # 项目文档
│   ├── README.md                  # 本文件 - 项目概述
│   ├── requirements.md            # 需求文档
│   ├── functional-spec.md         # 功能文档
│   ├── ui-spec.md                 # UI 设计规范文档
│   ├── roadmap.md                 # 开发路线图
│   ├── tech-stack.md              # 技术栈详细文档
│   ├── AI-handbook-xianyu-login-session.md  # 登录态操作手册
│   └── harness-evaluation.md      # Harness 工程评估
│
├── frontend/                      # 前端代码（独立目录）
│   └── index.html                 # Web 管理界面
│
├── backend/                       # 后端代码（全部业务逻辑）
│   ├── main.cjs                   # HTTP 服务器入口
│   ├── tasks/                     # 自动化任务脚本
│   │   ├── auto_chat_link.js
│   │   ├── auto_reply.js
│   │   ├── get_feishu_chat_links.js
│   │   ├── get_shop_link_date_data.js
│   │   ├── get_shop_links.js
│   │   ├── get_shop_review_data.js
│   │   ├── process_image.js
│   │   ├── process_link_cozi.js
│   │   ├── publish_links.js
│   │   └── search_shop_links_by_keyword.js
│   ├── modules/                   # 功能模块
│   │   ├── shop_data/shop_data.js
│   │   ├── chat_page/chat_page.js
│   │   ├── aqisuo/aqisuo.js
│   │   ├── feishu/feishu.js
│   │   ├── kouzi/kouzi.js
│   │   └── image/image.js
│   ├── utils/                     # 工具库
│   │   ├── browser.js
│   │   ├── chrome_remote_debug.js
│   │   ├── color.js
│   │   ├── dir.js
│   │   ├── extract_like_links.js
│   │   ├── file.js
│   │   ├── html-to-image.js
│   │   ├── image.js
│   │   └── utils.js
│   ├── store/                     # 数据存储
│   │   ├── index.js
│   │   └── publish_records.json.example
│   ├── scripts/                   # 辅助脚本
│   │   ├── menu.js                # CLI 交互菜单
│   │   ├── check_chrome.js        # Chrome 调试端口检测
│   │   └── index.js               # 旧版入口
│   ├── examples/                  # 示例脚本
│   │   └── example-html-to-image.js
│   └── output/                    # 输出结果目录（gitignored）
│
├── .clinerules/                   # 开发规范配置
├── package.json                   # 项目配置
├── pnpm-workspace.yaml            # pnpm 工作区配置
├── .gitignore                     # Git 忽略规则
├── 启动闲鱼助手.bat               # Windows 一键启动脚本
└── create_shortcut.ps1            # 创建桌面快捷方式
```

---

## API 速查（后端 REST API）

所有 API 端点由 `backend/main.cjs` 提供，前端通过 `http://localhost:3000/api/*` 访问。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 获取可用任务列表 |
| GET | `/api/scheduled-tasks` | 获取定时任务列表 |
| POST | `/api/scheduled-tasks` | 添加定时任务 |
| PUT | `/api/scheduled-tasks/:id` | 更新定时任务 |
| DELETE | `/api/scheduled-tasks/:id` | 删除定时任务 |
| POST | `/api/tasks/run` | 立即运行指定任务 |
| POST | `/api/tasks/toggle/:id` | 切换任务启用状态 |
| GET | `/api/logs` | 获取任务运行日志 |
| DELETE | `/api/logs` | 清空日志 |
| GET | `/events` | SSE 实时日志推送 |

### 浏览器管理 (`backend/utils/browser.js`)

| 方法 | 说明 |
|------|------|
| `launchBrowser()` | 启动新 Playwright 浏览器实例 |
| `connectToExistingBrowser(port)` | 通过 CDP 连接本机已有 Chrome |
| `navigateWithRetry(url)` | 导航到 URL，失败自动重试 |
| `openNewPage()` | 创建新页面 |
| `closePage()` | 关闭当前页面 |
| `recreateContext()` | 重建浏览器上下文 |

### 店铺数据 (`backend/modules/shop_data/shop_data.js`)

| 方法 | 说明 |
|------|------|
| `gotoShopPage(page)` | 跳转到店铺页面 |
| `getIntroText(page)` | 获取店铺简介/卖出件数 |
| `getReviewAndWantNumber(page)` | 获取浏览量和想要数 |
| `getLinkDescription(page)` | 获取商品链接描述 |
| `getUserName(page)` | 获取用户昵称 |
| `getImageUrls(page)` | 获取商品图片/视频 URL |
| `gotoNextPage(page)` | 翻页操作 |
| `extractItemId(url)` | 从 URL 提取商品 ID |

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端服务端口 | `3000` |
| `PLAYWRIGHT_HEADED` | 是否显示浏览器窗口 | `true` |
| `STORAGE_STATE_PATH` | 登录态 JSON 存储路径 | `.data/storage-state.json` |

---

## 开发计划

目前项目已完成 **架构转型**，详细开发路线请参考：`docs/roadmap.md`

### 已完成
1. ✅ 废弃 Electron 桌面壳层
2. ✅ 前后端代码完全分离（`frontend/` + `backend/`）
3. ✅ REST API 统一管理任务
4. ✅ SSE 实时日志推送
5. ✅ 定时任务管理

### 进行中
1. 🔄 优化前端管理界面 (HeroUI 风格)
2. 📝 丰富数据可视化报表
3. 📝 完善错误处理和日志系统

---

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: 添加xxx功能'`)
4. 推送到分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

---

## 许可证

本项目仅供学习和个人使用，请遵守闲鱼平台的使用条款。
