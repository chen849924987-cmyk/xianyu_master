"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { FEATURES } from "@/lib/feature-registry";
import {
  IconBolt,
  IconClock,
  IconLayout,
  IconScroll,
  IconShield,
  type IconProps,
} from "./icons";

const MAIN_NAV: {
  label: string;
  href: string;
  Icon: ComponentType<IconProps>;
}[] = [
  { label: "控制台", href: "/", Icon: IconLayout },
  { label: "定时任务", href: "/#schedule", Icon: IconClock },
  { label: "运行日志", href: "/#logs", Icon: IconScroll },
  { label: "登录管理", href: "/#session", Icon: IconShield },
];

export interface ConsoleShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  sessionFooter?: ReactNode;
}

/**
 * 管理台共用布局：侧栏 + 主内容区
 */
export function ConsoleShell({
  children,
  title,
  description,
  actions,
  sessionFooter,
}: ConsoleShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link href="/" className="logo" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="logo-icon">
              <IconBolt size={20} />
            </span>
            <span className="logo-text">
              <span className="logo-title">闲鱼助手</span>
              <span className="logo-badge">v2.1</span>
            </span>
          </Link>
          <p className="subtitle">自动化任务管理平台</p>
        </div>

        <nav className="nav-list" aria-label="系统导航">
          {MAIN_NAV.map((item) => {
            const NavIcon = item.Icon;
            const active = !pathname.startsWith("/features") && item.href === "/" && pathname === "/";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <span className="nav-icon">
                  <NavIcon size={18} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-features">
          <div className="sidebar-features-title">功能模块</div>
          <div className="sidebar-features-list">
            {FEATURES.map((f) => {
              const href = `/features/${f.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={f.slug}
                  href={href}
                  className={`feature-nav-item ${active ? "active" : ""}`}
                  title={f.description}
                >
                  <span className="feature-nav-name">{f.name}</span>
                  <span className="feature-nav-cat">{f.category}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {sessionFooter}
        <div className="sidebar-footer">闲鱼自动化助手 · 本地服务</div>
      </aside>

      <main className="main-content">
        {(title || actions) && (
          <header className="top-bar">
            {title && (
              <div className="top-bar-title-wrap">
                <h2>{title}</h2>
                {description && <p className="page-desc">{description}</p>}
              </div>
            )}
            {actions && <div className="actions">{actions}</div>}
          </header>
        )}
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
