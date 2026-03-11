

# Edge Function Status for the Intelligence System

## What EXISTS (code is there)

| Component | File | Status |
|---|---|---|
| `ayn-pulse-engine` | `supabase/functions/ayn-pulse-engine/index.ts` (537 lines) | Code exists, fetches FRED, Alpha Vantage, Pionex, GDELT, Fear & Greed, Polymarket, Firecrawl |
| `ayn_market_snapshot` table | `supabase/migrations/20260311000001_ayn_market_snapshot.sql` | Migration exists |
| Snapshot injection in `ayn-unified` | Lines 402-406 | Reads snapshot and injects into context |

## What's BLOCKING deployment

### 1. `ayn-pulse-engine` is NOT in `config.toml`
The function folder exists but has no entry in `supabase/config.toml`. Without this, it won't deploy.

**Fix:** Add `[functions.ayn-pulse-engine]` with `verify_jwt = false` to `config.toml`.

### 2. `ayn-pulse-engine` uses deprecated `serve` import
Line 1: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"` — this causes build failures. Must switch to `Deno.serve()`.

### 3. `send-usage-alert` uses `npm:resend` (existing build error)
Line 2: `import { Resend } from "npm:resend@2.0.0"` — must change to `https://esm.sh/resend@2.0.0`.

### 4. No `pg_cron` job set up
The pulse engine needs to run every 4 hours automatically. No cron job has been created yet.

### 5. API keys may not be configured
`ayn-pulse-engine` needs `FRED_API_KEY` and `ALPHA_VANTAGE_API_KEY` as Supabase secrets. These need to be verified/added.

## Fix Plan (build order)

1. **Fix `ayn-pulse-engine/index.ts`** — replace `serve` import with `Deno.serve()`
2. **Fix `send-usage-alert/index.ts`** — replace `npm:resend` with `esm.sh/resend`
3. **Add `ayn-pulse-engine` to `config.toml`** + add other 17 missing function entries, remove 6 orphaned entries
4. **Verify/add API keys** — `FRED_API_KEY`, `ALPHA_VANTAGE_API_KEY` as Supabase secrets
5. **Set up `pg_cron` job** — trigger pulse engine every 4 hours

Once these 5 items are done, the full intelligence system goes live.

