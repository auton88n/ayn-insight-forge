

# Fix: 4-Hour Kline Data Delay + Ticker Bug + Build Error

## Root Causes Identified

### Issue 1: Incorrect Pionex HMAC Signing (Likely Cause of 4-Hour Delay)

According to the [Pionex API documentation](https://pionex-doc.gitbook.io/apidocs/restful/general/authentication), the signing process requires:

1. Sort query parameters by ASCII key order
2. Concatenate them with `&` after the PATH with `?` to form `PATH_URL`
3. **Concatenate `METHOD` directly before `PATH_URL`** (no newlines)
4. HMAC-SHA256 the result

**Correct format:** `GET/api/v1/market/klines?interval=60M&limit=100&symbol=BTC_USDT&timestamp=1234567890`

All three signing implementations in the codebase are wrong:

| File | Current signing format | Problem |
|---|---|---|
| `get-klines/index.ts` | Signs `/api/v1/market/klines?symbol=...&timestamp=...` | Missing `GET` prefix; params not sorted by key |
| `marketScanner.ts` (`fetchKlines`) | Signs `GET\n/path\n{query}` | Uses newlines instead of direct concatenation; params not sorted |
| `ayn-monitor-trades` | Signs `/api/v1/market/tickers?symbol=...&timestamp=...` | Missing `GET` prefix; params not sorted |
| `ayn-unified` (`scanMarketOpportunities`) | Signs `/api/v1/market/tickers?timestamp=...` | Missing `GET` prefix |

The API may still return data (market endpoints might be semi-public), but incorrect signing could cause the API to return cached/stale data rather than the freshest candles, explaining the consistent 4-hour lag.

### Issue 2: Ticker Format Bug in `ayn-monitor-trades`

The `getCurrentPrice()` function at line 46-47 uses regex `/\/USDT|\/USD|\/BUSD/i` to strip suffixes. Since database tickers use underscores (e.g., `DEGO_USDT`), the regex never matches, producing `DEGO_USDT_USDT` -- a nonexistent pair. The monitor has never successfully fetched a price for any open trade.

### Issue 3: Build Error in `admin-notifications`

Line 2 uses `npm:resend@2.0.0` which fails in the Deno bundler. Needs to be switched to an ESM import.

---

## Implementation Plan

### Step 1: Create a Shared Correct Signing Function

All Pionex API calls will use the same correct signing logic:

```typescript
async function signPionexRequest(
  method: string,  // "GET" or "POST"
  path: string,    // "/api/v1/market/klines"
  params: Record<string, string>,  // { symbol: "BTC_USDT", interval: "60M", ... }
  secret: string
): Promise<{ signature: string; queryString: string }> {
  // Sort params by key (ASCII ascending) -- Pionex requirement
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  const pathUrl = `${path}?${queryString}`;
  const message = `${method}${pathUrl}`;  // e.g. "GET/api/v1/market/klines?interval=60M&..."
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signature = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return { signature, queryString };
}
```

### Step 2: Fix Files

| File | Changes |
|---|---|
| **`supabase/functions/get-klines/index.ts`** | Replace `signPionexRequest` with the correct version using sorted params and `GET` prefix |
| **`supabase/functions/ayn-unified/marketScanner.ts`** | Fix `fetchKlines` signing: remove `GET\n...\n...` format, use correct `GET/path?sorted_params` format |
| **`supabase/functions/ayn-unified/index.ts`** | Fix `scanMarketOpportunities` signing for the tickers endpoint |
| **`supabase/functions/ayn-monitor-trades/index.ts`** | Fix ticker parsing (line 46-47): detect `_USDT` format and use as-is; fix signing for tickers endpoint |
| **`supabase/functions/admin-notifications/index.ts`** | Change `npm:resend@2.0.0` to `https://esm.sh/resend@2.0.0` |

### Step 3: Deploy and Verify

Deploy all 4 affected edge functions and check logs to confirm:
- Last candle age is under 60-120 seconds (not 4 hours)
- Monitor successfully fetches prices for open trades
- Admin notifications build without errors

---

## Expected Outcome

- Kline data will be fresh (under ~2 minutes old for 1-minute candles)
- The 4-hour delay will be eliminated
- Trade monitor will correctly fetch prices for all open positions (stop-loss and take-profit will actually trigger)
- Admin notifications edge function will build successfully

