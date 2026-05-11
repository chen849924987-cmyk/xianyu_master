@echo off
REM 闲鱼自动化助手 - 以远程调试模式启动 Chrome
REM 启动后可在 http://localhost:9222 访问调试接口

set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe

if exist "%CHROME_PATH%" (
    echo 正在以远程调试模式启动 Chrome（端口 9222）...
    start "" "%CHROME_PATH%" ^
        --remote-debugging-port=9222 ^
        --no-first-run ^
        --no-default-browser-check ^
        --user-data-dir="%TEMP%\chrome_dev_9222"
) else (
    echo 未找到 Chrome，请检查安装路径
    echo 尝试从 PATH 中查找 Chrome...
    start "" chrome ^
        --remote-debugging-port=9222 ^
        --no-first-run ^
        --no-default-browser-check ^
        --user-data-dir="%TEMP%\chrome_dev_9222"
)

echo Chrome 远程调试已启动，请稍候...
echo 访问 http://localhost:9222 可查看调试状态
