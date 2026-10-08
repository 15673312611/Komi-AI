@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

title Komi AI Go Backend Server

echo ===================================================
echo           Komi AI Go 后端服务启动器
echo ===================================================
echo.

cd /d "%~dp0"

:: 检查并加载 .env 配置
if exist ".env" (
    echo [INFO] 检测到 .env 配置文件，正在加载环境变量...
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        set "line=%%A"
        if not "!line:~0,1!"=="#" if not "!line!"=="" (
            set "%%A=%%B"
        )
    )
) else (
    echo [WARN] 未找到 .env 文件，使用默认配置
    set "ENVIRONMENT=development"
    set "HTTP_ADDR=:8001"
    set "PORT=8001"
    set "DATABASE_URL=postgresql://postgres:postgres@localhost:15432/komi"
    set "REDIS_URL=redis://localhost:16379/0"
    set "REDIS_ENABLED=true"
    set "BACKEND_URL=http://localhost:8001"
    set "VITE_WIDGET_URL=http://localhost:8001"
    set "FRONTEND_URL=http://localhost:3000"
    set "CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000,http://localhost:8001"
)

:: 确保项目根目录的 assets 目录存在
if not exist "..\backend\assets" (
    mkdir "..\backend\assets" 2>nul
)

:: 检查 komi-server.exe 是否已编译
if not exist "komi-server.exe" (
    echo [INFO] 正在编译 Go 后端服务...
    go build -o komi-server.exe ./cmd/server
    if errorlevel 1 (
        echo [ERROR] 编译失败，请检查 Go 环境与代码！
        pause
        exit /b 1
    )
    echo [SUCCESS] 编译成功！
)

echo.
echo [INFO] 服务启动参数:
echo   - 监听端口: %HTTP_ADDR%
echo   - 运行环境: %ENVIRONMENT%
echo   - 数据库地址: %DATABASE_URL%
echo   - Redis地址: %REDIS_URL%
echo.
echo [INFO] 正在启动 Komi AI Go 服务...
echo ---------------------------------------------------
echo.

:: 在项目根目录下运行服务，确保静态资源和配置路径正常解析
cd /d "%~dp0\.."
"%~dp0chattermate-server.exe"

if errorlevel 1 (
    echo.
    echo [ERROR] 服务异常退出，错误码: %errorlevel%
    pause
)
