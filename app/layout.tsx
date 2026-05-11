import type { Metadata } from "next";
import "./globals.css";

/**
 * 应用元数据
 */
export const metadata: Metadata = {
  title: "闲鱼自动化助手",
  description: "闲鱼自动化任务管理平台",
};

/**
 * 根布局 - 提供 HTML 骨架
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
