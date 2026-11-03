. (Join-Path $PSScriptRoot 'database-config.ps1')
if ($databaseName -ne 'komi') { throw 'This restore script only supports the komi database.' }
$backupDir = Join-Path $baseDir "pgsql\backups"
$latestBackup = Join-Path $backupDir "komi_backup_latest.sql"

if (!(Test-Path $latestBackup)) {
    Write-Host "[Error] 未找到备份文件: $latestBackup" -ForegroundColor Red
    exit 1
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       正在从最新快照恢复 Komi AI 数据库..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

& "$pgsqlBin\psql.exe" @databaseArgs -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'komi' AND pid <> pg_backend_pid();"
if ($LASTEXITCODE -ne 0) { exit 1 }
& "$pgsqlBin\psql.exe" @databaseArgs -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS komi;"
if ($LASTEXITCODE -ne 0) { exit 1 }
& "$pgsqlBin\psql.exe" @databaseArgs -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE komi;"
if ($LASTEXITCODE -ne 0) { exit 1 }
& "$pgsqlBin\psql.exe" @databaseArgs -d komi -v ON_ERROR_STOP=1 -f $latestBackup
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[SUCCESS] 数据库已成功从最新快照完全恢复！" -ForegroundColor Green
