# 闲鱼自动化助手 - UI 设计规范文档

> **文档版本**：v1.0
> **更新日期**：2026-05-11
> **参考模板**：HeroUI Design System
> **目标贴合度**：≥90%

---

## 1. 设计哲学

### 1.1 核心原则

| 原则 | 说明 |
|------|------|
| **简洁克制** | 去除一切不必要的视觉噪音，让用户聚焦于数据和操作 |
| **层级清晰** | 通过颜色深度、阴影、间距建立明确的信息层级 |
| **一致统一** | 所有组件共享同一套设计令牌（Design Tokens），确保视觉语言统一 |
| **无障碍优先** | 焦点环、对比度、键盘导航遵循 WCAG 2.1 AA 标准 |
| **动效克制** | 使用短时长、平滑的过渡动画，尊重用户 `prefers-reduced-motion` 设置 |

### 1.2 设计参考基准

本规范基于 **HeroUI** 设计系统制定。HeroUI 是一个面向 React Aria 的组件库，其设计核心特征为：

- 使用 **oklch 色彩空间** 进行颜色管理
- 基于 **4px 基准网格** 的间距体系
- **BEM 命名规范** 的 CSS 架构
- **Tailwind CSS** 作为底层工具链
- 组件状态（hover / pressed / focus / disabled / invalid）有明确定义的视觉表现

---

## 2. 色彩系统

### 2.1 基础色板（Light Mode）

所有颜色使用 **oklch** 色彩空间，保证在不同显示设备上的色彩一致性。

```
/* === 基础色 === */
--white:            oklch(100% 0 0)
--black:            oklch(0% 0 0)
--snow:             oklch(0.9911 0 0)
--eclipse:          oklch(0.2103 0.0059 285.89)   /* 最深文本色 */

/* === 语义色 === */
--background:       oklch(0.9702 0 0)              /* 页面底色 - 极浅灰 */
--foreground:       oklch(0.2103 0.0059 285.89)    /* 主文本色 ≈ #1A1A2E */
--accent:           oklch(0.6204 0.195 253.83)     /* 主题色 - 蓝色系 */
--accent-foreground: oklch(100% 0 0)               /* 主题色上的文本 = 白色 */

--success:          oklch(0.7329 0.1935 150.81)    /* 成功 - 绿色系 */
--success-foreground: oklch(0.2103 0.0059 285.89)
--warning:          oklch(0.7819 0.1585 72.33)     /* 警告 - 黄色系 */
--warning-foreground: oklch(0.2103 0.0059 285.89)
--danger:           oklch(0.6532 0.2328 25.74)     /* 危险 - 红色系 */
--danger-foreground: oklch(100% 0 0)

--muted:            oklch(0.5517 0.0138 285.94)    /* 次要文本/占位符 */
--border:           oklch(90% 0.004 286.32)        /* 边框 */
--separator:        oklch(92% 0.004 286.32)        /* 分割线 */
```

### 2.2 表面层级色（Surface Levels）

用于区分不同层级的容器组件：

```
--surface:           oklch(100% 0 0)               /* 一级表面 - 白色卡片 */
--surface-secondary: oklch(0.9524 0.0013 286.37)   /* 二级表面 - 浅灰卡片 */
--surface-tertiary:  oklch(0.9373 0.0013 286.37)   /* 三级表面 - 更深的灰 */
--overlay:           oklch(100% 0 0)               /* 浮层表面（弹窗/菜单） */
```

### 2.3 色板映射（从旧版 → 新版）

| 旧版 CSS 变量 | 旧版颜色值 | 新版映射 | 新版 oklch 值 | 用途 |
|---------------|-----------|---------|--------------|------|
| `--primary` | `#4f46e5` | `--accent` | `oklch(0.6204 0.195 253.83)` | 主题色/主按钮 |
| `--primary-hover` | `#4338ca` | `--accent-hover` | 比 accent 亮度 -5% | 主按钮悬停 |
| `--success` | `#10b981` | `--success` | `oklch(0.7329 0.1935 150.81)` | 成功状态 |
| `--danger` | `#ef4444` | `--danger` | `oklch(0.6532 0.2328 25.74)` | 危险操作 |
| `--warning` | `#f59e0b` | `--warning` | `oklch(0.7819 0.1585 72.33)` | 警告状态 |
| `--gray-50` ~ `--gray-900` | Tailwind Gray | 映射为 surface/default 系 | - | 背景/文本层级 |

### 2.4 暗色模式（Dark Mode）

数据看板类页面支持暗色模式切换：

```
--background:       oklch(12% 0.005 285.823)       /* 接近纯黑 */
--foreground:       oklch(100% 0 0)                /* 纯白文本 */
--surface:          oklch(0.2103 0.0059 285.89)    /* 深色卡片 */
--surface-secondary: oklch(0.257 0.0037 286.14)
--surface-tertiary:  oklch(0.2721 0.0024 247.91)
--overlay:          oklch(0.2103 0.0059 285.89)
--border:           oklch(28% 0.006 286.033)
```

---

## 3. 间距系统

### 3.1 基准网格

所有间距遵循 **4px 基准网格**，由 `--spacing: 0.25rem` 变量定义。

| 令牌名 | CSS值 | 像素值 | 典型用途 |
|--------|-------|--------|---------|
| `--spacing` | `0.25rem` | 4px | 基准单位 |
| `--space-1` | `0.25rem` | 4px | 图标与文本间距 |
| `--space-2` | `0.5rem` | 8px | 元素内间距 |
| `--space-3` | `0.75rem` | 12px | 组件间紧凑间距 |
| `--space-4` | `1rem` | 16px | Card padding、Form 间距 |
| `--space-5` | `1.25rem` | 20px | 部分区段间距 |
| `--space-6` | `1.5rem` | 24px | Modal body、页面 padding |
| `--space-8` | `2rem` | 32px | 大区块间距 |
| `--space-10` | `2.5rem` | 40px | 页面顶部留白 |

### 3.2 应用规则

- 卡片内部 padding 统一为 `16px`（`p-4`）
- 表单字段之间间隔 `16px`
- 按钮组内按钮间隔 `8px`（`gap-2`）
- 页面内容区 padding `24px`
- 侧边栏导航项 padding `10px 20px`

---

## 4. 圆角系统

### 4.1 圆角令牌

```
--radius:       0.5rem   (8px)    /* 默认圆角 - 用于按钮、输入框等 */
--radius-lg:    0.75rem  (12px)   /* 较大圆角 - 用于 Card */
--radius-xl:    1rem     (16px)   /* 大圆角 */
--radius-2xl:   1.25rem  (20px)
--radius-3xl:   1.5rem   (24px)   /* 最大圆角 - 用于 Modal、大的 Surface */
--field-radius: calc(var(--radius) * 1.5) = 12px  /* 表单字段专用圆角 */
```

### 4.2 组件圆角规范

| 组件 | 圆角值 | 说明 |
|------|--------|------|
| Button | `--radius`（8px） | 全圆角药丸形（`rounded-3xl` ≈ 24px） |
| Card | `min(32px, var(--radius-3xl))` | 大圆角卡片 |
| Input / Select | `--field-radius`（12px） | 比默认更大，更柔和 |
| Modal / Dialog | `min(32px, var(--radius-3xl))` | 弹窗大圆角 |
| Tab 组 | `calc(var(--radius) * 2.5)` | 20px 圆角 |
| Badge / Tag | `--radius`（8px） | 小胶囊形 |
| Toggle Switch | 全圆角（`border-radius: 22px`） | 胶囊形 |

---

## 5. 阴影系统

### 5.1 阴影层级

```
/* Surface 阴影 - 用于非浮层组件（卡片） */
--surface-shadow:
  0 2px 4px 0 rgba(0, 0, 0, 0.04),
  0 1px 2px 0 rgba(0, 0, 0, 0.06),
  0 0 1px 0 rgba(0, 0, 0, 0.06);

/* Overlay 阴影 - 用于浮层组件（弹窗、下拉菜单） */
--overlay-shadow:
  0 2px 8px 0 rgba(0, 0, 0, 0.06),
  0 -6px 12px 0 rgba(0, 0, 0, 0.03),
  0 14px 28px 0 rgba(0, 0, 0, 0.08);

/* Field 阴影 - 用于表单输入框 */
--field-shadow:
  0 2px 4px 0 rgba(0, 0, 0, 0.04),
  0 1px 2px 0 rgba(0, 0, 0, 0.06),
  0 0 1px 0 rgba(0, 0, 0, 0.06);
```

### 5.2 暗色模式阴影

```
--surface-shadow: 0 0 0 0 transparent inset;   /* 暗色下无 surface 阴影 */
--overlay-shadow: 0 0 1px 0 rgba(255, 255, 255, 0.3) inset;  /* 暗色下用内发光替代 */
--field-shadow: 0 0 0 0 transparent inset;
```

### 5.3 阴影应用规范

| 组件 | 使用阴影 | 说明 |
|------|---------|------|
| Card | `shadow-surface` | 轻微凸起感 |
| Modal 弹窗 | `shadow-overlay` | 明显浮层感 |
| 下拉菜单 / Popover | `shadow-overlay` | 浮层感 |
| Input / Select | `shadow-field` | 轻微内凹感 |

---

## 6. 字体规范

### 6.1 字体族

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
             'Helvetica Neue', Arial, sans-serif;

--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
             'Consolas', 'Monaco', 'Courier New', monospace;
```

### 6.2 字号与行高

| 层级 | 字号 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| **标题 1** | `20px` | `1.4` | `600` (Semibold) | 页面主标题 |
| **标题 2** | `18px` | `1.4` | `600` | 侧边栏标题 |
| **标题 3** | `16px` | `1.5` | `600` | 卡片标题 |
| **正文** | `14px` | `1.5` | `400` (Regular) | 正文、表格内容 |
| **小字** | `13px` | `1.5` | `400` | 卡片辅助描述 |
| **微小** | `12px` | `1.5` | `400` | 标签、辅助信息 |
| **超小** | `11px` | `1.4` | `500` | 侧边栏 footer |
| **代码** | `13px` | `1.6` | `400` | 日志/代码展示 |

### 6.3 字重规范

| 字重 | CSS值 | 使用场景 |
|------|-------|---------|
| Regular | `400` | 正文、描述文本 |
| Medium | `500` | 按钮、标签、导航项、辅助信息 |
| Semibold | `600` | 标题、卡片标题、强调文本 |
| Bold | `700` | 侧边栏 Logo、关键数据指标 |

---

## 7. 组件规范

### 7.1 按钮 (Button)

采用 HeroUI 的按钮设计风格：**全圆角药丸形 + 清晰的颜色变体**。

#### 7.1.1 尺寸规格

| 尺寸 | 高度 | 水平内边距 | 字号 | 图标尺寸 |
|------|------|-----------|------|---------|
| **sm** | `36px` (h-9) | `12px` (px-3) | `14px` | `16px` |
| **md（默认）** | `40px` (h-10) | `16px` (px-4) | `14px` | `20px` |
| **lg** | `44px` (h-11) | `16px` (px-4) | `16px` | `20px` |

#### 7.1.2 颜色变体

| 变体 | 背景色 | 文字色 | 悬停背景 | 按下效果 |
|------|--------|--------|---------|---------|
| **primary** | `--accent` | `--accent-foreground`（白） | 加深 5% | `scale(0.97)` |
| **secondary** | `--default` | `--accent` | 加深 | `scale(0.97)` |
| **danger** | `--danger` | `--danger-foreground`（白） | 加深 5% | `scale(0.97)` |
| **ghost** | 透明 | `--foreground` | `--default`（浅灰） | `scale(0.97)` |
| **outline** | 透明 | `--foreground` | `--default`（浅灰） | `scale(0.97)` |

#### 7.1.3 视觉特征

```
┌─────────────────────────────────────────┐
│  [icon]  按钮文字  [icon]               │  ← 圆角 3xl（全圆角药丸形）
└─────────────────────────────────────────┘
  • 字体: medium (500)
  • 图标与文字间距: 8px (gap-2)
  • 过渡: transform 250ms, background-color 100ms, box-shadow 100ms
  • 禁用态: opacity 0.5, cursor not-allowed, pointer-events none
  • 聚焦态: ring-2 ring-focus (与元素间隔 2px)
  • hover 按下: scale(0.97)
```

#### 7.1.4 纯图标按钮

```
┌──────┐
│ icon │  ← 宽高相等 (w-10 h-10)，padding 0
└──────┘
```

### 7.2 卡片 (Card)

#### 7.2.1 结构

```
┌──────────────────────────────────────┐
│  Card Header (标题 + 操作区)         │  ← p-4, border-bottom
├──────────────────────────────────────┤
│                                      │
│  Card Body (内容区)                  │  ← p-4, flex-1
│                                      │
├──────────────────────────────────────┤
│  Card Footer (按钮组等)              │  ← p-4, border-top
└──────────────────────────────────────┘
```

#### 7.2.2 视觉规范

```
• 背景: var(--surface)（白色）
• 阴影: shadow-surface
• 圆角: min(32px, var(--radius-3xl)) 即 24px
• 标题: 14px, semibold, foreground 色
• 描述: 14px, muted 色
• 内容间距: gap-3 (12px)
• 卡片间距: margin-bottom 20px
```

#### 7.2.3 变体

| 变体 | 背景 | 用途 |
|------|------|------|
| `default` | `--surface`（白） | 主要卡片 |
| `secondary` | `--surface-secondary`（浅灰） | 次级卡片/内嵌卡片 |
| `tertiary` | `--surface-tertiary`（深灰） | 三级卡片 |
| `transparent` | 透明 | 无边框纯内容卡片 |

### 7.3 输入框 (Input / Select / Textarea)

#### 7.3.1 视觉规范

```
┌─────────────────────────────────────┐
│  placeholder 文本...                │  ← 12px 圆角，field-shadow
└─────────────────────────────────────┘
  • 背景: var(--field-background)（白色）
  • 文字颜色: var(--field-foreground)
  • 占位符颜色: var(--muted)
  • 边框: field-border-width (默认 0，无可见边框)
  • 圆角: var(--field-radius) = 12px
  • 内边距: px-3 py-2 (12px 8px)
  • 字号: 14px (base) / 13px (sm)
```

#### 7.3.2 状态

| 状态 | 视觉表现 |
|------|---------|
| **默认** | 白色背景，field-shadow |
| **Hover** | 背景微变 + 边框颜色变化 |
| **Focus** | `ring-2 ring-focus`（2px 主题色光圈，无偏移） |
| **Invalid** | `outline-1 outline-danger`（未聚焦）/ `ring-2 ring-danger`（聚焦）|
| **Disabled** | 整体 `opacity: 0.5`，`cursor: not-allowed` |

#### 7.3.3 Select 特殊规范

- 使用系统原生下拉箭头（`appearance: auto`）
- 下拉选项菜单采用 `shadow-overlay`，圆角 `--radius`
- 选项 hover 高亮为 `--default` 色

### 7.4 模态框 (Modal / Dialog)

#### 7.4.1 结构

```
┌──────────────────────────────────┐
│  [icon]  标题文字           [✕]  │  ← Header：flex, gap-3
├──────────────────────────────────┤
│                                  │
│  正文内容区域                     │  ← Body：text-sm, text-muted
│                                  │     my-0（由上下文控制间距）
├──────────────────────────────────┤
│              [取消]  [确认]       │  ← Footer：justify-end, gap-2
└──────────────────────────────────┘
```

#### 7.4.2 视觉规范

```
• 背景: var(--overlay)（白色）
• 阴影: shadow-overlay
• 圆角: min(32px, var(--radius-3xl)) ≈ 24px
• 宽度: max-w-xs(320px) / sm(384px) / md(448px) / lg(512px)
• Padding: 24px (p-6)
• 标题: 16px (text-base), medium (font-medium), foreground 色
• 正文: 14px (text-sm), leading-[1.43], muted 色
```

#### 7.4.3 遮罩层 (Backdrop)

```
• 位置: fixed inset-0 z-50
• 背景: rgba(0, 0, 0, 0.5)
• 可选毛玻璃: backdrop-blur-md
• 进入动画: fade-in 150ms ease-out
• 退出动画: fade-out 100ms ease-out
```

#### 7.4.4 模态框动画

```
• 进入: fade-in + zoom-in-105 (250ms ease-out-quad)
  - 底部弹出时: slide-in-from-bottom-1
• 退出: fade-out + zoom-out-95 (100ms ease-out-quad)
• 遵循 motion-reduce: 动画设为 none
```

### 7.5 标签页 (Tabs)

#### 7.5.1 Primary 变体（胶囊式）

```
  ┌──────────┬──────────┬──────────┐
  │  Tab 1   │  Tab 2   │  Tab 3   │  ← 整体 bg-default（浅灰底）
  └──────────┴──────────┴──────────┘
       ↑ 选中项有白色胶囊滑块
```

**规范**：
- Tab 列表：`bg-default`（浅灰底）+ `p-1` + 圆角 `calc(var(--radius) * 2.5)` ≈ 20px
- 单个 Tab：高度 `32px`（h-8），全圆角药丸形，字号 `14px` medium
- 选中态：`text-foreground`（深色文字），背景胶囊由 React Aria `SelectionIndicator` 渲染
- 未选中态：`text-muted`（灰色文字），hover 时 `opacity-70`
- 分隔线：`1px` 宽，`50%` 高，垂直居中

#### 7.5.2 Secondary 变体（下划线式）

```
  Tab 1    Tab 2    Tab 3
  ────                ← 选中项下方有 2px 主题色下划线
  ────────────────────  ← 整体底部有 border 分隔线
```

**规范**：
- Tab 列表：`bg-transparent`，底部 `border-b border-border`
- 选中指示器：`2px` 高，`bg-accent`（主题色），无阴影
- 支持横向滚动（`overflow-x: auto`）

### 7.6 表格 (Table)

#### 7.6.1 视觉规范

```
┌──────────────────────────────────────────────────────┐
│  TH 标题1    │  TH 标题2    │  TH 标题3    │  TH    │  ← 12px, uppercase, muted
├──────────────────────────────────────────────────────┤
│  TD 内容     │  TD 内容     │  TD 内容     │  TD    │  ← 14px
├──────────────────────────────────────────────────────┤
│  TD 内容     │  TD 内容     │  TD 内容     │  TD    │  ← hover: bg-hover
└──────────────────────────────────────────────────────┘
```

**规范**：
- 表头：`12px`，大写，`text-muted`，`font-semibold`，`border-bottom: 2px solid var(--border)`
- 单元格：`14px`，`padding: 12px`，`border-bottom: 1px solid var(--border)`（可选浅色分割线）
- 行悬停：背景变为 `var(--surface-secondary)`（浅灰）
- 圆角：表格整体不设圆角（由外层 Card 包裹提供圆角）

### 7.7 徽章 (Badge / Tag)

#### 7.7.1 视觉规范

```
  ┌──────────┐
  │ ● 状态文字 │  ← 小胶囊形
  └──────────┘
```

| 变体 | 背景色 | 文字色 | 圆点色 | 用途 |
|------|--------|--------|--------|------|
| **success** | `--success-soft`（绿色浅底） | `--success-foreground` | `--success` | 成功/活跃状态 |
| **danger** | `--danger-soft`（红色浅底） | `--danger-foreground` | `--danger` | 失败/危险状态 |
| **warning** | `--warning-soft`（黄色浅底） | `--warning-foreground` | `--warning` | 警告状态 |
| **neutral** | `--default`（灰色浅底） | `--foreground` | `--muted` | 中性/默认状态 |

**规范**：
- 内边距：`3px 8px`
- 圆角：`--radius`（8px）
- 字号：`12px`，字重 `500`
- 可选状态圆点：`6px` 直径，间距 `4px`

### 7.8 开关 (Toggle Switch)

```
  ┌────┐         ┌────────┐
  │ ◉  │  关闭    │    ●   │  开启   ← 胶囊形
  └────┘         └────────┘
  ← 22px →           ← 40px → × 22px
```

**规范**：
- 关闭态：`bg-gray-300`（灰底），圆球靠左
- 开启态：`bg-success`（绿色底），圆球靠右
- 圆球：`16px` 直径，白色，距边缘 `3px`
- 过渡：`300ms`

### 7.9 侧边栏导航 (Sidebar)

HeroUI 风格适配方案：**暗色侧边栏 + 亮色内容区**。

#### 7.9.1 侧边栏规范

```
┌─────────────────────────┐
│  ⚡ Logo / 应用名        │  ← Header: px-5 py-5, border-bottom
│  v2.0                   │
├─────────────────────────┤
│  📊  控制台              │  ← NavItem: px-5 py-2.5, gap-2.5
│  📋  任务列表            │     选中: bg-accent/15, 左侧 3px accent 色条
│  ⏰  定时任务            │     未选: 透明, text-muted
│  📜  运行日志            │     hover: bg-white/5
│  📈  数据看板            │
│  ⚙️  系统设置            │
├─────────────────────────┤
│  闲鱼自动化助手 v2.0     │  ← Footer: text-xs, muted, center
└─────────────────────────┘
```

**规范**：
- 宽度：`240px`（桌面端）/ `60px`（移动端折叠态）
- 背景：`--eclipse`（`oklch(0.2103 ...)` ≈ 深暗蓝 ≈ `#1a1a2e`）
- 品牌色强调：`--accent` 用于选中指示器和版本标签
- 导航项高度：`40px`，圆角 `8px`（在 HeroUI 中是 `rounded-lg`）
- 间距：导航项之间 `2px` 间距
- 图标：`18px` 大小，宽度 `24px`（保证对齐）

### 7.10 顶部栏 (Top Bar)

```
┌──────────────────────────────────────────────┐
│  页面标题                           [操作按钮] │  ← px-6 py-4
└──────────────────────────────────────────────┘
```

**规范**：
- 背景：`--surface`（白色）
- 底部边框：`1px solid var(--border)`
- 标题字号：`20px`，`semibold`
- 操作按钮：`btn-sm`（高度 36px）

### 7.11 统计卡片 (Stat Card)

```
┌─────────────────┐
│       128       │  ← 28px, bold, accent 色
│    总任务数      │  ← 13px, muted 色
└─────────────────┘
```

**规范**：
- 背景：`--surface`（白色）
- 阴影：`shadow-surface`
- 圆角：`--radius-lg`（12px）
- 内边距：`20px`
- 数值：`28px`，`bold`，颜色可变（primary/success/warning）
- 标签：`13px`，`text-muted`

### 7.12 日志控制台 (Log Console)

```
┌────────────────────────────────────────────┐
│ [10:30] tasks/xxx.js → ✓ 成功              │
│ [10:32] tasks/yyy.js → ✗ 失败              │  ← 暗色终端风格
│     错误详情: Connection refused           │
│ [10:35] tasks/zzz.js → 运行中...           │
└────────────────────────────────────────────┘
```

**规范**：
- 背景：`#1a1b26`（Tokyo Night 主题暗色）
- 文字：`13px`，等宽字体（JetBrains Mono / Fira Code）
- 行高：`1.6`
- 内边距：`16px`
- 圆角：`--radius`（8px）
- 最大高度：`400px`，溢出滚动
- 日志级别颜色：
  - 时间戳：`#565f89`（深灰蓝）
  - 信息：`#7dcfff`（浅蓝）
  - 成功：`#9ece6a`（绿色）
  - 错误：`#f7768e`（红色）
  - 警告：`#e0af68`（黄色）

### 7.13 空状态 (Empty State)

```
         ┌─────┐
         │ 📦  │  ← 48px 大图标
         └─────┘
    暂无定时任务，点击上方按钮创建
        ← 14px, text-muted, text-center
```

**规范**：
- 内边距：`40px 20px`
- 图标：`48px`，下方间距 `12px`
- 文字：`14px`，`text-muted`，居中

### 7.14 Toast 通知

```
                                            ┌─────────────────────┐
                                            │ ✓ 任务已创建        │  ← 动画从右侧滑入
                                            └─────────────────────┘
```

**规范**：
- 定位：`fixed, top: 20px, right: 20px, z-index: 2000`
- 背景：按类型着色（success=绿, error=红, info=主题色）
- 文字：`14px`，白色
- 内边距：`12px 20px`
- 圆角：`--radius`（8px）
- 阴影：`shadow-md`
- 动画：`slideIn` 从右侧滑入，`300ms`
- 自动消失：`3s`

---

## 8. 页面布局规范

### 8.1 整体布局（App Shell）

```
┌──────────┬────────────────────────────────────────────┐
│          │  Top Bar                                   │
│          ├────────────────────────────────────────────┤
│ Sidebar  │                                            │
│ 240px    │  Page Content                              │
│          │  (padding: 24px, overflow-y: auto)         │
│          │                                            │
│          │                                            │
└──────────┴────────────────────────────────────────────┘
```

### 8.2 页面内容区布局

#### 仪表盘（Dashboard）

```
┌──────────────────────────────────────────────────────┐
│  [统计卡片1] [统计卡片2] [统计卡片3] [统计卡片4]       │  ← stats-row
├──────────────────────────────────────────────────────┤
│  Card: 快速运行                                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │任务卡片1│ │任务卡片2│ │任务卡片3│ │任务卡片4│        │  ← task-grid
│  └────────┘ └────────┘ └────────┘ └────────┘        │
├──────────────────────────────────────────────────────┤
│  Card: 最近的定时任务                                  │
│  ┌──────────────────────────────────────┐            │
│  │ 表格（名称/周期/上次/下次/状态）       │            │
│  └──────────────────────────────────────┘            │
└──────────────────────────────────────────────────────┘
```

#### 任务列表（Tasks）

```
┌──────────────────────────────────────────────────────┐
│  Card: 所有可用任务 (共 N 个)                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │任务卡片 │ │任务卡片 │ │任务卡片 │ │任务卡片 │        │  ← 自动填充网格
│  │        │ │        │ │        │ │        │        │     最小 280px
│  │▶ 立即  │ │▶ 立即  │ │▶ 立即  │ │▶ 立即  │        │
│  │⏰ 定时  │ │⏰ 定时  │ │⏰ 定时  │ │⏰ 定时  │        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
└──────────────────────────────────────────────────────┘
```

#### 定时任务（Schedules）

```
┌──────────────────────────────────────────────────────┐
│  Card: 定时任务管理                [➕ 新建定时任务]   │
│  ┌────────────────────────────────────────────────┐  │
│  │ 表格（启用/任务名/脚本路径/Cron/上次执行/操作）  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

#### 运行日志（Logs）

```
┌──────────────────────────────────────────────────────┐
│  Card: 运行日志               [🔄 刷新] [🗑 清空]    │
│  ┌────────────────────────────────────────────────┐  │
│  │ [10:30] tasks/xxx.js → ✓ 成功                  │  │
│  │ [10:32] tasks/yyy.js → ✗ 失败                  │  │
│  │                                               │  │
│  │ (暗色终端风格日志区)                             │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

#### 数据看板（Data）

```
┌──────────────────────────────────────────────────────┐
│  Card: 数据趋势                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  [日期范围选择器]  [指标选择器]                  │  │
│  │  ┌──────────────────────────────────────┐      │  │
│  │  │         图表区域（Chart）              │      │  │
│  │  └──────────────────────────────────────┘      │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  Card: 数据导出                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  [导出选项] [格式选择] [📥 导出Excel]          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

#### 系统设置（Settings）

```
┌──────────────────────────────────────────────────────┐
│  Card: 浏览器设置                                    │
│  ┌────────────────────────────────────────────────┐  │
│  │  运行模式:  [CDP 连接] / [独立启动]              │  │
│  │  CDP 端口:  [9222]                             │  │
│  │  自动启动Chrome: [Toggle Switch]                │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  Card: 存储设置                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  数据目录:  [./data]                           │  │
│  │  ...                                          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 9. 任务卡片组件详细规范

任务卡片是项目中使用频率最高的复合组件，需要独立详细规范。

### 9.1 任务卡片结构

```
┌──────────────────────────────────────┐
│  📋  采集店铺每日售出数量              │  ← 任务名称: 14px, semibold
│  tasks/get_shop_review_data.js       │  ← 脚本路径: 12px, text-muted
│                                      │
│  [▶ 立即运行]  [⏰ 定时]              │  ← 操作区: 12px 上间距, gap-2
└──────────────────────────────────────┘
```

### 9.2 视觉规范

```
• 背景: var(--surface)（白色）
• 边框: 1px solid var(--border)
• 圆角: var(--radius)（8px）
• 内边距: 16px
• 过渡: all 200ms
• 悬停效果:
  - 阴影变为 shadow-md
  - 边框色变为 accent
  - translateY(-1px)（轻微上浮）
  - 鼠标变为 cursor-pointer
```

---

## 10. 交互与动效规范

### 10.1 过渡时间

| 类型 | 时长 | 缓动函数 | 应用场景 |
|------|------|---------|---------|
| 颜色变化 | `100ms` | `ease-out` | 按钮背景、边框颜色 |
| 背景色变化 | `150ms` | `ease-smooth` | 输入框、Tab 背景 |
| 变换（缩放） | `250ms` | `ease-smooth` | 按钮按下效果 |
| 变换（位置） | `250ms` | `ease-out-fluid` | Tab 指示器滑动 |
| 淡入淡出 | `150ms` | `ease-out` | Modal 遮罩 |
| 缩放进入 | `250ms` | `ease-out-quad` | Modal 内容 |
| 缩放退出 | `100ms` | `ease-out-quad` | Modal 退出 |

### 10.2 缓动函数定义

```css
--ease-smooth:    cubic-bezier(0.4, 0, 0.2, 1);     /* 标准缓动 */
--ease-out:       cubic-bezier(0, 0, 0.2, 1);        /* 减速缓动 */
--ease-out-quad:  cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-out-fluid: cubic-bezier(0.33, 1, 0.68, 1);    /* 弹性缓动 */
```

### 10.3 交互反馈

| 交互 | 反馈效果 |
|------|---------|
| 按钮 Hover | 背景色加深 / 出现背景色（ghost/outline） |
| 按钮 Press | `scale(0.97)`，背景色进一步加深 |
| 输入框 Focus | `ring-2 ring-focus`（2px 主题色光圈） |
| 输入框 Invalid | `outline-1 outline-danger` |
| 卡片 Hover | 阴影增强 + 边框变色 + 上浮 1px |
| 导航项 Hover | 背景 `rgba(255,255,255,0.05)` |
| 开关 Toggle | 300ms 圆球滑动 + 背景色切换 |
| Tab 切换 | 250ms 指示器滑动 |
| Modal 打开 | 遮罩 150ms 淡入 + 内容 250ms 缩放进入 |
| Toast 出现 | 300ms 从右侧滑入 |

### 10.4 无障碍动效

```css
/* 尊重用户系统偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none !important;
    animation: none !important;
  }
}
```

### 10.5 焦点指示器

```
• 聚焦环: ring-2 ring-focus (2px 主题色实线圈)
• 偏移: ring-offset-0 (紧贴元素)
• 默认聚焦可见: :focus-visible (仅键盘导航时显示)
• 键盘 Tab 导航顺序需合理（逻辑顺序）
```

---

## 11. 资源引用

### 11.1 图标方案

推荐使用 **Lucide Icons**（HeroUI 使用的图标库）或等价 **SVG 内联图标**：

- 图标尺寸：`16px` / `20px` / `24px`
- 颜色继承当前文本色（`currentColor`）
- 图标与文字间距：`8px`（`gap-2`）
- 纯图标按钮：`16px`（sm）/ `20px`（md）/ `24px`（lg）

### 11.2 常用图标映射

| 功能 | Lucide 图标 | 备用 Emoji |
|------|-----------|-----------|
| 控制台/仪表盘 | `LayoutDashboard` | 📊 |
| 任务列表 | `ListTodo` | 📋 |
| 定时任务 | `Clock` | ⏰ |
| 运行日志 | `ScrollText` | 📜 |
| 数据看板 | `BarChart3` | 📈 |
| 系统设置 | `Settings` | ⚙️ |
| 运行 | `Play` | ▶ |
| 停止 | `Square` | ⏹ |
| 刷新 | `RotateCw` | 🔄 |
| 删除 | `Trash2` | 🗑️ |
| 编辑 | `Pencil` | ✏️ |
| 添加 | `Plus` | ➕ |
| 关闭 | `X` | ✕ |
| 成功 | `CircleCheck` | ✓ |
| 失败 | `CircleX` | ✗ |
| 警告 | `TriangleAlert` | ⚠ |
| 导出 | `Download` | 📥 |
| 搜索 | `Search` | 🔍 |

---

## 12. 实现检查清单

转型开发时，需逐项确认以下内容：

### 12.1 设计令牌层
- [ ] CSS 变量全部替换为 oklch 色彩空间
- [ ] 间距系统统一为 4px 基准网格
- [ ] 圆角系统使用统一的 `--radius` 变量体系
- [ ] 阴影系统使用三层定义（surface / overlay / field）
- [ ] 暗色模式变量完整定义

### 12.2 组件层
- [ ] Button 符合全圆角药丸形 + 5 种变体规范
- [ ] Card 符合大圆角 + shadow-surface 规范
- [ ] Input/Select/Textarea 符合 field-radius + field-shadow 规范
- [ ] Modal 符合 overlay-shadow + 动画规范
- [ ] Tabs 支持 primary（胶囊）和 secondary（下划线）两种变体
- [ ] Table 表头样式统一
- [ ] Badge/Tag 符合胶囊形 + 状态色规范
- [ ] Toggle Switch 符合胶囊形 + 300ms 切换动画
- [ ] Log Console 暗色终端风格
- [ ] Empty State 居中显示规范
- [ ] Toast 右侧滑入动画 + 3s 自动消失

### 12.3 页面层
- [ ] 侧边栏暗色主题 + 选中指示器
- [ ] 顶部栏白色背景 + 底部边框
- [ ] 统计卡片网格自适应
- [ ] 任务卡片网格自适应（min 280px）
- [ ] 表格行 hover 高亮
- [ ] 数据看板图表区布局

### 12.4 交互层
- [ ] 所有按钮 hover/press/focus/disabled 状态完整
- [ ] 所有输入框 hover/focus/invalid/disabled 状态完整
- [ ] 焦点指示器符合 ring-2 规范
- [ ] 动效时长与缓动函数符合规范
- [ ] `prefers-reduced-motion` 支持
- [ ] 键盘 Tab 导航顺序合理

---

## 13. 附录：CSS 架构建议

### 13.1 分层结构

```
styles/
├── base/
│   ├── variables.css        # 设计令牌（颜色/间距/圆角/阴影）
│   ├── reset.css            # 浏览器重置
│   └── base.css             # 基础元素样式
├── components/
│   ├── button.css           # 按钮
│   ├── card.css             # 卡片
│   ├── input.css            # 输入框
│   ├── modal.css            # 模态框
│   ├── tabs.css             # 标签页
│   ├── table.css            # 表格
│   ├── badge.css            # 徽章
│   ├── toggle.css           # 开关
│   ├── sidebar.css          # 侧边栏
│   ├── topbar.css           # 顶部栏
│   ├── stat-card.css        # 统计卡片
│   ├── log-console.css      # 日志控制台
│   ├── toast.css            # 通知
│   └── empty-state.css      # 空状态
├── utilities/
│   ├── focus-ring.css       # 焦点环工具类
│   ├── status.css           # 状态工具类（disabled/pending/focused）
│   └── animations.css       # 动画工具类
├── themes/
│   ├── light.css            # 亮色主题
│   └── dark.css             # 暗色主题
└── index.css                # 入口文件
```

### 13.2 命名规范

采用 HeroUI 的 **BEM 变体命名法**：

```css
/* Block__Element--Modifier */
.button--primary          /* 块级修饰符 */
.button--sm              /* 尺寸修饰符 */
.button--icon-only       /* 图标专用修饰符 */
.button--full-width      /* 全宽修饰符 */

.modal__header           /* 元素 */
.modal__dialog--sm       /* 元素修饰符 */
.modal__body--scroll-inside  /* 嵌套修饰符 */

.tabs__list              /* 元素 */
.tabs__tab[data-selected="true"]  /* 数据属性状态选择器 */
.tabs--secondary         /* 变体修饰符 */
```

---

> **文档版本**：v1.0
> **制定日期**：2026-05-11
> **下次评审**：转型开发第一版完成后
> **参考设计系统**：HeroUI (https://heroui.com)
