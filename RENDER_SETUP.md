# 🍍 Render Deployment Guide: Pineapple Players

**Status**: ✅ Backend fully migrated to PostgreSQL async/await. Ready to deploy!

Your backend code is now **fully converted to async/await** and compiled successfully (**0 TypeScript errors**). This guide walks you through deploying to Render.com with a managed PostgreSQL database.

---

## ✅ What's Done

- [x] Backend migrated from SQLite → PostgreSQL
- [x] All database calls converted to async/await (`pg` client)
- [x] REST API routes updated (16+ routes)
- [x] Socket.io handlers updated (9+ handlers)
- [x] TypeScript build: **0 errors**
- [x] Code ready for GitHub auto-deploy

---

## 📋 What You Need to Do

1. Create a Render account
2. Create a PostgreSQL database on Render
3. Create a Node.js web service linked to your GitHub repo
4. Update frontend endpoints
5. Redeploy frontend to GoDaddy
6. Test end-to-end

**Total time: ~30 minutes**

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Render Account

1. **Visit**: https://render.com
2. **Sign Up** → "Sign up with GitHub"
3. **Authorize** Render to access GitHub (NConley9)
4. **Confirm email** and you're done!

---

### Step 2: Create PostgreSQL Database

1. In Render dashboard, click **"New +"** (top-right)
2. Select **"PostgreSQL"**
3. **Configure**:
   - **Name**: `pineapple-db`
   - **Database**: (auto-fills, leave blank)
   - **User**: (auto-fills, leave blank)
   - **Region**: Choose closest to you
   - **Version**: 15
   - **Plan**: Free ($0/month, 512MB)

4. Click **"Create Database"**
5. **Wait 1-2 minutes** for creation

6. **Copy the connection string**:
   - Look for "Internal Database URL"
   - Format: `postgresql://user:password@host:5432/pineapple`
   - **⚠️ Keep this private!** It contains credentials.

**Save this URL somewhere safe** — you'll need it in the next step.

---

### Step 3: Create Node.js Web Service

1. Click **"New +"** → **"Web Service"**
2. **Connect GitHub**:
   - Click "Connect a repository"
   - Select `NConley9/PineapplePlayers`
   - Authorize if prompted

3. **Configure Service**:
   - **Name**: `pineapple-api`
   - **Region**: Same as database (or nearby)
   - **Branch**: `main`
   - **Root Directory**: `server` ← **Important!**
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Plan**: Free

4. **Add Environment Variables**:
   - Click "Add Environment Variable"
   - **Key**: `DATABASE_URL`
   - **Value**: (Paste the PostgreSQL URL from Step 2)
   - Click "Add"
   
   - Add another:
   - **Key**: `NODE_ENV`
   - **Value**: `production`
   - Click "Add"

5. Click **"Create Web Service"**

6. **Watch the deployment**:
   - Click "Logs" tab
   - You'll see:
     ```
     Building...
     Running: npm install && npm run build
     Running: node dist/index.js
     🍍 Server running on 3001
     ✅ Seeded 79 cards...
     ```
   - When you see "🍍 Server running," backend is live! ✓

7. **Get your backend URL** (appears at top of page):
   ```
   https://pineapple-api.onrender.com
   ```
   **Save this!**

---

### Step 4: Update Frontend Environment

Your frontend currently points to `localhost:3001`. Update it:

#### Update `.env.production` and `.env.development`

**File**: `client/.env.production`
```env
VITE_API_URL=https://pineapple-api.onrender.com
VITE_SOCKET_URL=https://pineapple-api.onrender.com
```

**File**: `client/.env.development`
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

#### Verify Code Uses Env Vars

Make sure these files reference the env variables:

**client/src/lib/api.ts**:
```typescript
const API_BASE = import.meta.env.VITE_API_URL;
// Use API_BASE in all fetch() calls
```

**client/src/lib/socket.ts**:
```typescript
const SOCKET_SERVER = import.meta.env.VITE_SOCKET_URL;
const socket = io(SOCKET_SERVER, { /* options */ });
```

#### Rebuild Frontend

```bash
cd client
npm run build
```

This creates optimized files in `client/dist/`

---

### Step 5: Redeploy to GoDaddy

Your frontend is currently at `pineappleplayers.com`. Upload the new build:

#### Option A: FTP (Easiest for GoDaddy)

1. **Open FTP client** (FileZilla, WinSCP, etc.)
2. **Connect**:
   - Host: Your GoDaddy FTP host (from cPanel)
   - Username: Your GoDaddy FTP username
   - Password: Your GoDaddy FTP password

3. **Upload**:
   - Navigate to `public_html` or `www` folder
   - Delete old files (or backup first)
   - Upload contents of `client/dist/`

4. **Verify**: Visit `https://pineappleplayers.com` — should load with Render backend ✓

#### Option B: Git + GitHub Pages (Optional)

If you prefer automatic deploys:
```bash
npm install -g gh-pages
npm run build
git add dist/
git commit -m "deploy: frontend to GitHub Pages"
npx gh-pages -d client/dist
```

Then update your GoDaddy domain to point to GitHub Pages.

---

### Step 6: End-to-End Testing

Your stack is now complete:

```
Frontend:   https://pineappleplayers.com (GoDaddy)
Backend:    https://pineapple-api.onrender.com (Render)
Database:   PostgreSQL on Render (persistent!)
```

#### Test Checklist

- [ ] **Load game**: Visit `https://pineappleplayers.com`
- [ ] **Create room**: Enter room name → get room code
- [ ] **Join from another device/incognito tab**: Enter code → see other player
- [ ] **Start game**: View turn order
- [ ] **Draw cards**: Cards appear from database
- [ ] **Logout + refresh**: Data persists (would be lost with SQLite)
- [ ] **Admin panel**: Log in with `PineappleAdmin2026`
  - View analytics
  - View/edit cards
  - Import cards
- [ ] **Multiplayer gameplay**: Play a full game, verify all actions sync

#### Verify Backend is Running

1. Render dashboard → `pineapple-api` service
2. **Logs** tab → you should see your API calls:
   ```
   POST /api/rooms
   POST /api/rooms/join
   Socket: player_joined
   Socket: draw_cards
   ```

---

## 🔍 Troubleshooting

### Problem: Backend won't start / "Cannot connect to database"

**Symptoms**: Render logs show `Error: connect ECONNREFUSED`

**Fix**:
1. Copy correct `DATABASE_URL` from Render PostgreSQL page
2. Render Dashboard → `pineapple-api`
3. Click "Environment" → Update `DATABASE_URL`
4. Render automatically redeploys (check logs)

### Problem: Frontend can't reach backend / "Network error"

**Symptoms**: Game creates room but can't join, API calls 404

**Fix**:
1. Check `VITE_API_URL` in `.env.production`
2. Rebuild: `cd client && npm run build`
3. Redeploy to GoDaddy
4. Check browser DevTools → Network tab → API requests point to `pineapple-api.onrender.com`

### Problem: Socket.io won't connect / "WebSocket connection failed"

**Symptoms**: Game loads but no real-time updates

**Fix**:
1. Verify `VITE_SOCKET_URL` matches backend: `https://pineapple-api.onrender.com`
2. Ensure it's **HTTPS, not HTTP**
3. No port needed (Render handles proxy)

### Problem: Data not persisting / "Cards disappeared after restart"

**Symptoms**: Games were there, then disappeared after Render restart

**This means you're still on SQLite** (local file).

**Fix**:
1. Verify Render is actually running (check logs)
2. Confirm `DATABASE_URL` points to Render PostgreSQL, not local file
3. Check for `postgresql://` in DATABASE_URL (not `sqlite`)

---

## 📊 Monitoring

### View Live Logs

Render Dashboard → `pineapple-api` → **Logs** tab

Live updates as players join, draw cards, vote, etc.

### View Metrics

Render Dashboard → `pineapple-api` → **Metrics** tab

CPU, RAM, bandwidth usage (free tier rarely hits limits)

---

## 🚀 Future Deployments

Every time you update the backend:

```bash
cd server
npm run build  # ← Test locally first
git add .
git commit -m "feat: add new feature"
git push origin main
```

Render auto-deploys within 1-2 minutes. Check logs to confirm!

---

## 💰 Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Web Service | Yes, 750 hrs/month | $0 |
| PostgreSQL | 512MB storage | $0 |
| HTTPS/SSL | Yes | $0 |
| **Total** | | **$0** |

Free tier is sufficient for development and small player bases.

---

## ✅ Success Criteria

You're done when:

1. ✅ Backend logs show "🍍 Server running"
2. ✅ Frontend loads at pineappleplayers.com
3. ✅ Can create room, join, see players
4. ✅ Draw cards, play game
5. ✅ Refresh without losing data (PostgreSQL persists)
6. ✅ Admin panel works with password login

**Celebrate! You now have a production-ready multiplayer game. 🍍**

---

## 📚 Next Steps (Optional)

- **Custom domain**: Already using pineappleplayers.com ✓
- **SSL/HTTPS**: Render provides free SSL ✓
- **Automatic backups**: Render PostgreSQL includes daily backups ✓
- **Team invites**: Render → Settings → Share dashboard access
- **Monitoring**: Set up email alerts for errors (Render → Alert Rules)

---

## 🆘 Need Help?

- **Render docs**: https://render.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Node.js**: Check `npm run build` output and Render logs

**You've got this! 🍍**

