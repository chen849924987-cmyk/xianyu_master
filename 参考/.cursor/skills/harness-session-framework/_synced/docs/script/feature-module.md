# FeatureModule 结构规范

## 模块结构

每个 feature 模块必须导出 `FeatureModule` 对象：

```typescript
// src/features/<slug>/index.ts
import type { FeatureModule } from "../types.js";

/**
 * 登录功能：门户落地 + 工作台校验
 * 支持已有 storageState 或密码自动登录
 */
export const loginFeature: FeatureModule = {
  id: "login",              // 目录名 slug，唯一标识
  displayName: "登录",      // 中文说明，简短清晰
  async run({ page, baseUrl, browserContext }) {
    // 实现逻辑
  },
};
```

## 类型定义

```typescript
// src/features/types.ts
import type { BrowserContext, Page } from "playwright";

/** 单个「页面功能」运行时可拿到的上下文 */
export type FeatureRunContext = {
  page: Page;
  /** 抖店后台 origin，便于拼 URL */
  baseUrl: string;
  /** 可选：用于登录成功后写入 storageState 等 */
  browserContext?: BrowserContext;
};

/** 与抖店后台某一页面对应的自动化模块 */
export type FeatureModule = {
  /** 目录名 slug，如 login、order-list */
  id: string;
  /** 中文说明：对应后台哪一页 */
  displayName: string;
  run: (ctx: FeatureRunContext) => Promise<void>;
};
```

## 注册 feature

在 `src/features/index.ts` 中注册：

```typescript
import { loginFeature } from "./login/index.js";
import { dashboardFeature } from "./dashboard/index.js";

export const features: FeatureModule[] = [
  loginFeature,
  dashboardFeature,
  // ...
];

export function listFeatures(): FeatureModule[] {
  return features;
}

export function getFeature(id: string): FeatureModule | undefined {
  return features.find((f) => f.id === id);
}
```

## 实现要点

1. **单一职责** - 每个 feature 只处理一个页面或功能
2. **前置检查** - 在 run 开始时验证必要资源
3. **错误处理** - 关键错误抛出，次要错误记录后继续
4. **状态断言** - 操作后验证页面状态符合预期

## 控制台进度 UI（可选）

若该 feature 需要在 Web 功能详情页展示**流程节点与关键信息**（不仅是原始日志），在 `src/features/<slug>/` 内增加与脚本共用的 `ui-pipeline.ts`，并在日志中输出带 `__JOB_STEP__` 的结构化行；前端按 `featureId` 接入解析与时间线。完整约定见 [feature-progress-ui.md](../frontend/feature-progress-ui.md)。参考实现：`xf-ali-find-low-goods`。
