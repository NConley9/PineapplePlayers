# SSH-based deployment without cPanel Node.js addon
# Uses pm2 process manager to keep app running

$sshKey = "$env:USERPROFILE\.ssh\godaddy-deploy"
$sshHost = "roqb8jo0zd8g@pineappleplayers.com"

Write-Host "Setting up Node.js app with pm2..." -ForegroundColor Cyan

# Step 1: Install pm2 globally
Write-Host "`n[1/3] Installing pm2 (process manager)..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
cd ~/pineapple-app/backend
npm install -g pm2 2>&1 | tail -5
"@
Write-Host "✓ pm2 installed" -ForegroundColor Green

# Step 2: Start the app with pm2
Write-Host "`n[2/3] Starting app with pm2..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
cd ~/pineapple-app/backend
pm2 start dist/index.js --name pineapple --env production
pm2 logs pineapple --lines 10
"@
Write-Host "✓ App started" -ForegroundColor Green

# Step 3: Set pm2 to auto-start on reboot
Write-Host "`n[3/3] Configuring auto-start on server reboot..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
pm2 startup
pm2 save
echo 'Auto-start enabled'
"@
Write-Host "✓ Auto-start configured" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✓ Node.js app is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nYour app should be live at: https://pineappleplayers.com" -ForegroundColor Cyan
Write-Host "`nUseful commands:" -ForegroundColor Yellow
Write-Host "  pm2 logs pineapple              # View live logs" -ForegroundColor Gray
Write-Host "  pm2 stop pineapple              # Stop app" -ForegroundColor Gray
Write-Host "  pm2 restart pineapple          # Restart app" -ForegroundColor Gray
Write-Host "  pm2 delete pineapple           # Remove from pm2" -ForegroundColor Gray
