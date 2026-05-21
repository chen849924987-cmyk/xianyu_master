# 类型定义规范

## JSDoc 注释

复杂类型需添加 JSDoc 说明：

```typescript
/**
 * `.data/hook-usage.json` 汇总项
 * 与 harness/lib/hook-usage-tracker.mjs 一致
 */
type HookAgg = {
  event: string;
  script: string;
  invocations: number;
  failures: number;
  total_duration_ms: number;
  last_at: string | null;
  last_exit_code: number | null;
};

/**
 * Job 记录，用于管理 CLI 子进程
 */
type JobRecord = {
  kind: JobKind;
  jobId: string;
  featureId: string | null;
  headed: boolean;
  startedAt: string;
  proc: ChildProcess;
  chunks: string[];
  sse: Set<Response>;
  ended: boolean;
  exitCode: number | null;
};
```

## 类型位置

1. **单文件内使用** - 定义在文件顶部
2. **多文件共享** - 定义在 `src/api/types.ts`
3. **前端共享** - 定义在 `web/src/api/types.ts`

## 示例

```typescript
// server/main.ts 顶部
type JobKind = "run" | "save";

type JobRecord = {
  kind: JobKind;
  jobId: string;
  // ...
};

// 或共享类型文件
// src/api/types.ts
export interface FeatureDto {
  id: string;
  displayName: string;
}

export interface JobRunDto {
  id: string;
  featureId: string;
  startedAt: string;
  endedAt: string;
  exitCode: number | null;
  log: string;
}
```
