$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'database-config.ps1')
    $dataDir = Join-Path $baseDir 'pgsql\data'
    if ($databaseUri.Host -in @('localhost', '127.0.0.1', '::1') -and (Test-Path -LiteralPath $pgsqlBin)) {
        & "$pgsqlBin\pg_ctl.exe" -D $dataDir status *> $null
        if ($LASTEXITCODE -ne 0) {
            & "$pgsqlBin\pg_ctl.exe" -D $dataDir -o "-p $databasePort" -l (Join-Path $baseDir 'pgsql\server.log') -w -t 20 start
            if ($LASTEXITCODE -ne 0) {
                throw "Local PostgreSQL failed to start on port $databasePort. Check pgsql/server.log and whether another project is using this port."
            }
        }
        $actualDataDir = & "$pgsqlBin\psql.exe" @databaseArgs -d $databaseName -X -A -t -v ON_ERROR_STOP=1 -c 'SHOW data_directory;'
        if ($LASTEXITCODE -ne 0) { throw "Cannot connect to database '$databaseName' on port $databasePort." }
        if ([IO.Path]::GetFullPath(($actualDataDir | Out-String).Trim()) -ne [IO.Path]::GetFullPath($dataDir)) {
            throw "Port $databasePort belongs to a different PostgreSQL data directory. Set DATABASE_URL to this project's database port."
        }
    }
    & "$pgsqlBin\psql.exe" @databaseArgs -d $databaseName -X -v ON_ERROR_STOP=1 -c 'SELECT 1;' > $null
    if ($LASTEXITCODE -ne 0) { throw "Database '$databaseName' is unavailable on port $databasePort." }
    Write-Host "  - Database '$databaseName' on port $databasePort is ready"
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
