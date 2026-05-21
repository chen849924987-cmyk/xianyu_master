# 导入顺序规范

## 完整导入顺序

```typescript
// 1. React 核心
import { useState, useCallback, useEffect, useMemo } from "react";

// 2. 第三方库（按字母顺序）
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { clsx } from "clsx";

// 3. 项目内部（@/ 别名）
import { fetchHookUsage } from "@/api/client";
import type { HookAgg, HookRunRow } from "@/api/types";
import { formatAsiaShanghai } from "@/lib/format-time";
import { cn } from "@/lib/utils";

// 4. 组件（按层级：ui → components → layouts → pages）
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HookUsageCharts } from "@/components/hooks/HookUsageCharts";
import { AdminShell } from "@/layouts/AdminShell";

// 5. 样式（如有）
import "./index.css";
```

## 分组原则

| 分组 | 来源 | 示例 |
|------|------|------|
| 1. React | react | `useState`, `useCallback` |
| 2. 第三方 | node_modules | `react-router-dom`, `lucide-react` |
| 3. 工具 | `@/lib/` | `cn`, `formatTime` |
| 4. API | `@/api/` | `fetchHookUsage`, `types` |
| 5. UI 组件 | `@/components/ui/` | `Button`, `Card` |
| 6. 业务组件 | `@/components/` | `HookUsageCharts` |
| 7. 布局 | `@/layouts/` | `AdminShell` |
| 8. 页面 | `@/pages/` | `SessionPage` |
| 9. 样式 | 相对路径 | `./styles.css` |

## 类型导入

```typescript
// ✅ 显式使用 type 关键字
import type { FeatureModule } from "@/api/types";
import type { ReactNode } from "react";

// ✅ 或合并导入
import { type Browser, chromium } from "playwright";
```

## 路径别名

```typescript
// ✅ 使用 @/ 别名
import { Button } from "@/components/ui/button";

// ❌ 避免相对路径
import { Button } from "../../../components/ui/button";
```

`tsconfig.json` 配置：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```
