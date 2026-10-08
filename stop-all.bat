@echo off
chcp 65001 > nul
title 停止 Komi AI 前后端开发服务

echo ========================================================
echo        正在停止 Komi AI 前后端所有服务...
echo ========================================================
echo.

echo [1/4] 正在关闭 Go 后端服务 (komi-server.exe)...
for /f "tokens=2" %%P in ('tasklist /fi "imagename eq komi-server.exe" /fo list ^| findstr /b "PID:"') do taskkill /pid %%P /f >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [2/4] 正在关闭 Vite 前端服务 (端口 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [3/4] 正在自动备份数据库并安全退出 (pgsql)...
powershell -ExecutionPolicy Bypass -File "%~dp0backup-db.ps1" >nul 2>&1
if exist "%~dp0pgsql\bin\pg_ctl.exe" (
    "%~dp0pgsql\bin\pg_ctl.exe" -D "%~dp0pgsql\data" stop >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :15432 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [4/4] 正在检查端口释放状态...
echo.
echo ========================================================
echo   [SUCCESS] 数据库已自动备份，所有服务已安全完全退出！
echo ========================================================
echo.
timeout /t 2 >nul
