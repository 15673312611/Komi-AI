# Share the Go backend's connection settings with local database tools.
$baseDir = $PSScriptRoot
$pgsqlBin = Join-Path $baseDir 'pgsql\bin'
$databaseUrl = $env:DATABASE_URL
if (!$databaseUrl) {
    foreach ($line in Get-Content -LiteralPath (Join-Path $baseDir 'backend-go\.env')) {
        if ($line -match '^\s*DATABASE_URL\s*=\s*(.+)$') {
            $databaseUrl = $Matches[1].Trim().Trim('"').Trim("'")
            break
        }
    }
}
if (!$databaseUrl) { throw 'DATABASE_URL is missing from backend-go/.env.' }
$databaseUri = [Uri]($databaseUrl -replace '^postgresql\+[^:]+:', 'postgresql:')
$databasePort = $databaseUri.Port
if ($databasePort -le 0) { $databasePort = 5432 }
$databaseName = [Uri]::UnescapeDataString($databaseUri.AbsolutePath.TrimStart('/'))
$databaseCredentials = $databaseUri.UserInfo -split ':', 2
$databaseUser = [Uri]::UnescapeDataString($databaseCredentials[0])
if ($databaseCredentials.Count -gt 1) {
    $env:PGPASSWORD = [Uri]::UnescapeDataString($databaseCredentials[1])
}
$databaseArgs = @('-h', $databaseUri.Host, '-p', "$databasePort", '-U', $databaseUser, '-w')
$env:PGCONNECT_TIMEOUT = '5'
