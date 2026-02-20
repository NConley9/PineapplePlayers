# 🔐 Environment Variables Reference

Complete guide to setting up environment variables for PostgreSQL + Render deployment.

---

## Backend (Render Web Service)

### Required Variables

```env
# Database Connection
DATABASE_URL=postgresql://user:password@host:5432/pineapple

# Application Environment  
NODE_ENV=production
```

### Where to set:
1. Render Dashboard
2. Select `pineapple-api` service
3. Click "Environment"
4. Add variables listed above

### DATABASE_URL Format

When you create PostgreSQL on Render, you'll see:

```
Internal Database URL:
postgresql://pineapple_user:LongPasswordHere@dpg-xxxxx.render.internal:5432/pineapple
```

**Copy the entire string** and paste in Render web service environment.

---

## Frontend (Development)

### File: `client/.env.development`

```env
# Local development (localhost)
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Use case:
- `npm run dev` in client folder
- Connects to backend on localhost:3001
- For local testing with local backend

---

## Frontend (Production)

### File: `client/.env.production`

```env
# Production (Render backend)
VITE_API_URL=https://pineapple-api.onrender.com
VITE_SOCKET_URL=https://pineapple-api.onrender.com
```

### Use case:
- `npm run build` in client folder
- Connects to Render backend
- For deployed version on GoDaddy pineapplayers.com

### How to find your Render backend URL:
1. Render Dashboard
2. Select `pineapple-api` service
3. URL appears at top of page (e.g., `https://pineapple-api.onrender.com`)

---

## Local Development Setup

### If running backend locally (useful for testing):

**Backend**: `server/src/db/database.ts`

The code expects `DATABASE_URL` env variable. For local development, you can:

```bash
# Option 1: Set environment variable before running
export DATABASE_URL=postgresql://localhost:5432/pineapple
node dist/index.js

# Option 2: Create .env file in server/
# (Note: Never commit .env files!)
```

But for production, Render handles this via web service settings.

---

## Vite Environment Variables

### Frontend Access

In React code, use:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const socketUrl = import.meta.env.VITE_SOCKET_URL;

// Example: 
// In development: http://localhost:3001
// In production: https://pineapple-api.onrender.com
```

### Important Notes:
- Variables must start with `VITE_` to be injected into frontend
- Other variables are ignored (for security)
- Not set at runtime in browser (only at build time)

---

## Deployment Checklist

### Before deploying to Render:

- [ ] `DATABASE_URL` is set in Render web service environment
- [ ] `NODE_ENV=production` is set (optional but recommended)
- [ ] Backend pushes to `main` branch (Render auto-deploys from main)

### Before redeploying frontend to GoDaddy:

- [ ] `.env.production` has correct `VITE_API_URL`
- [ ] `.env.production` has correct `VITE_SOCKET_URL`
- [ ] Ran `npm run build` to inject variables
- [ ] Uploaded new `dist/` folder to GoDaddy

---

## Security Best Practices

⚠️ **IMPORTANT REMINDERS**:

1. **Never commit `.env` files** to Git
   - Add to `.gitignore`:
     ```
     .env
     .env.local
     .env.*.local
     ```

2. **DATABASE_URL contains credentials**
   - Only set in Render dashboard (not in code)
   - Don't share publicly

3. **Production URL** (`VITE_API_URL`)
   - Safe to commit in code
   - No credentials, just domain name

4. **Local development URL** (`VITE_API_URL=localhost:3001`)
   - Safe to commit
   - Uses default local port

---

## Quick Copy-Paste Template

### For Render Web Service Setup

```env
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/pineapple
NODE_ENV=production
```

Replace `[USER]`, `[PASSWORD]`, `[HOST]` from Render PostgreSQL page.

### For client/.env.production (After Render setup)

```env
VITE_API_URL=https://pineapple-api.onrender.com
VITE_SOCKET_URL=https://pineapple-api.onrender.com
```

### For client/.env.development (Always)

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

## Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` in Render settings
- Verify PostgreSQL is still running (Render Dashboard → Databases)
- Check backend logs: Render → pineapple-api → Logs

### "API returns 404 / Cannot reach backend"
- Verify `VITE_API_URL` in `.env.production`
- Rebuild frontend: `npm run build`
- Check backend is running (Render logs)

### "Socket.io won't connect"
- Ensure `VITE_SOCKET_URL` matches `VITE_API_URL`
- Must use HTTPS (not HTTP) for production
- No port needed (Render proxy handles it)

---

## Environment Variable Priority

Render processes env vars **in this order** (first match wins):

1. Service-specific (web service environment settings)
2. Team/organization defaults (Render account settings)
3. Build-time defaults (in Dockerfile, if any)

For this project, we only use **service-specific** settings (step 1).

---

## Reference: All Variables Used

| Variable | Used By | Value | Type |
|----------|---------|-------|------|
| `DATABASE_URL` | Backend | PostgreSQL connection string | Secret |
| `NODE_ENV` | Backend | `production` | Public |
| `VITE_API_URL` | Frontend (build time) | Render backend URL | Public |
| `VITE_SOCKET_URL` | Frontend (build time) | Render backend URL | Public |

---

## Further Reading

- **Render Docs on Environment Variables**: https://render.com/docs/environment-variables
- **Vite Env Variables**: https://vitejs.dev/guide/env-and-mode.html
- **PostgreSQL Connection Strings**: https://www.postgresql.org/docs/current/libpq-connect.html

---

**Ready to set up? Start with [RENDER_SETUP.md](RENDER_SETUP.md)** 🍍
