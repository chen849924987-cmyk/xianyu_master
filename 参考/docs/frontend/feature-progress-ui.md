# Feature 控制台进度 UI 约定

> 适用于「在 Web 功能详情页（`FeatureDetailPage`）除原始日志外，还要展示流程节点与关键信息」的 feature。

当前参考实现：**晓风低价好物** `xf-ali-find-low-goods`（结构化日志 + 时间线组件 + 历史回放）。

## 何时需要这套 UI

- 流程步骤多、耗时长，或依赖多个环境变量分支，操作者需要在控制台**一眼看到进度**。
- 需要在不改动 SSE 协议的前提下，让前端从**同一条日志流**还原步骤状态。

不要求每个 feature 都实现；无结构化事件的 feature 仍只显示原始日志。

## 数据契约（日志内嵌）

### 行格式

- 每一帧进度必须是**独立一行**（含换行），便于 SSE 分块到达时的**按行缓冲解析**。
- 行内包含固定锚点 **`__JOB_STEP__`**，后接 **单行 JSON**（无换行）。实际输出形如：

  `[doudian] __JOB_STEP__{"featureId":"…","stepId":"…","phase":"…",…}`

  其中 `[doudian] ` 来自 [`src/utils/logger.ts`](../../src/utils/logger.ts) 的 `log.info` 前缀；锚点与 JSON 紧跟其后即可。

### 推荐发射方式

在 feature 内使用与步骤清单同目录的 `serializeJobStepLine`（见下文），**整段作为 `log.info` 的单一字符串参数**，避免 `console.log` 多参数拼接空格破坏 JSON：

```typescript
log.info(serializeJobStepLine({ featureId: "your-feature-id", stepId: "…", phase: "done", meta: { … } }));
```

### Payload 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `featureId` | 是 | 与 `FeatureModule.id` 一致，前端只解析本功能的行 |
| `stepId` | 是 | 该功能流程内的步骤标识（与步骤清单中的 `id` 对齐） |
| `phase` | 是 | 见下表 |
| `detail` | 否 | 短人类可读说明 |
| `meta` | 否 | 结构化信息（URL、条数、路径等），对象需可被 `JSON.stringify` |

### `phase` 语义（与 UI 状态映射）

| phase | UI 典型含义 |
|--------|-------------|
| `start` / `active` | 进行中 |
| `done` | 该步骤成功结束 |
| `skipped` | 因配置未执行（如某 env 关闭） |
| `warn` | 可继续，但有风险提示 |
| `error` | 该步骤失败（若随后进程退出，仍可与 exitCode 对照） |

同一 `stepId` 多次出现时，解析端通常采用**最后一次事件覆盖**（最新状态为准）。若需要「完成 + 警示」并存，应使用**单次** emit：`phase: "warn"` 且 `meta` 携带完整结果字段（路径、条数等），避免先发 `done` 再发 `warn` 导致 meta 丢失。

## 脚本侧（`src/features/<slug>/`）

1. **步骤清单与序列化（纯 TS，无 Playwright）**  
   - 新建 `ui-pipeline.ts`（名称可一致沿用）：导出步骤列表（`id`、标题、说明、`envHint` 可选）、`JOB_STEP_ANCHOR`、`serializeJobStepLine`、以及本功能的 `JobStepPayload` / `stepId` 联合类型。  
   - 文件中**不要**依赖 Playwright 或 Node 专有 API，以便 Vite 通过别名直接引用（见下）。

2. **在 `index.ts` 的流程边界打点**  
   - 分支跳过：显式发 `skipped`，避免节点永远「待定」。  
   - 与现有 `[xf-1.1]` 等人文日志并存，不互相替代。

3. **注册与列表**  
   - 仍按 [feature-module.md](../script/feature-module.md) 注册 `FeatureModule`。

## 前端（`web/src/`）

### 共享步骤清单

- 在 [`web/vite.config.ts`](../../web/vite.config.ts) 已配置 `resolve.alias["@repo"]` 指向仓库根目录，`web/tsconfig.json` 中配置 `@repo/*`，用于：

  `import { … } from "@repo/src/features/<slug>/ui-pipeline"`

  避免步骤 `id` 与文案在前后端漂移。

### 解析与缓冲

- SSE 的 `text` 可能半截一行：使用**行缓冲**解析器，仅在收到完整行后查找 `__JOB_STEP__` 并 `JSON.parse`。  
- 参考：[`web/src/lib/parse-job-steps.ts`](../../web/src/lib/parse-job-steps.ts)（低价好物专用；新 feature 可复制为 `<slug>-job-steps.ts` 或抽取通用 `featureId` 过滤函数）。
- **实时运行**：在 `subscribeJobLogs` 的 `onAppend` 中 `push` 块，`onEnd` 时 `flush` 残余缓冲。  
- **历史记录**：对 `detail.log` **全文**执行同一套按行解析，再折叠为「每 `stepId` 最新一条」。

### 详情页接入（`FeatureDetailPage`）

- 仅当 `featureId === "<slug>"` 时渲染进度卡片（示例：`XF_LOW_GOODS_FEATURE_ID` 定义在 [`web/src/lib/feature-routes.ts`](../../web/src/lib/feature-routes.ts)）。  
- **控制台**标签：日志区域**上方**展示实时节点。  
- **历史**标签：选中一条运行且加载 `detail` 后，在完整日志**上方**展示静态节点。  
- 新任务开始时：重置缓冲器与折叠状态。离开该 feature 路由时：清理进度 state，避免串档。

### UI 组件

- 使用现有 Card、Badge、Tailwind；纵向时间线或横向滚动条均可，**不强制**引入图编辑库。  
- 参考：[`web/src/components/features/XfLowGoodsProgress.tsx`](../../web/src/components/features/XfLowGoodsProgress.tsx)。

## 与后端 SSE 的关系

- 仍只使用 `{ type: "log", text }` 与 `{ type: "end", exitCode }`，无需新增事件类型。约定见 [sse.md](../backend/sse.md)。

## 旧历史与兼容性

- 无 `__JOB_STEP__` 的旧日志：进度区可提示「暂无结构化进度」，**仍以原始日志为准**。

## 检查清单（新 feature 接入 UI 进度）

1. [ ] `src/features/<slug>/ui-pipeline.ts`：步骤定义 + `serializeJobStepLine` + `JOB_STEP_ANCHOR`  
2. [ ] `index.ts`：分支 `skipped` / `warn` / `error` 完整，关键 `meta` 不丢  
3. [ ] Web：解析模块 + 进度组件 + `FeatureDetailPage` 按 `featureId` 挂载  
4. [ ] `web/src/lib/feature-routes.ts`（或等价常量）：导出功能 id 供路由判断  
5. [ ] `npm run build` 与 `npm run ui:build` 通过  
