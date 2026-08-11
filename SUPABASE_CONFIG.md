# Supabase Configuration — Zorvai (supabase-zorvai)

## Connection Details

| Property | Value |
|---|---|
| **Project Name** | supabase-zorvai |
| **Project Ref** | `kndoposozkemopyuavgb` |
| **Region** | `ap-south-1` |
| **API URL** | `https://kndoposozkemopyuavgb.supabase.co` |
| **Database Host** | `db.kndoposozkemopyuavgb.supabase.co` |
| **Postgres Version** | 17.6.1.155 |
| **Status** | ✅ ACTIVE_HEALTHY |
| **Created At** | 2026-08-10 |

## Auth Settings (current)
- Email sign-up: **Enabled**
- Phone sign-up: Disabled
- Social providers: All disabled (to be configured later)
- Signup: Enabled
- Auto-confirm email: Disabled (requires email verification)

## Environment Variables (for .env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://kndoposozkemopyuavgb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> ⚠️ **Never commit API keys to git.** Store them in `.env.local` (which should be in `.gitignore`).

## Connection Verification
- **Tested:** 2026-08-10
- **Auth endpoint:** ✅ 200 OK
- **Project status:** ✅ ACTIVE_HEALTHY
- **CLI linked:** ✅ via `supabase link --project-ref kndoposozkemopyuavgb`
