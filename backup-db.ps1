$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pgsqlBin = Join-Path $baseDir "pgsql\bin"
$backupDir = Join-Path $baseDir "pgsql\backups"

if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$latestBackup = Join-Path $backupDir "komi_backup_latest.sql"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$timestampedBackup = Join-Path $backupDir "komi_backup_$timestamp.sql"

Write-Host "[Backup] 正在备份 Komi AI 数据库..." -ForegroundColor Cyan
& "$pgsqlBin\pg_dump.exe" -p 15432 -U postgres -d komi -F p -f $latestBackup 2>$null

if (Test-Path $latestBackup) {
    Copy-Item -Path $latestBackup -Destination $timestampedBackup -Force
    Write-Host "[SUCCESS] 数据库备份成功: $latestBackup" -ForegroundColor Green
} else {
    Write-Host "[WARNING] 数据库尚未运行，跳过备份" -ForegroundColor Yellow
}
