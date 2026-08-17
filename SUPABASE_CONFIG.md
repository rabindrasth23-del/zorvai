# Supabase Configuration — Zorvai (supabase-zorvai)

## Connection Details

| Environment | Name | Project Ref | Region | Database Host | Status |
|---|---|---|---|---|---|
| Remote (Cloud) | supabase-zorvai | `kndoposozkemopyuavgb` | `ap-south-1` | `db.kndoposozkemopyuavgb.supabase.co` | ACTIVE_HEALTHY |
| Local (Docker) | local | n/a | n/a | `127.0.0.1:54322` | ONLINE |

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

## Useful CLI Commands

- Start local dev: `npx supabase start`
- Stop local dev: `npx supabase stop`
- Sync local to remote: `npx supabase db push`
- Pull remote schema: `npx supabase db pull`
- Create migration: `npx supabase migration new <name>`
- Reset local DB: `npx supabase db reset`
- Generate types: `npm run update-types`

## Useful Links

- [Zorvai Remote Dashboard](https://supabase.com/dashboard/project/kndoposozkemopyuavgb)
- [Local Studio (when running)](http://127.0.0.1:54323)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)

## Connection Verification
- **Tested:** 2026-08-10
- **Auth endpoint:** ✅ 200 OK
- **Project status:** ✅ ACTIVE_HEALTHY
- **CLI linked:** ✅ via `supabase link --project-ref kndoposozkemopyuavgb`
