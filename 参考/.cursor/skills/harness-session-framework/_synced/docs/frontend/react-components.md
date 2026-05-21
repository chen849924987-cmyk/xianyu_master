# React 组件规范

## 函数组件

```typescript
// 使用函数式组件
import { useCallback, useEffect, useState } from "react";

// Props 类型定义
interface HooksPageProps {
  initialData?: HookUsageData;
}

// 导出函数组件
export function HooksPage({ initialData }: HooksPageProps) {
  const [data, setData] = useState(initialData ?? null);
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 回调使用 useCallback
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchHookUsage();
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      setErr(null);
      setData(result.data);
    } catch (e) {
      setErr(String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect 清理
  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  // 条件渲染
  if (err) {
    return <ErrorCard message={err} />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">Hooks</h1>
      <DataTable data={data} />
    </div>
  );
}
```

## 组件结构

```typescript
// 1. 导入
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Props 类型
interface MyComponentProps {
  title: string;
  onSubmit: (value: string) => void;
}

// 3. 组件定义
export function MyComponent({ title, onSubmit }: MyComponentProps) {
  // 4. State
  const [value, setValue] = useState("");
  
  // 5. 回调
  const handleSubmit = () => {
    onSubmit(value);
  };
  
  // 6. 渲染
  return (
    <div>
      <h1>{title}</h1>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button onClick={handleSubmit}>提交</Button>
    </div>
  );
}
```

## 条件渲染

```typescript
// ✅ 早期返回
if (isLoading) {
  return <Loading />;
}

if (error) {
  return <Error message={error} />;
}

// ✅ 三元表达式
return (
  <div>
    {isLoggedIn ? <UserMenu /> : <LoginButton />}
  </div>
);

// ✅ 逻辑与
return (
  <div>
    {showNotification && <Notification />}
  </div>
);
```

## 默认导出与命名导出

```typescript
// ✅ 推荐：命名导出
export function HooksPage() { }

// ✅ 页面组件可默认导出
export default function Page() { }
```
