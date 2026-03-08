param(
    [Parameter(Mandatory = $false)]
    [string]$SourceDatabaseUrl,

    [Parameter(Mandatory = $false)]
    [string]$TargetDatabaseUrl,

    [Parameter(Mandatory = $false)]
    [switch]$SkipBackup,

    [Parameter(Mandatory = $false)]
    [switch]$SkipRestore,

    [Parameter(Mandatory = $false)]
    [switch]$SkipVerify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Fail {
    param([string]$Message)
    Write-Host "`nERROR: $Message" -ForegroundColor Red
    exit 1
}

function Ensure-Command {
    param([string]$Name)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Fail "$Name is not installed or not on PATH. Install PostgreSQL client tools and retry."
    }
}

function Add-SslModeRequireIfMissing {
    param([string]$Url)
    if (-not $Url) { return $Url }

    if ($Url -match "sslmode=") {
        return $Url
    }

    if ($Url.Contains("?")) {
        return "${Url}&sslmode=require"
    }

    return "${Url}?sslmode=require"
}

function Invoke-CountQuery {
    param(
        [string]$ConnectionString,
        [string]$TableName
    )

    $result = psql "$ConnectionString" -t -A -c "SELECT COUNT(*) FROM $TableName;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        return "ERR"
    }

    return ($result | Select-Object -First 1).Trim()
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Render -> Supabase Database Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not $SourceDatabaseUrl) {
    $SourceDatabaseUrl = $env:SOURCE_DATABASE_URL
}

if (-not $TargetDatabaseUrl) {
    $TargetDatabaseUrl = $env:TARGET_DATABASE_URL
}

if (-not $SourceDatabaseUrl) {
    Fail "Missing source DB URL. Pass -SourceDatabaseUrl or set SOURCE_DATABASE_URL."
}

if (-not $TargetDatabaseUrl) {
    Fail "Missing target DB URL. Pass -TargetDatabaseUrl or set TARGET_DATABASE_URL."
}

$sourceWithSsl = Add-SslModeRequireIfMissing -Url $SourceDatabaseUrl
$targetWithSsl = Add-SslModeRequireIfMissing -Url $TargetDatabaseUrl

if (-not $SkipBackup) {
    Ensure-Command -Name "pg_dump"
}

if (-not $SkipRestore) {
    Ensure-Command -Name "pg_restore"
}

if (-not $SkipVerify) {
    Ensure-Command -Name "psql"
}

$projectRoot = Split-Path -Parent $PSCommandPath
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $projectRoot ".migration\$stamp"
$dumpFile = Join-Path $backupDir "render-backup.dump"

if (-not $SkipBackup) {
    Write-Step "Creating backup dump from Render"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

    pg_dump --format=custom --no-owner --no-privileges --verbose --dbname "$sourceWithSsl" --file "$dumpFile"
    if ($LASTEXITCODE -ne 0) {
        Fail "pg_dump failed."
    }

    Write-Host "Backup created: $dumpFile" -ForegroundColor Green
} else {
    Write-Step "Skipping backup as requested"
    if (-not (Test-Path $dumpFile)) {
        Write-Host "No local dump at default path: $dumpFile" -ForegroundColor Yellow
    }
}

if (-not $SkipRestore) {
    if (-not (Test-Path $dumpFile)) {
        Fail "Dump file not found at $dumpFile. Run backup step first or remove -SkipBackup."
    }

    Write-Step "Restoring dump to Supabase"
    pg_restore --clean --if-exists --no-owner --no-privileges --verbose --dbname "$targetWithSsl" "$dumpFile"
    if ($LASTEXITCODE -ne 0) {
        Fail "pg_restore failed."
    }

    Write-Host "Restore completed successfully" -ForegroundColor Green
} else {
    Write-Step "Skipping restore as requested"
}

if (-not $SkipVerify) {
    Write-Step "Verifying row counts on key tables"

    $tables = @(
        "players",
        "rooms",
        "cards",
        "game_decks",
        "turn_logs",
        "room_players",
        "kick_votes",
        "card_suggestions"
    )

    $hasMismatch = $false
    foreach ($table in $tables) {
        $sourceCount = Invoke-CountQuery -ConnectionString $sourceWithSsl -TableName $table
        $targetCount = Invoke-CountQuery -ConnectionString $targetWithSsl -TableName $table

        $status = "OK"
        $color = "Green"
        if ($sourceCount -ne $targetCount) {
            $status = "MISMATCH"
            $color = "Yellow"
            $hasMismatch = $true
        }

        Write-Host ("{0,-20} source={1,-8} target={2,-8} {3}" -f $table, $sourceCount, $targetCount, $status) -ForegroundColor $color
    }

    if ($hasMismatch) {
        Write-Host "Verification completed with mismatches. Review counts before cutover." -ForegroundColor Yellow
        exit 2
    }

    Write-Host "Verification passed: key table counts match." -ForegroundColor Green
} else {
    Write-Step "Skipping verification as requested"
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Migration workflow completed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Next: update Render service DATABASE_URL to Supabase and redeploy." -ForegroundColor Cyan
