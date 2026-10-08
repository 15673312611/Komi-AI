@echo off
chcp 65001 > nul

if not exist "%~dp0pgsql\backups" mkdir "%~dp0pgsql\backups"

echo [Backup] 正在备份 Komi AI 本地数据库...
"%~dp0pgsql\bin\pg_dump.exe" -p 15432 -U postgres -d komi -F p -f "%~dp0pgsql\backups\komi_backup_latest.sql" >nul 2>&1

if exist "%~dp0pgsql\backups\komi_backup_latest.sql" (
    echo [Backup] 数据库备份成功: %~dp0pgsql\backups\komi_backup_latest.sql
) else (
    echo [Backup] 备份跳过（数据库服务未运行或未初始化）
)
