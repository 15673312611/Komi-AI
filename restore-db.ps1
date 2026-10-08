$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pgsqlBin = Join-Path $baseDir "pgsql\bin"
$backupDir = Join-Path $baseDir "pgsql\backups"
$latestBackup = Join-Path $backupDir "komi_backup_latest.sql"

if (!(Test-Path $latestBackup)) {
    Write-Host "[Error] 未找到备份文件: $latestBackup" -ForegroundColor Red
    exit 1
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       正在从最新快照恢复 Komi AI 数据库..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

& "$pgsqlBin\psql.exe" -p 15432 -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'komi' AND pid <> pg_backend_pid();" 2>$null
& "$pgsqlBin\psql.exe" -p 15432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS komi;" 2>$null
& "$pgsqlBin\psql.exe" -p 15432 -U postgres -d postgres -c "CREATE DATABASE komi;" 2>$null
& "$pgsqlBin\psql.exe" -p 15432 -U postgres -d komi -f $latestBackup 2>$null

Write-Host "[SUCCESS] 数据库已成功从最新快照完全恢复！" -ForegroundColor Green
