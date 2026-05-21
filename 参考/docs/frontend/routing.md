# 路由规范

## 路由配置

```typescript
// App.tsx
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AdminShell } from "@/layouts/AdminShell";
import { HooksPage } from "@/pages/HooksPage";
import { SessionPage } from "@/pages/SessionPage";
import { FeaturesOverviewPage } from "@/pages/FeaturesOverviewPage";
import { FeatureDetailPage } from "@/pages/FeatureDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminShell />}>
          <Route index element={<Navigate to="/hooks" replace />} />
          <Route path="hooks" element={<HooksPage />} />
          <Route path="session" element={<SessionPage />} />
          <Route path="features" element={<Outlet />}>
            <Route index element={<FeaturesOverviewPage />} />
            <Route path=":featureId" element={<FeatureDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `<AdminShell>` | 布局壳 |
| `/hooks` | `<HooksPage>` | Hooks 统计 |
| `/session` | `<SessionPage>` | 登录态管理 |
| `/features` | `<FeaturesOverviewPage>` | 功能列表 |
| `/features/:featureId` | `<FeatureDetailPage>` | 功能详情 |

## 嵌套路由

```typescript
// 父路由提供 Outlet
function AdminShell() {
  return (
    <div className="flex">
      <Sidebar />
      <main>
        <Outlet />  {/* 子路由渲染位置 */}
      </main>
    </div>
  );
}

// 子路由配置
<Route path="features" element={<Outlet />}>
  <Route index element={<FeaturesOverviewPage />} />  {/* /features */}
  <Route path=":featureId" element={<FeatureDetailPage />} />  {/* /features/:id */}
</Route>
```

## 参数获取

```typescript
import { useParams } from "react-router-dom";

function FeatureDetailPage() {
  const { featureId } = useParams<{ featureId: string }>();
  
  useEffect(() => {
    if (featureId) {
      loadFeature(featureId);
    }
  }, [featureId]);
  
  return <div>{featureId}</div>;
}
```

## 导航

```typescript
import { useNavigate, Link } from "react-router-dom";

// 声明式导航
<Link to="/hooks">Hooks</Link>

// 程序化导航
const navigate = useNavigate();

// 跳转
navigate("/features");

// 替换当前历史记录
navigate("/features", { replace: true });

// 返回
navigate(-1);
```
