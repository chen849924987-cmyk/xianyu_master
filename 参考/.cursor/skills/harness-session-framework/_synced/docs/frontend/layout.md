# 布局组件规范

## 布局壳组件

```typescript
// @/layouts/AdminShell.tsx
import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AdminShell() {
  const location = useLocation();
  
  const navItems = [
    { path: "/hooks", label: "Hooks" },
    { path: "/session", label: "Session" },
    { path: "/features", label: "Features" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-4">
          <h1 className="text-lg font-semibold">抖店控制台</h1>
        </div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "block rounded-md px-3 py-2 text-sm",
                location.pathname.startsWith(item.path)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* 主内容 */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

## 页面组件

```typescript
// @/pages/HooksPage.tsx
import { HooksPage } from "@/pages/HooksPage";

export function HooksPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hooks</h1>
        <p className="text-muted-foreground">Hook 使用统计</p>
      </div>
      <HookUsageCharts />
    </div>
  );
}
```

## 布局原则

1. **布局壳只负责布局** - 不包含业务逻辑
2. **使用 Outlet 渲染子路由**
3. **导航状态与路由同步** - 使用 `useLocation`
4. **响应式考虑** - 移动端隐藏侧边栏或改为抽屉

## 响应式布局

```typescript
function AdminShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* 移动端抽屉 */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
      
      {/* 桌面端固定侧边栏 */}
      <aside className="hidden w-64 border-r bg-muted/40 lg:block">
        <SidebarContent />
      </aside>
      
      {/* 主内容 */}
      <main className="flex-1 p-4 lg:p-6">
        {/* 移动端菜单按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu />
        </Button>
        <Outlet />
      </main>
    </div>
  );
}
```
