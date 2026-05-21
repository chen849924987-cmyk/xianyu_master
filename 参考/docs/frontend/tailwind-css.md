# Tailwind CSS 规范

## 类名顺序

按以下优先级排序（便于阅读和维护）：

```tsx
<div className="
  /* 1. 布局 */
  relative flex items-center gap-2
  /* 2. 盒模型 */
  mx-auto max-w-6xl px-4 py-6
  /* 3. 视觉 */
  rounded-lg border bg-card shadow-sm
  /* 4. 文字 */
  text-sm font-medium text-foreground
  /* 5. 交互 */
  hover:bg-accent hover:text-accent-foreground
  focus-visible:ring-2 focus-visible:ring-ring
  /* 6. 响应式（最后） */
  sm:px-6 lg:px-8
">
```

## cn 工具函数

复杂样式使用 `cn` 合并：

```typescript
import { cn } from "@/lib/utils";

className={cn(
  // 基础样式
  "flex items-center gap-2 rounded-md px-3 py-2",
  // 变体样式
  variant === "default" && "bg-primary text-primary-foreground",
  variant === "destructive" && "bg-destructive text-white",
  variant === "outline" && "border border-input bg-background",
  // 状态样式
  isActive && "ring-2 ring-ring ring-offset-2",
  // 尺寸样式
  size === "sm" ? "h-8 text-xs" : size === "lg" ? "h-12 text-base" : "h-10 text-sm",
  // 自定义类名透传
  className
)}
```

## 颜色变量

使用 CSS 变量（由 Tailwind 配置提供）：

| 用途 | 类名 |
|------|------|
| 卡片背景 | `bg-card` |
| 页面背景 | `bg-background` |
| 次要背景 | `bg-muted` |
| 强调背景 | `bg-accent` |
| 主文字 | `text-foreground` |
| 次要文字 | `text-muted-foreground` |
| 主色调 | `text-primary`, `bg-primary` |
| 边框 | `border-border`, `border-input` |
| 危险 | `text-destructive`, `bg-destructive` |

## 间距规范

| 级别 | 尺寸 | 用途 |
|------|------|------|
| `space-y-1` | 0.25rem | 紧凑列表 |
| `space-y-2` | 0.5rem | 表单元素 |
| `space-y-4` | 1rem | 卡片内容 |
| `space-y-6` | 1.5rem | 页面区块 |
| `gap-2` | 0.5rem | 按钮组 |
| `gap-4` | 1rem | 网格 |
| `p-4` | 1rem | 卡片内边距 |
| `px-4` | 1rem | 水平内边距 |
| `py-6` | 1.5rem | 垂直内边距 |

## 响应式断点

| 断点 | 前缀 | 尺寸 |
|------|------|------|
| sm | `sm:` | 640px |
| md | `md:` | 768px |
| lg | `lg:` | 1024px |
| xl | `xl:` | 1280px |

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 响应式网格 */}
</div>
```
