# 闲鱼自动化助手 (xianyu-master)

> **产品大版本**：v2（Next.js 一体化）  
> **已发布小版本**：v2.0 · v2.1 · v2.1.1  
> **开发中小版本**：v2.2（任务可观测性）  
> **版本规则与任务清单**：[开发路线.md](开发路线.md)
> **项目状态**：已升级为 Next.js 全栈应用

---

## 项目简介

闲鱼自动化助手是一款基于 **Node.js + Playwright** 构建的闲鱼电商运营自动化工具。它能够帮助卖家自动完成店铺数据采集、商品监控、自动回复、批量发布等日常运营操作，大幅提升运营效率。

本项目采用 **Next.js 一体化架构**：
- **`app/api/`** — Next.js API Routes 提供后端 REST API 和 SSE 实时推送
- **`app/page.tsx`** — React 前端页面（HeroUI 设计规范）
- **`lib/api-server.ts`** — 后端核心逻辑（任务执行、定时调度、日志存储）

---

## 文档导航

以下链接用于文档预检查脚本（`.clinerules/hooks/pre-check-docs.py`）校验交叉引用，移动或改名时请同步更新本节。

| 文档 | 链接 |
|------|------|
| 产品需求（PRD） | [产品需求文档-PRD](产品需求文档-PRD.md) |
| 技术方案概要 | [技术方案设计](技术方案设计.md) |
| 开发路线 | [开发路线](开发路线.md) |
| 已完成清单与更新日志 | [已完成阶段详细清单与更新日志](已完成阶段详细清单与更新日志.md) |
| 经验教训 | [经验教训汇总](经验教训汇总.md) |
| 技术栈详情 | [技术栈](技术栈.md) |
| 功能规格（模块与流程） | [功能规格说明](功能规格说明.md) |
| 问题与修复记录 | [问题记录与修复日志](../测试脚本与问题记录/问题记录与修复日志.md) |
| 脚手架说明 | [init-docs-scaffold.py](init-docs-scaffold.py)（交互式生成空白文档树） |
| Harness 评估 | [harness-evaluation.md](harness-evaluation.md) |
| 登录态操作手册 | [AI-handbook-xianyu-login-session](../参考/AI-handbook-xianyu-login-session.md) |
| 开发规范（promot 入口） | [promot.md](../.clinerules/promot.md) |

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
| 📋 功能工作台 | 每任务独立页（历史 / 实时 / 报错） | 🔄 v2.2 接通 |
| 🏭 91 仓库导入 | 无卡密上传 `汇总_资源` 模板 | 📝 v2.3 |
| 📱 手机闲鱼信誉分 | USB 连接后读取 App 设置中的信誉分 | 📝 v2.4 |

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
├── docs/                          # 项目文档（主文档均为中文文件名）
│   ├── README.md                  # 本文件 - 项目概述与文档导航
│   ├── 产品需求文档-PRD.md
│   ├── 技术方案设计.md
│   ├── 开发路线.md
│   ├── 已完成阶段详细清单与更新日志.md
│   ├── 经验教训汇总.md
│   ├── 技术栈.md
│   ├── 功能规格说明.md
│   ├── init-docs-scaffold.py      # 文档脚手架脚本（新项目可复制）
│   └── harness-evaluation.md      # Harness 工程评估
├── 参考/                          # 外部/通用参考（含登录态手册）
│   └── AI-handbook-xianyu-login-session.md
├── 测试脚本与问题记录/
│   ├── 问题记录与修复日志.md
│   └── 归档/
│
├── app/                           # Next.js 应用目录
│   ├── layout.tsx                 # 根布局
│   ├── page.tsx                   # 控制台（Hash 切换定时/日志/登录）
│   ├── features/[slug]/page.tsx   # 各功能独立工作台（历史/实时/报错日志占位）
│   ├── components/                # ConsoleShell、FeatureWorkspace 等
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
│   ├── feature-registry.ts        # 功能模块 slug / 脚本路径注册表
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
├── .clinerules/                   # 开发规范配置（含 ui-spec.md、hooks）
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

详情请参考：[AI-handbook-xianyu-login-session](../参考/AI-handbook-xianyu-login-session.md)

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
| `/` | 控制台（Dashboard） | 统计概览 + 任务列表（**进入工作台**）+ 最近定时任务 |
| `/features/[slug]` | 功能工作台 | 单功能页：历史记录、实时日志、报错日志（占位，见 [功能规格说明](功能规格说明.md)） |
| `/#schedule` | 定时任务管理 | 增删改查定时任务 |
| `/#logs` | 运行日志 | 全局任务日志 |
| `/#session` | 登录管理 | 保存/校验/清除闲鱼登录态 |

侧栏「功能模块」列出全部 slug，与 `lib/feature-registry.ts` 一致。

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

详细开发路线请参考：[开发路线](开发路线.md)

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
