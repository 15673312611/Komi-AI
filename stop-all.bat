@echo off
chcp 65001 > nul
title 停止 ChatterMate 前后端开发服务

echo ========================================================
echo        正在停止 ChatterMate 前后端所有服务...
echo ========================================================
echo.

echo [1/3] 正在关闭 Go 后端服务 (chattermate-server.exe)...
for /f "tokens=2" %%P in ('tasklist /fi "imagename eq chattermate-server.exe" /fo list ^^| findstr /b "PID:"') do taskkill /pid %%P /f >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^^| findstr :8001 ^^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [2/3] 正在关闭 Vite 前端服务 (端口 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^^| findstr :3001 ^^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [3/4] 正在停止本地便携数据库 (pgsql)...
if exist "%~dp0pgsql\bin\pg_ctl.exe" (
    "%~dp0pgsql\bin\pg_ctl.exe" -D "%~dp0pgsql\data" stop >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :15432 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [4/4] 正在检查端口释放状态...
echo.
echo ========================================================
echo   [SUCCESS] 所有前后端及本地数据库服务已完全退出！
echo ========================================================
echo.
timeout /t 2 >nul
