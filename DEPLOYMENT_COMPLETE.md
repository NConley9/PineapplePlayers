# Pineapple Players - GoDaddy cPanel Deployment Checklist

## ✅ Completed

- ✓ Built React frontend (dist/ folder)
- ✓ Compiled TypeScript backend (dist/ folder)
- ✓ Created directories on cPanel server
- ✓ Uploaded frontend files to `~/pineapple-app/public_html/`
- ✓ Uploaded backend files to `~/pineapple-app/backend/dist/`
- ✓ Uploaded package.json to backend directory

**Files on Server:**
```
~/pineapple-app/
├── public_html/
│   ├── index.html
│   ├── assets/
│   │   ├── icon-*.png (1.5 MB)
│   │   ├── logo-*.png (1.6 MB)
│   │   ├── index-*.js (~320 KB)
│   │   └── index-*.css (~40 KB)
│   └── ...
└── backend/
    ├── package.json
    ├── dist/
    │   ├── index.js (main entry point)
    │   ├── db/
    │   ├── routes/
    │   ├── socket/
    │   ├── game/
    │   └── services/
```

---

## ⏳ Next: cPanel Node.js App Setup

**IMPORTANT:** GoDaddy's cPanel Node.js app management will handle npm install automatically.

### Steps:

1. **Log in to GoDaddy cPanel:** https://www.godaddy.com/
2. **Go to:** cPanel → **Setup Node.js App** (under Software section)
3. **Click:** Create Application
4. **Fill in:**
   - **Node.js version:** 18.x or 20.x (or latest available)
   - **Application mode:** production
   - **Application root:** `/home/roqb8jo0zd8g/pineapple-app/backend`
   - **Application startup file:** `dist/index.js`
   - **Application URL:** `pineappleplayers.com`

5. **Click:** Create

### After Creation:

cPanel will:
- Display your app status
- Auto-run `npm install` for you
- Start the Node.js server
- Route traffic from your domain to the app

---

## ✅ Frontend Verification

Your React app should be served directly from:
- `https://pineappleplayers.com/`

Files are already in `public_html/` ready to serve.

---

## 🔍 Verify Deployment

Once Node.js app is created in cPanel:

1. **Check app status in cPanel** → Should show "Running"
2. **Visit your domain** → React app should load
3. **Check the logs** in cPanel Node.js App → Should see seeding output:
   ```
   Seeded 79 cards: core/challenge: 5, core/dare: 17, ...
   Server running on port X (managed by cPanel)
   ```

---

## 🐛 Troubleshooting

**App won't start:**
- Check **cPanel Node.js App logs** for errors
- Common issue: wrong `Application startup file` path
- Should be: `dist/index.js` (NOT `src/index.ts`)

**Frontend shows blank page:**
- Open browser DevTools (F12) → Console tab
- Check for errors connecting to backend
- Backend should be at same domain + port assigned by cPanel

**Database issues:**
- Database auto-creates on first run
- Check file: `~/pineapple-app/backend/pineapple.db`
- If missing, restart app from cPanel

---

## 📋 Your Login Info

```
Domain: pineappleplayers.com
cPanel User: roqb8jo0zd8g
SSH Host: roqb8jo0zd8g@pineappleplayers.com
SSH Key: ~/.ssh/godaddy-deploy
```

---

## 🚀 Future Deployments

After initial setup, to re-deploy:

```powershell
# On your Windows machine:
.\deploy-build.ps1      # Build React + compile TypeScript
.\deploy-upload.ps1     # Upload to cPanel

# Then restart from cPanel GUI (or via SSH):
ssh -i ~/.ssh/godaddy-deploy roqb8jo0zd8g@pineappleplayers.com \
  "curl http://localhost:PORT/api/health"
```

---

## 📞 Support

- **GoDaddy cPanel Help:** https://www.godaddy.com/help
- **Node.js setup issues:** Check cPanel logs first
- **App won't start:** Verify `dist/index.js` exists: `ssh ... "ls -la ~/pineapple-app/backend/dist/index.js"`
