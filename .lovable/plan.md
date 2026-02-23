

# Fix Pionex Signing Bugs + Sharpen Trading Prompt

## Part 1: Fix Pionex Signing in `ayn-unified/index.ts` (lines 1032-1044)

The `signReq` helper signs the raw path string (e.g., `/api/v1/market/tickers?symbol=X&timestamp=Y`) instead of signing `GET` + path with sorted params.

**Fix:** Replace `signReq` to:
1. Accept method + path + params as a Record
2. Sort params by key alphabetically
3. Sign `GET/api/v1/market/tickers?symbol=X&timestamp=Y` (method prepended, no newlines)

## Part 2: Fix Pionex Signing in `analyze-trading-chart/index.ts` (lines 220-228, 235-244, 256-258)

Same bug -- `signRequest` signs the raw path without `GET` prefix and params aren't sorted.

**Ticker fix (lines 206-207):** Currently strips `/USDT` but not `_USDT`. Will add detection: if ticker already contains `_USDT`, use it directly.

**Signing fix:** Replace `signRequest` with the correct implementation that prepends `GET` and sorts params.

**Both call sites** (klines at line 235-237 and tickers at line 256-258) will be updated to pass params as a Record and use the corrected signer.

## Part 3: Sharpen Trading Prompt in `systemPrompts.ts`

The trading-coach prompt (lines 160-380) will be updated:

**Keep unchanged:**
- All AYN branding, identity, and name references
- All knowledge base sections (Pattern Reliability, Smart Money Concepts, Wyckoff, Funding Rates, etc.)
- Position sizing rules
- Paper trading anti-fabrication rules
- Autonomous trading mode rules
- Security rules

**Changes:**
- Remove all disclaimer/hedging banned phrases that still leak through (the banned list stays but gets reinforced)
- Add sharper voice directives: "You talk like a prop desk trader. Blunt. Data-first. No softening. If a setup is trash, say it's trash."
- Add "Never re-introduce yourself mid-conversation. You already told them who you are."
- Add "Maintain full context across the conversation. Reference earlier messages naturally."
- Remove any remaining soft language like "strongly recommend stepping away" -- replace with direct trader speak
- Tighten emotional response section to be blunter (e.g., REVENGE: "Step away. You're tilted. Come back tomorrow." instead of the softer version)

## Part 4: Deploy

Deploy all three updated functions:
- `ayn-unified`
- `analyze-trading-chart`

Then verify via logs that signing is correct and prices are fresh.

## Files Modified

| File | What Changes |
|---|---|
| `supabase/functions/ayn-unified/index.ts` | Fix `signReq` helper (~lines 1032-1044) to use `GET` prefix + sorted params |
| `supabase/functions/analyze-trading-chart/index.ts` | Fix ticker format (lines 206-207) + fix `signRequest` (lines 220-244) + fix both call sites |
| `supabase/functions/ayn-unified/systemPrompts.ts` | Sharpen trading-coach voice, remove disclaimers, add context continuity rules |

