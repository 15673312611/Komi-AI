@echo off
chcp 65001 > nul
echo ========================================================
echo   ChatterMate 前端开发服务器正在启动 (本地实时热重载)...
echo   访问地址: http://localhost:3001
echo   后端接口: http://localhost:8001/api/v1
echo ========================================================
echo.

cd /d "%~dp0\frontend"

echo 正在启动 Vite 开发服务 (端口 3001)...
npx vite --port 3001 --host 0.0.0.0

pause
