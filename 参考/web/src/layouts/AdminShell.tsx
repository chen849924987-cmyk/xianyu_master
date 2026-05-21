import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, KeyRound, LayoutGrid, Zap } from "lucide-react";

import { fetchFeatures } from "@/api/client";
import type { FeatureRow } from "@/api/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SAVE_SESSION_FEATURE_ID } from "@/lib/feature-routes";

const primaryNav = [
  { to: "/hooks", label: "Hooks 统计", icon: BarChart3 },
  { to: "/session", label: "登录态", icon: KeyRound },
] as const;

function subNavClass(active: boolean) {
  return cn(
    "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
      : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
  );
}

export function AdminShell() {
  const [features, setFeatures] = useState<FeatureRow[]>([]);

  useEffect(() => {
    void fetchFeatures().then(setFeatures);
  }, []);

  return (
    <div className="flex min-h-svh w-full">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:w-60">
        <div className="border-b border-sidebar-border px-4 py-5">
          <div className="text-base font-semibold tracking-tight text-sidebar-foreground">doudian</div>
          <div className="mt-0.5 text-xs text-sidebar-muted">本地控制台</div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {primaryNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </NavLink>
          ))}

          <div className="mt-3 px-2 pb-1 pt-2">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-sidebar-muted">
              <Zap className="size-3.5 opacity-80" aria-hidden />
              Features
            </div>
          </div>
          <NavLink to="/features" end className={({ isActive }) => subNavClass(isActive)}>
            <LayoutGrid className="size-3.5 shrink-0 opacity-90" aria-hidden />
            总览
          </NavLink>
          <NavLink to={`/features/${SAVE_SESSION_FEATURE_ID}`} className={({ isActive }) => subNavClass(isActive)}>
            <span className="truncate">保存登录态</span>
          </NavLink>
          <div className="mx-2 border-t border-sidebar-border/80 pt-1" />
          {features.map((f) => (
            <NavLink key={f.id} to={`/features/${f.id}`} className={({ isActive }) => subNavClass(isActive)} title={f.id}>
              <span className="truncate">{f.displayName}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border p-3 text-[0.65rem] leading-snug text-sidebar-muted">
          API <span className="font-mono text-sidebar-foreground/90">127.0.0.1:3847</span>
          <br />
          勿暴露公网
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-10 border-b bg-card/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Vite 开发地址 <span className="font-mono text-foreground">5173</span>
              <Separator orientation="vertical" className="mx-2 hidden h-4 sm:inline-block" />
              <span className="hidden sm:inline">前后端请使用 </span>
              <code className="hidden rounded bg-muted px-1 py-0.5 text-xs sm:inline">npm run ui:dev</code>
            </p>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
