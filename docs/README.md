# 闲鱼自动化助手 (xianyu-master)

> **版本**：v2.0.0（架构转型中）
> **项目状态**：从 Electron 桌面应用 → 本地前后端 Web 方案

---

## 项目简介

闲鱼自动化助手是一款基于 **Node.js + Playwright** 构建的闲鱼电商运营自动化工具。它能够帮助卖家自动完成店铺数据采集、商品监控、自动回复、批量发布等日常运营操作，大幅提升运营效率。

本项目最初以 **Electron 桌面应用** 形态开发，目前正在向 **前后端分离的本地 Web 方案** 转型，以提供更好的可维护性、可扩展性和用户体验。

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

### 当前架构（转型中）

| 层级 | 技术选型 |
|------|---------|
| **后端运行时** | Node.js (ES Modules) |
| **浏览器自动化** | Playwright (Chromium) |
| **浏览器连接** | CDP (Chrome DevTools Protocol) |
| **任务调度** | node-cron |
| **数据存储** | electron-store / Excel (xlsx) |
| **图像处理** | sharp |
| **桌面壳层** | Electron（即将废弃） |
| **前端** | HTML + JavaScript（即将升级） |

### 目标架构（Web 方案）

| 层级 | 技术选型 |
|------|---------|
| **全栈框架** | Next.js (React + API Routes) |
| **前端 UI** | React + Tailwind CSS |
| **浏览器自动化** | Playwright (保持不变) |
| **数据库** | SQLite / JSON 文件存储 |
| **任务调度** | node-cron (保持不变) |
| **数据导出** | xlsx (保持不变) |

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
start_chrome.bat
```

**模式二：由 Playwright 自动启动浏览器**
在任务脚本中将 `USE_EXISTING_BROWSER` 设为 `false` 即可。

### 运行任务

```bash
# 方式一：通过命令行交互菜单启动
npm start

# 方式二：直接运行特定任务脚本
node tasks/get_shop_review_data.js
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
├── tasks/                         # 自动化任务脚本
│   ├── auto_chat_link.js          # 自动聊天链接
│   ├── auto_reply.js              # 自动回复
│   ├── get_feishu_chat_links.js   # 飞书聊天链接获取
│   ├── get_shop_link_date_data.js # 店铺链接日期数据
│   ├── get_shop_links.js          # 获取店铺链接
│   ├── get_shop_review_data.js    # 店铺每日售出数据
│   ├── process_image.js           # 图片处理
│   ├── process_link_cozi.js       # 链接资源处理
│   ├── publish_links.js           # 发布链接
│   └── search_shop_links_by_keyword.js  # 关键词搜索
│
├── modules/                       # 功能模块
│   ├── shop_data/                 # 店铺数据模块
│   │   └── shop_data.js           # 店铺页面操作核心逻辑
│   ├── chat_page/                 # 聊天页面模块
│   │   └── chat_page.js
│   ├── aqisuo/                    # 阿奇索模块
│   │   └── aqisuo.js
│   ├── feishu/                    # 飞书集成模块
│   │   └── feishu.js
│   ├── kouzi/                     # 口子模块
│   │   └── kouzi.js
│   └── image/                     # 图像资源模块
│       └── image.js
│
├── utils/                         # 工具库
│   ├── browser.js                 # 浏览器管理（核心 - Browser 类）
│   ├── chrome_remote_debug.js     # Chrome 远程调试连接
│   ├── color.js                   # 颜色工具
│   ├── dir.js                     # 目录工具
│   ├── extract_like_links.js      # 链接提取工具
│   ├── file.js                    # 文件操作（含 Excel 导出）
│   ├── html-to-image.js           # HTML 转图片
│   ├── image.js                   # 图像处理工具
│   └── utils.js                   # 通用工具函数
│
├── store/                         # 数据存储
│   ├── index.js                   # 存储接口
│   └── publish_records.json.example  # 发布记录示例
│
├── input/                         # 输入数据目录
├── output/                        # 输出结果目录
│
├── frontend/                      # 前端代码（Electron 渲染进程）
│   ├── index.html                 # 主界面（HeroUI 风格 UI）
│   └── preload.js                 # Electron 预加载脚本
│
├── backend/                       # 后端代码（Electron 主进程）
│   └── main.js                    # Electron 主进程入口
│
├── menu.js                        # CLI 菜单入口
├── package.json                   # 项目配置
└── pnpm-workspace.yaml            # pnpm 工作区配置
```

---

## API 速查

### 浏览器管理 (`utils/browser.js`)

| 方法 | 说明 |
|------|------|
| `launchBrowser()` | 启动新 Playwright 浏览器实例 |
| `connectToExistingBrowser(port)` | 通过 CDP 连接本机已有 Chrome |
| `navigateWithRetry(url)` | 导航到 URL，失败自动重试 |
| `openNewPage()` | 创建新页面 |
| `closePage()` | 关闭当前页面 |
| `recreateContext()` | 重建浏览器上下文 |

### 店铺数据 (`modules/shop_data/shop_data.js`)

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
| `PLAYWRIGHT_HEADED` | 是否显示浏览器窗口 | `true` |
| `STORAGE_STATE_PATH` | 登录态 JSON 存储路径 | `.data/storage-state.json` |

---

## 开发计划

目前项目正在进行 **架构转型**，详细开发路线请参考：`docs/roadmap.md`

### 近期目标

1. ✅ 废弃 Electron 桌面壳层
2. 🔄 搭建 Next.js 全栈应用 (App Router + API Routes)
3. 📝 开发 React 前端管理界面 (shadcn/ui + Tailwind CSS)
4. 🔄 实现 API Routes 统一管理任务
5. 📝 添加 SSE 实时日志推送
6. 📝 优化数据可视化报表 (Recharts)

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
