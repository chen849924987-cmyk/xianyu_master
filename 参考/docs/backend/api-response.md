# API 响应格式规范

## 统一响应格式

所有响应使用 `{ ok: boolean }` 包装：

### 成功响应

```typescript
// 200 OK
app.get("/api/features", (_req, res) => {
  const rows = listFeatures().map((f) => ({ id: f.id, displayName: f.displayName }));
  res.json({ ok: true as const, data: rows });
});

// 带数据的响应
app.get("/api/feature-runs", (req, res) => {
  try {
    const rows = listFeatureJobRuns(repoRoot, featureId);
    res.json({ ok: true as const, runs: rows });
  } catch (e) {
    res.status(500).json({ ok: false as const, error: String(e) });
  }
});
```

### 错误响应

```typescript
// 400 请求错误
app.post("/api/jobs/run", (req, res) => {
  const featureId = String(req.body?.featureId ?? "").trim();
  if (!featureId || !getFeature(featureId)) {
    res.status(400).json({ ok: false as const, error: "unknown or missing featureId" });
    return;
  }
  // ...
});

// 404 不存在
app.get("/api/feature-runs/:id", (req, res) => {
  const row = getFeatureJobRun(repoRoot, req.params.id);
  if (!row) {
    res.status(404).json({ ok: false as const, error: "not found" });
    return;
  }
  res.json({ ok: true as const, run: row });
});

// 500 服务器错误
app.get("/api/data", (req, res) => {
  try {
    const data = processData();
    res.json({ ok: true as const, data });
  } catch (e) {
    res.status(500).json({ ok: false as const, error: String(e) });
  }
});
```

## 关键规则

1. **统一结构** - 所有响应包含 `ok: true` 或 `ok: false`
2. **使用 `as const`** - 确保 TypeScript 类型收窄
3. **错误信息** - 错误响应包含 `error: string` 字段
4. **状态码一致** - HTTP 状态码与 `ok` 字段一致

## 前端消费示例

```typescript
const result = await fetch("/api/feature-runs").then(r => r.json());

if (result.ok) {
  // result.runs 可用
  renderRuns(result.runs);
} else {
  // result.error 可用
  showError(result.error);
}
```
