@echo off
title 闲鱼自动化助手（Next.js 一体版）
cd /d "%~dp0"

echo ==========================================
echo         闲鱼自动化助手 - 正在启动...
echo ==========================================
echo.
echo 服务启动后请访问: http://localhost:3000
echo 如需关闭，请按 Ctrl+C
echo.
echo [*] 检测依赖...
if not exist "node_modules\" (
    echo [!] 正在安装依赖...
    call pnpm install
    if %errorlevel% neq 0 (
        echo [!] 依赖安装失败，请手动运行: pnpm install
        pause
        exit /b
    )
)

echo [*] 构建 Next.js...
call npx next build
if %errorlevel% neq 0 (
    echo [!] 构建失败，尝试开发模式直接启动...
    echo [*] 启动开发服务器...
    call npx next dev -p 3000
) else (
    echo [*] 启动生产服务器...
    call npx next start -p 3000
)

if %errorlevel% neq 0 (
    echo.
    echo [!] 启动失败，请检查错误信息
    pause
)
