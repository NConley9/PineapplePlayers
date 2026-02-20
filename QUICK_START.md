# 🚀 Quick Start: Deploy to Render in 5 Steps

**Time**: 35 minutes | **Cost**: $0 | **Complexity**: Easy

---

## Step 1️⃣: Create Render Account (5 min)

```
Go to → https://render.com
        ↓
   Click "Sign up"
        ↓
   Select "GitHub"
        ↓
   Authorize
        ↓
   Confirm email
        ✅ Done!
```

---

## Step 2️⃣: Create PostgreSQL Database (10 min)

```
Render Dashboard
        ↓
   Click "+ New"
        ↓
   Select "PostgreSQL"
        ↓
   Name: pineapple-db
   Plan: Free
        ↓
   Create
        ↓
   Wait 1-2 min
        ↓
   Copy "Internal Database URL"
        ↓
   Save this! ⬅️ DATABASE_URL
        ✅ Done!
```

**Example DATABASE_URL**:
```
postgresql://user:password@host:5432/pineapple
```

---

## Step 3️⃣: Create Web Service (10 min)

```
Render Dashboard
        ↓
   Click "+ New"
        ↓
   Select "Web Service"
        ↓
   Connect GitHub → NConley9/PineapplePlayers
        ↓
   Configure:
   • Name: pineapple-api
   • Root Directory: server ⬅️ IMPORTANT!
   • Build: npm install && npm run build
   • Start: node dist/index.js
   • Plan: Free
        ↓
   "Add Environment Variable":
   • DATABASE_URL = (paste from Step 2)
   • NODE_ENV = production
        ↓
   Click "Create Web Service"
        ↓
   Wait 2-3 min for build
        ↓
   See "🍍 Server running" in logs ✅
        ↓
   Copy service URL: pineapple-api.onrender.com
        ✅ Done!
```

---

## Step 4️⃣: Update Frontend (5 min)

### File: `client/.env.production`
```env
VITE_API_URL=https://pineapple-api.onrender.com
VITE_SOCKET_URL=https://pineapple-api.onrender.com
```

### File: `client/.env.development`
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Rebuild:
```bash
cd client
npm run build
```

✅ Done!

---

## Step 5️⃣: Redeploy to GoDaddy (5 min)

### Option A: FTP Upload (Easiest)

```
1. Open FTP client
2. Connect (host/user/password from GoDaddy)
3. Navigate to public_html folder
4. Delete old files
5. Upload new client/dist/ contents
6. Done!
```

### Option B: Command Line

```bash
# If you have FTP credentials in a script
./deploy-upload.ps1
```

✅ Done!

---

## Step 6️⃣: Test! (5 min)

```
✅ Open: https://pineappleplayers.com
✅ Create room: see room code
✅ Join from different tab/device: other player appears
✅ Start game: turn order shows
✅ Draw cards: cards appear from DB
✅ Refresh page: data still there (not lost!)
✅ Admin login: use password PineappleAdmin2026
✅ Play full game: work without errors
```

**If everything works** → You're done! 🎉

---

## 🆘 Troubleshooting (Quick Fixes)

| Problem | Fix |
|---------|-----|
| Backend won't start | Check Render logs for DATABASE_URL error |
| Frontend 404 errors | Verify VITE_API_URL in .env.production |
| Socket won't connect | Ensure URL is HTTPS (not HTTP) |
| Data disappeared | Should not happen with PostgreSQL! Check Render logs |

**Detailed help**: [RENDER_SETUP.md](RENDER_SETUP.md)

---

## 📋 Checklist

- [ ] Step 1: Render account created
- [ ] Step 2: PostgreSQL database deployed → DATABASE_URL copied
- [ ] Step 3: Web service created → Backend URL copied
- [ ] Step 4: Frontend .env files updated → `npm run build` successful
- [ ] Step 5: GoDaddy redeployed
- [ ] Step 6: End-to-end testing passed ✅

---

## 📚 More Detailed Help

- **Full guide**: [RENDER_SETUP.md](RENDER_SETUP.md)
- **Reference**: [ENV_VARIABLES.md](ENV_VARIABLES.md)  
- **Technical**: [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
- **Status**: [STATUS.md](STATUS.md)

---

## 🎯 Success = 

**Backend on Render + PostgreSQL + Frontend on GoDaddy = Live! 🍍**

---

**Start now**: [Step 1 → Create Render Account](https://render.com)

**Est. time**: 35 minutes

**Cost**: Free

**Go! 🚀**
