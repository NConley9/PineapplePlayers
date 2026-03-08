# Supabase Cutover (Render PostgreSQL -> Supabase)

This project now includes an automation script to migrate your database:

- migrate-render-to-supabase.ps1

## 1) Prerequisites

Install PostgreSQL client tools on your machine so these commands exist on PATH:

- pg_dump
- pg_restore
- psql

Windows option:

- Install PostgreSQL from postgresql.org and include command line tools.

## 2) Freeze window

Before migration, schedule a short freeze window (10-20 minutes):

- Do not create/join/play games during migration.
- Keep backend online until dump completes.

## 3) Run migration script

From project root:

PowerShell:

$source = "postgresql://RENDER_USER:RENDER_PASS@RENDER_HOST:5432/RENDER_DB"
$target = "postgresql://postgres:SUPABASE_PASS@db.YOUR_SUPABASE_HOST.supabase.co:5432/postgres"

./migrate-render-to-supabase.ps1 -SourceDatabaseUrl $source -TargetDatabaseUrl $target

What it does:

1. Creates a local backup dump under .migration/TIMESTAMP
2. Restores dump into Supabase
3. Compares row counts across key game tables

If verification reports mismatches, stop and investigate before cutover.

## 4) Cut over Render backend

After migration succeeds:

1. Render dashboard -> pineapple-api -> Environment
2. Update DATABASE_URL to Supabase direct Postgres URL
3. Keep NODE_ENV=production
4. Trigger redeploy (or save env var to auto-redeploy)

## 5) Smoke test

After redeploy:

- Open app and create a room
- Join from second session
- Draw cards
- Verify admin analytics and cards page loads

## 6) Rollback

If issues appear:

1. Set DATABASE_URL back to Render external URL
2. Redeploy pineapple-api
3. Confirm gameplay works

## 7) Security cleanup

Credentials were shared during setup. Rotate both now:

- Render DB password
- Supabase DB password

Then update any environment values that depend on those passwords.
