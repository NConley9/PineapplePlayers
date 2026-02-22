# Upload script - deploys built files to GoDaddy cPanel server
# Configuration
$sshKey = "$env:USERPROFILE\.ssh\godaddy-deploy"
$cPanelUser = "roqb8jo0zd8g"
$domain = "pineappleplayers.com"
$sshHost = "$cPanelUser@$domain"

$projectRoot = Split-Path -Parent $PSCommandPath
$frontendDist = "$projectRoot\client\dist"
$serverDist = "$projectRoot\server\dist"
$serverSrc = "$projectRoot\server\src"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying to GoDaddy cPanel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server: $sshHost" -ForegroundColor Yellow
Write-Host "Domain: $domain" -ForegroundColor Yellow

# Verify build artifacts exist
if (-not (Test-Path $frontendDist)) {
    Write-Host "ERROR: Frontend build not found at $frontendDist" -ForegroundColor Red
    Write-Host "Run .\deploy-build.ps1 first!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $serverDist)) {
    Write-Host "ERROR: Backend build not found at $serverDist" -ForegroundColor Red
    Write-Host "Run .\deploy-build.ps1 first!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/2] Uploading frontend (React build)..." -ForegroundColor Yellow
Write-Host "Source: $frontendDist" -ForegroundColor Gray
Write-Host "Targets: remote:~/public_html/pineappleplayers.com and remote:~/public_html" -ForegroundColor Gray

scp -r -i $sshKey "$frontendDist\*" "$sshHost`:~/public_html/pineappleplayers.com/" 2>&1 | Select-Object -First 5
scp -r -i $sshKey "$frontendDist\*" "$sshHost`:~/public_html/" 2>&1 | Select-Object -First 5
Write-Host "✓ Frontend uploaded" -ForegroundColor Green

Write-Host "`n[2/2] Uploading backend..." -ForegroundColor Yellow
Write-Host "Source: $serverDist, $serverSrc" -ForegroundColor Gray
Write-Host "Target: remote:~/pineapple-app/backend/" -ForegroundColor Gray

scp -r -i $sshKey "$serverDist" "$sshHost`:~/pineapple-app/backend/" 2>&1 | Select-Object -First 5
scp -r -i $sshKey "$projectRoot\server\package.json" "$sshHost`:~/pineapple-app/backend/" 2>&1
scp -r -i $sshKey "$projectRoot\server\package-lock.json" "$sshHost`:~/pineapple-app/backend/" 2>&1 | Select-Object -First 5

Write-Host "✓ Backend uploaded" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✓ Upload complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Run: .\deploy-setup-cpanel.ps1" -ForegroundColor Yellow
Write-Host "  2. Or manually configure Node.js app in cPanel:" -ForegroundColor Yellow
Write-Host "     - App: Node.js" -ForegroundColor Gray
Write-Host "     - App mode: production" -ForegroundColor Gray
Write-Host "     - Script: dist/index.js" -ForegroundColor Gray
Write-Host "     - Node version: 18+ (or latest available)" -ForegroundColor Gray
