# API 客户端规范

## 基础请求

```typescript
// @/api/client.ts
const API_BASE = "/api";

export async function fetchFeatures(): Promise<
  | { ok: true; data: FeatureDto[] }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_BASE}/features`);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
```

## POST 请求

```typescript
export async function runFeature(
  featureId: string,
  headed: boolean
): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/jobs/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId, headed }),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return { ok: false, error: error.error || `HTTP ${res.status}` };
    }
    
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
```

## 数据转换

```typescript
// 原始类型
interface HookRunRow {
  at: string;
  event: string;
  script: string;
  duration_ms: number;
  exit_code: number;
}

// 转换函数
function transformRunRow(row: HookRunRow): DisplayRow {
  return {
    id: `${row.at}-${row.event}`,
    time: formatAsiaShanghai(row.at),
    event: row.event,
    script: row.script,
    duration: `${row.duration_ms}ms`,
    status: row.exit_code === 0 ? "success" : "error",
  };
}
```

## 错误处理

```typescript
// 组件中使用
const [data, setData] = useState<Data | null>(null);
const [error, setError] = useState<string | null>(null);

const load = useCallback(async () => {
  const result = await fetchData();
  if (!result.ok) {
    setError(result.error);
    return;
  }
  setData(result.data);
  setError(null);
}, []);

// 渲染错误
if (error) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">加载失败</CardTitle>
      </CardHeader>
      <CardContent>{error}</CardContent>
    </Card>
  );
}
```
