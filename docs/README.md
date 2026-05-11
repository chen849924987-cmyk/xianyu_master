# 闲鱼自动化助手 (xianyu-master)

> **版本**：v2.1.0（Next.js 一体化架构）
> **项目状态**：已升级为 Next.js 全栈应用

---

## 项目简介

闲鱼自动化助手是一款基于 **Node.js + Playwright** 构建的闲鱼电商运营自动化工具。它能够帮助卖家自动完成店铺数据采集、商品监控、自动回复、批量发布等日常运营操作，大幅提升运营效率。

本项目采用 **Next.js 一体化架构**：
- **`app/api/`** — Next.js API Routes 提供后端 REST API 和 SSE 实时推送
- **`app/page.tsx`** — React 前端页面（HeroUI 设计规范）
- **`lib/api-server.ts`** — 后端核心逻辑（任务执行、定时调度、日志存储）

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
| 🔐 登录态管理 | 闲鱼登录态持久化保存、校验与清除 | ✅ 可用 |

---

## 技术栈

### 当前架构

| 层级 | 技术选型 |
|------|---------|
| **全栈框架** | Next.js 15 (App Router) |
| **前端 UI** | React 19 + Tailwind CSS 4 |
| **后端运行时** | Node.js (Next.js API Routes) |
| **浏览器自动化** | Playwright (Chromium) |
| **浏览器连接** | CDP (Chrome DevTools Protocol) |
| **任务调度** | node-cron |
| **数据存储** | JSON 文件存储 / Excel (xlsx) |
| **图像处理** | sharp |
| **实时推送** | Server-Sent Events (SSE) |

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
start_chrome.bat
```

**模式二：由 Playwright 自动启动浏览器**
在任务脚本中将 `USE_EXISTING_BROWSER` 设为 `false` 即可。

### 运行管理面板

```bash
# 方式一：双击启动脚本
启动闲鱼助手.bat

# 方式二：开发模式
pnpm dev
# 访问 http://localhost:3000

# 方式三：生产模式
pnpm build && pnpm start
# 访问 http://localhost:3000
```

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
├── app/                           # Next.js 应用目录
│   ├── layout.tsx                 # 根布局
│   ├── page.tsx                   # 首页（管理面板 UI）
│   ├── globals.css                # 全局样式（HeroUI 规范）
│   └── api/                       # API Routes（后端接口）
│       ├── session/
│       │   └── route.ts           # GET/POST/DELETE 登录态管理
│       ├── tasks/
│       │   ├── route.ts           # GET 获取可用任务列表
│       │   └── run/route.ts       # POST 立即运行任务
│       ├── scheduled-tasks/
│       │   ├── route.ts           # GET/POST 定时任务
│       │   └── [id]/route.ts      # PUT/DELETE 单个定时任务
│       ├── logs/route.ts          # GET/DELETE 运行日志
│       └── events/route.ts        # GET SSE 实时事件推送
│
├── lib/
│   ├── api-server.ts              # 后端核心逻辑（任务执行、定时调度、数据存储）
│   ├── session-manager.ts         # 登录态管理器（保存/校验/清除/状态查询）
│   └── types.ts                   # 类型定义（可选）
│
├── .data/                         # 运行时数据（不提交到 Git）
│   └── storage-state.json         # 登录态 Cookie 持久化文件（已 gitignore）
│
├── backend/                       # 后端业务代码
│   ├── tasks/                     # 自动化任务脚本
│   ├── modules/                   # 功能模块
│   ├── utils/                     # 工具库
│   ├── store/                     # 数据存储
│   ├── scripts/                   # 辅助脚本
│   └── examples/                  # 示例脚本
│
├── .clinerules/                   # 开发规范配置
├── package.json                   # 项目配置
├── next.config.ts                 # Next.js 配置
├── tsconfig.json                  # TypeScript 配置
├── .gitignore                     # Git 忽略规则
├── start_chrome.bat               # Chrome 调试模式启动脚本
├── 启动闲鱼助手.bat               # Windows 一键启动脚本
└── create_shortcut.ps1            # 创建桌面快捷方式
```

---

## 登录态管理

详情请参考：`docs/AI-handbook-xianyu-login-session.md`

### 功能概述

登录态管理用于持久化保存闲鱼网站的登录状态 Cookie，使自动化任务可以复用已登录的会话。

- **保存登录态**：启动 Playwright 浏览器（或连接到已有 Chrome）→ 用户在浏览器中完成闲鱼登录 → 导出并保存 Cookie 到本地文件
- **校验登录态**：使用 Playwright 无头浏览器加载已保存的 Cookie，访问闲鱼首页检测是否被重定向到登录页
- **清除登录态**：删除本地的 Cookie 文件
- **状态指示器**：侧边栏实时显示登录状态（已登录/未登录），可点击快速进入登录管理页面

### 登录态文件

- 存储路径：`.data/storage-state.json`
- 已配置 `.gitignore` 自动排除，**请勿提交到 Git 仓库**
- 包含登录后的全部会话 Cookie，请妥善保管

---

## API 速查（Next.js API Routes）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 获取可用任务列表 |
| GET | `/api/scheduled-tasks` | 获取定时任务列表 |
| POST | `/api/scheduled-tasks` | 添加定时任务 |
| PUT | `/api/scheduled-tasks/:id` | 更新定时任务 |
| DELETE | `/api/scheduled-tasks/:id` | 删除定时任务 |
| POST | `/api/tasks/run` | 立即运行指定任务 |
| GET | `/api/logs` | 获取任务运行日志 |
| DELETE | `/api/logs` | 清空日志 |
| GET | `/api/events` | SSE 实时日志推送 |
| **GET** | **`/api/session`** | **查询登录态状态信息** |
| **POST** | **`/api/session`** | **保存/校验/刷新登录态** |
| **DELETE** | **`/api/session`** | **清除登录态** |

---

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 控制台（Dashboard） | 统计概览 + 所有任务列表 + 最近定时任务 |
| `/#schedule` | 定时任务管理 | 增删改查定时任务 |
| `/#logs` | 运行日志 | 实时任务日志查看 |
| `/#session` | 登录管理 | 保存/校验/清除闲鱼登录态 |

（注：采用单页应用模式，通过 Tab 切换不同视图）

---

## 配置说明

### 定时任务

定时任务存储在 `backend/store/scheduled_tasks.json`，支持标准的 cron 表达式。

预设周期：
- `*/5 * * * *` — 每5分钟
- `*/30 * * * *` — 每30分钟
- `0 * * * *` — 每小时
- `0 9 * * *` — 每天9:00
- `0 9,15 * * *` — 每天9:00,15:00
- `0 0 * * *` — 每天午夜

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | Next.js 服务端口 | `3000` |
| `PLAYWRIGHT_HEADED` | 是否显示浏览器窗口 | `true` |
| `STORAGE_STATE_PATH` | 登录态 JSON 存储路径 | `.data/storage-state.json` |

---

## 开发计划

详细开发路线请参考：`docs/roadmap.md`

### 已完成
1. ✅ 废弃旧版 `backend/main.cjs` HTTP 服务器
2. ✅ 升级为 Next.js 全栈一体化架构
3. ✅ REST API 统一管理任务
4. ✅ SSE 实时日志推送
5. ✅ 定时任务管理与持久化
6. ✅ 管理面板（HeroUI 设计规范）
7. ✅ 自动初始化定时任务
8. ✅ 登录态管理功能（保存/校验/清除/状态查询）

### 进行中
1. 🔄 优化数据可视化报表
2. 📝 完善错误处理和日志系统

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
