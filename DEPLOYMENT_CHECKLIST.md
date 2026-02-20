# ✅ PostgreSQL Migration - Quick Checklist

**Status**: ✅ Backend Migration Complete | Ready for Render Deployment

---

## ✅ Completed (Agent)

### Code Migration
- [x] database.ts: SQLite → PostgreSQL Pool async
- [x] seed.ts: Async card seeding (79 cards)
- [x] logic.ts: ALL 20+ game functions async
- [x] api.ts: ALL 16+ REST routes async
- [x] handlers.ts: ALL 9 socket events + 2 helper functions async
- [x] Parameter binding: `?` → `$1, $2, $3...` (all routes)
- [x] Return value mapping: `.get()/.all()` → `.rows[0]/.rows`
- [x] Error handling: try/catch in all async contexts

### Dependencies
- [x] package.json: Added `pg@^8.11.0`
- [x] package.json: Removed `better-sqlite3`
- [x] npm install: ✅ Successful (16 packages)

### Validation
- [x] TypeScript build: **0 errors** ✅
- [x] Code review: All async patterns correct
- [x] GitHub ready: Code on main branch

---

## ⏳ To Do (You)

### Step 1: Create Render Account (5 min)
- [ ] Visit https://render.com
- [ ] Sign up with GitHub (NConley9)
- [ ] Confirm email

### Step 2: Create PostgreSQL Database (10 min)
- [ ] Render Dashboard → New → PostgreSQL
- [ ] Name: `pineapple-db`
- [ ] Plan: Free
- [ ] Region: Closest to you
- [ ] Create
- [ ] **COPY** Internal Database URL (contains password!)

### Step 3: Create Web Service (10 min)
- [ ] Render Dashboard → New → Web Service
- [ ] Connect GitHub → NConley9/PineapplePlayers
- [ ] Name: `pineapple-api`
- [ ] Root Directory: `server` ← **Important!**
- [ ] Build: `npm install && npm run build`
- [ ] Start: `node dist/index.js`
- [ ] Environment Variables:
  - [ ] `DATABASE_URL` = (paste from Step 2)
  - [ ] `NODE_ENV` = `production`
- [ ] Create
- [ ] **Wait for logs**: "🍍 Server running" ✓

### Step 4: Get Backend URL
- [ ] Copy from Render dashboard (e.g., `pineapple-api.onrender.com`)
- [ ] Update frontend environment files

### Step 5: Update Frontend (5 min)
- [ ] Edit `client/.env.production`:
  ```
  VITE_API_URL=https://pineapple-api.onrender.com
  VITE_SOCKET_URL=https://pineapple-api.onrender.com
  ```
- [ ] Edit `client/.env.development`:
  ```
  VITE_API_URL=http://localhost:3001
  VITE_SOCKET_URL=http://localhost:3001
  ```
- [ ] Rebuild: `cd client && npm run build`

### Step 6: Redeploy to GoDaddy (5 min)
- [ ] **Option A**: FTP upload `client/dist/` to `public_html`
- [ ] **Option B**: Deploy to GitHub Pages (auto-redirect domain)
- [ ] Verify: https://pineappleplayers.com loads

### Step 7: Test End-to-End (5 min)
- [ ] Load: https://pineappleplayers.com
- [ ] Create room → join room
- [ ] Start game → draw cards
- [ ] **Refresh page** → data persists (PostgreSQL, not SQLite!)
- [ ] Admin login: PineappleAdmin2026
- [ ] Play full game

---

## 📊 Architecture (After Deployment)

```
Frontend: pineappleplayers.com (GoDaddy)
    ↓ API/WebSocket
Backend: pineapple-api.onrender.com (Render)
    ↓ SQL Queries
Database: PostgreSQL (Render) — Persistent!
```

---

## 🔑 Key Documents

- **[RENDER_SETUP.md](RENDER_SETUP.md)**: Detailed step-by-step instructions
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)**: Technical details of all changes
- **[Docs/Agent-FSD.md](Docs/Agent-FSD.md)**: Full system architecture

---

## 💡 Important Notes

1. **DATABASE_URL** contains password — keep it private!
2. **Root Directory** must be `server` (not repo root)
3. **Build Command** must be `npm install && npm run build`
4. **env.production** vs **env.development**: Render uses production build
5. **No FTP credentials in code**: Keep .env local only

---

## ⚡ Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Backend won't start | Check Render logs for DATABASE_URL |
| Frontend 404 errors | Verify VITE_API_URL in .env.production |
| Socket.io won't connect | Check browser console, verify HTTPS (no HTTP) |
| Data lost after restart | Should not happen with PostgreSQL! |

---

## 🎯 Success Criteria

- [x] Backend builds with 0 errors
- [ ] Render PostgreSQL created
- [ ] Render web service running
- [ ] Frontend loads and connects to backend
- [ ] Game features work (create, join, play)
- [ ] Data persists across restarts
- [ ] Admin panel functional

---

## 📞 Support

- Detailed guide: **RENDER_SETUP.md** (this folder)
- Technical details: **MIGRATION_SUMMARY.md** (this folder)
- Render docs: https://render.com/docs
- PostgreSQL help: https://www.postgresql.org/docs/

---

**Ready to deploy! 🍍**

Start with: [RENDER_SETUP.md](RENDER_SETUP.md)
