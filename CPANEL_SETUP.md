# GoDaddy cPanel Node.js Setup Guide for Pineapple Players

## Quick Setup (Manual via cPanel GUI)

### 1. Create Node.js App in cPanel

**In GoDaddy cPanel:**
1. Go to **Setup Node.js App** (under Software)
2. Click **Create Application**
3. Configure:
   - **Node.js version:** 18.x (or latest available)
   - **Application mode:** production
   - **Application root:** `/home/roqb8jo0zd8g/pineapple-app/backend`
   - **Application startup file:** `dist/index.js`
   - **Application URL:** `pineappleplayers.com` (or your subdomain)

4. Click **Create**

### 2. Install Dependencies

Once app is created, cPanel will show you a terminal button. Click it and run:

```bash
cd ~/pineapple-app/backend
npm install --production
```

### 3. Verify Frontend

Frontend files should be in: `/home/roqb8jo0zd8g/public_html`

Access your app at: `https://pineappleplayers.com`

---

## Troubleshooting

**App won't start:**
- Check error logs in cPanel → Node.js App logs
- Verify `dist/index.js` exists: `ls -la ~/pineapple-app/backend/dist/`
- Verify `package.json` exists: `ls -la ~/pineapple-app/backend/`

**Frontend not loading:**
- Check that files are in `public_html`: `ls -la /home/roqb8jo0zd8g/public_html | head -10`
- Verify .htaccess for React routing (may need SSR or fallback)

**Database empty:**
- Database auto-creates on first run
- Check: `ls -la ~/pineapple-app/backend/pineapple.db`
- If not created, check seed.ts import in backend/dist/index.js

---

## Environment Variables (Optional)

If you need custom settings, add to cPanel Node.js App config:

```bash
NODE_ENV=production
PORT=5000
```

(cPanel handles port forwarding to your domain)

---

## Deployment Workflow

```powershell
# Local machine:
.\deploy-build.ps1      # Build React frontend + TypeScript backend
.\deploy-upload.ps1     # Upload to cPanel via SSH
# Then: Manual setup in cPanel GUI (see above)
```

---

## Files Uploaded

```
~/pineapple-app/
├── public_html/          # React frontend (served via cPanel)
│   ├── index.html
│   ├── assets/
│   └── ...
└── backend/              # Node.js backend
    ├── dist/             # Compiled JavaScript
    │   ├── index.js
    │   └── ...
    ├── package.json
    └── package-lock.json
```

---

## Direct SSH Commands (Alternative)

For manual control via SSH:

```bash
# Start app
pm2 start ~/pineapple-app/backend/dist/index.js --name pineapple

# Stop app
pm2 stop pineapple

# View logs
pm2 logs pineapple

# Restart
pm2 restart pineapple
```

Note: cPanel Node.js app management handles this automatically.
