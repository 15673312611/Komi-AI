@echo off
chcp 65001 > nul

if not exist "%~dp0pgsql\backups\komi_backup_latest.sql" (
    echo [Restore Error] 未找到备份文件: %~dp0pgsql\backups\komi_backup_latest.sql
    exit /b 1
)

echo ========================================================
echo        正在从最新备份还原 Komi AI 数据库...
echo ========================================================

"%~dp0pgsql\bin\psql.exe" -p 15432 -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'komi' AND pid <> pg_backend_pid();" >nul 2>&1
"%~dp0pgsql\bin\psql.exe" -p 15432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS komi;" >nul 2>&1
"%~dp0pgsql\bin\psql.exe" -p 15432 -U postgres -d postgres -c "CREATE DATABASE komi;" >nul 2>&1
"%~dp0pgsql\bin\psql.exe" -p 15432 -U postgres -d komi -f "%~dp0pgsql\backups\komi_backup_latest.sql" >nul 2>&1

echo [SUCCESS] 数据库已成功从最新快照恢复！
