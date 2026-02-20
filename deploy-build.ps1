# Build script for Pineapple Players deployment
# Builds the React frontend and prepares files for upload

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Pineapple Players for Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $PSCommandPath

# Step 1: Build frontend
Write-Host "`n[1/3] Building React frontend..." -ForegroundColor Yellow
cd "$projectRoot\client"
npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend built successfully" -ForegroundColor Green

# Step 2: Compile backend TypeScript
Write-Host "`n[2/3] Compiling backend TypeScript..." -ForegroundColor Yellow
cd "$projectRoot\server"
npx tsc 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend compilation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend compiled successfully" -ForegroundColor Green

# Step 3: Summary
Write-Host "`n[3/3] Build summary:" -ForegroundColor Yellow
Write-Host "  Frontend: $projectRoot\client\dist\" -ForegroundColor Cyan
Write-Host "  Backend:  $projectRoot\server\dist\" -ForegroundColor Cyan
Write-Host "  Ready to deploy with: .\deploy-upload.ps1" -ForegroundColor Cyan

Write-Host "`n✓ Build complete! Ready for deployment." -ForegroundColor Green
