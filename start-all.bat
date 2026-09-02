@echo off
chcp 65001 > nul
title Komi AI Dev Stack (Go Backend :8001 + Frontend :3001)

echo ========================================================
echo        Komi AI Dev Stack
echo ========================================================
echo.

cd /d "%~dp0"

rem 1. Ensure database is running (Portable local PostgreSQL :15432)
echo [1/3] Starting local database (PostgreSQL :15432)...
netstat -aon | findstr :15432 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    if exist "%~dp0pgsql\bin\pg_ctl.exe" (
        "%~dp0pgsql\bin\pg_ctl.exe" -D "%~dp0pgsql\data" -o "-p 15432" -l "%~dp0pgsql\server.log" start >nul 2>&1
        timeout /t 1 >nul
    ) else (
        docker start komi-db-1 >nul 2>&1
    )
)
echo   - Local Database (15432) is ready

rem 2. Rebuild the Go backend from the current source on every start
echo [2/3] Cleaning up prior instances and building Go backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=2" %%P in ('tasklist /fi "imagename eq komi-server.exe" /fo list ^| findstr /b "PID:"') do taskkill /pid %%P /f >nul 2>&1

cd /d "%~dp0backend-go"
go build -o komi-server.next.exe ./cmd/server
if errorlevel 1 (
    echo   - Go build failed; services were not started
    del /q komi-server.next.exe >nul 2>&1
    exit /b 1
)
move /y komi-server.next.exe komi-server.exe >nul
cd /d "%~dp0"
echo   - Go backend build is up to date

rem 3. Start the Go backend in the background and Vite in this console
echo [3/3] Starting services...
echo   - Starting Go backend (http://localhost:8001)...
start /b "" "%~dp0backend-go\komi-server.exe"

echo   - Starting Vite dev server (http://localhost:3001)...
echo.
echo ========================================================
echo   Service URLs:
echo     - Frontend: http://localhost:3001
echo     - Backend: http://localhost:8001/api/v1
echo.
echo   Both services run in this window.
echo   Press Ctrl+C or close this window to stop.
echo ========================================================
echo.

cd /d "%~dp0frontend"
call npx vite --port 3001 --host 0.0.0.0 --strictPort

rem Cleanup backend when frontend stops
for /f "tokens=2" %%P in ('tasklist /fi "imagename eq komi-server.exe" /fo list ^| findstr /b "PID:"') do taskkill /pid %%P /f >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
