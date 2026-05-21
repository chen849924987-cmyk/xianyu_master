# 路由定义规范

## URL 结构

| 路径 | 用途 |
|------|------|
| `GET /api/features` | 列出所有功能 |
| `GET /api/session` | 获取登录态信息 |
| `GET /api/feature-runs` | 列出功能运行历史 |
| `GET /api/feature-runs/:id` | 获取单个运行记录 |
| `GET /api/hook-usage` | 获取 hook 使用统计 |
| `POST /api/jobs/run` | 运行功能 |
| `POST /api/jobs/save-session` | 保存登录态 |
| `POST /api/jobs/:jobId/save-session/confirm` | 确认保存登录态 |
| `GET /api/jobs/:jobId/logs` | 获取任务日志（SSE） |

## 路由定义顺序

```typescript
// 1. API 路由（具体在前，通配在后）
app.get("/api/features", handler);
app.get("/api/session", handler);
app.get("/api/feature-runs/:id", handler);  // 具体
app.get("/api/feature-runs", handler);      // 通配在后

// 2. POST 路由
app.post("/api/jobs/run", handler);
app.post("/api/jobs/save-session", handler);

// 3. 静态资源（最后）
app.use(express.static(distDir));
app.get("*", spaFallbackHandler);
```

## 路由处理函数

```typescript
// 使用显式类型
import type { Request, Response } from "express";

// 简单路由
app.get("/api/features", (_req: Request, res: Response) => {
  res.json({ ok: true, data: listFeatures() });
});

// 带参数验证
app.post("/api/jobs/run", (req: Request, res: Response) => {
  const featureId = String(req.body?.featureId ?? "").trim();
  const headed = Boolean(req.body?.headed);
  
  if (!featureId) {
    res.status(400).json({ ok: false, error: "missing featureId" });
    return;
  }
  
  if (!getFeature(featureId)) {
    res.status(400).json({ ok: false, error: "unknown featureId" });
    return;
  }
  
  const jobId = createJob(featureId, headed);
  res.json({ ok: true, jobId });
});
```
