# 导入规范

## 导入顺序

```typescript
// 1. 标准库（按字母顺序）
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

// 2. 第三方库（按字母顺序）
import express from "express";
import { chromium, type Browser, type Page } from "playwright";

// 3. 类型导入（显式使用 type 关键字）
import type { FeatureModule } from "../types.js";
import type { Response } from "express";
import type { BrowserContext } from "playwright";

// 4. 项目内部模块（按层级，由远及近）
import { listFeatures } from "../features/index.js";
import { log } from "../../utils/logger.js";
import { appConfig } from "../../utils/config.js";
```

## 关键规则

1. **类型导入显式标记** - 使用 `import type { ... }`
2. **ESM 扩展名** - 项目内部导入使用 `.js` 扩展名
3. **禁止通配导入** - 避免 `import * as ...`（除非必要）
4. **分组空行** - 不同组之间保留空行

## 前端导入（使用 @ 别名）

```typescript
// 1. React 核心
import { useState, useCallback, useEffect } from "react";

// 2. 第三方库
import { BrowserRouter, Route, Routes } from "react-router-dom";

// 3. 项目内部（@/ 别名）
import { fetchHookUsage } from "@/api/client";
import type { HookAgg } from "@/api/types";
import { formatAsiaShanghai } from "@/lib/format-time";

// 4. 组件（按层级）
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { HookUsageCharts } from "@/components/hooks/HookUsageCharts";
```

## 避免循环导入

```typescript
// ❌ 避免：A.ts 导入 B.ts，B.ts 又导入 A.ts
// A.ts
import { b } from "./B.js";  // ❌
export const a = () => b();

// B.ts
import { a } from "./A.js";  // ❌
export const b = () => a();

// ✅ 解决：提取公共类型到单独文件
// types.ts
export type SharedType = { ... };

// A.ts
import type { SharedType } from "./types.js";
```
