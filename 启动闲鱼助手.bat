@echo off
title 闲鱼自动化助手
cd /d "%~dp0"

echo ==========================================
echo         闲鱼自动化助手 - 正在启动...
echo ==========================================
echo.
echo 服务启动后请访问: http://localhost:3000
echo 如需关闭，请按 Ctrl+C
echo.

:: 启动 Node.js 服务（后端工作在 backend/ 目录）
cd /d "%~dp0"
node backend/main.cjs

if %errorlevel% neq 0 (
    echo.
    echo [!] 启动失败，请确保已安装依赖
    echo 尝试运行: pnpm install
    pause
)
