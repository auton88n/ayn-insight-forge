
# Fix: Balance Must Reflect Capital Deployed in Open Positions

## Two Separate Issues

### Issue 1: Balance Shows $10,000 When $5,000 Is Deployed (Real Bug)

The `ayn-open-trade` edge function inserts a trade row but **never deducts the position size from `current_balance`** in `ayn_account_state`. The `update_ayn_account_state` trigger only fires when a trade is CLOSED. So the balance stays at $10,000 even though $5,000 is tied up in TAO_USDT.

The fix has two parts:

**Part A — Deduct on open:** After inserting the trade in `ayn-open-trade`, immediately update `ayn_account_state` to reduce `current_balance` by `positionSizeDollars`:

```typescript
// After successful trade insert:
await supabase
  .from('ayn_account_state')
  .update({
    current_balance: balance - positionSizeDollars,
    updated_at: new Date().toISOString(),
  })
  .eq('id', '00000000-0000-0000-0000-000000000001');
```

**Part B — Return on close:** In `ayn-close-trade`, after closing the trade, update `current_balance` to add back the position capital plus the net P&L:

```typescript
// After computing totalPnlDollars:
const { data: acct } = await supabase
  .from('ayn_account_state')
  .select('current_balance')
  .eq('id', '00000000-0000-0000-0000-000000000001')
  .single();

const newBalance = Number(acct.current_balance) + positionDollars + totalPnlDollars;

await supabase
  .from('ayn_account_state')
  .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
  .eq('id', '00000000-0000-0000-0000-000000000001');
```

**Part C — Fix current state in DB:** The TAO_USDT trade is currently OPEN with $5,000 deployed but balance still reads $10,000. We need a one-time SQL fix:

```sql
UPDATE ayn_account_state
SET current_balance = 10000 - 5000
WHERE id = '00000000-0000-0000-0000-000000000001';
```
This sets it to $5,000 to match reality right now.

**Part D — Update the existing DB trigger** so it does NOT override `current_balance` on close (the trigger currently recalculates `current_balance` from `starting_balance + total_pnl_dollars`, which would be wrong now that we're tracking deployed capital separately). The trigger should be modified to only update the stats columns (win_rate, total_trades, etc.) and not touch `current_balance` — the close function will manage that directly.

---

### Issue 2: Advanced Metrics All Show 0 (Expected, But Needs Context)

The closed IO_USDT trade was a $0 P&L breakeven close (entered at $0.114, manually closed at $0.114). So `ayn-calculate-metrics` correctly computes:
- Sharpe: 0 (average return = 0)
- Profit Factor: 0 (no winning trades)
- Expectancy: $0

This is **accurate data** — metrics only become meaningful after 5-10+ trades. However, the UI can be improved to show a "Not enough data" message when fewer than 5 closed trades exist instead of just showing red zeros.

---

## Files to Change

| File | Change |
|---|---|
| `supabase/functions/ayn-open-trade/index.ts` | Deduct `positionSizeDollars` from `current_balance` after trade insert |
| `supabase/functions/ayn-close-trade/index.ts` | Add back `positionDollars + totalPnlDollars` to `current_balance` after close |
| `src/components/trading/PerformanceDashboard.tsx` | Show "Not enough data (min. 5 trades)" for advanced metrics when `total_trades < 5` |
| Database (one-time SQL) | `UPDATE ayn_account_state SET current_balance = 5000 WHERE id = '...'` to fix current stale $10,000 value |

## What You'll See After

- Account Balance shows **$5,000** (remaining cash after deploying $5,000 into TAO_USDT)
- When TAO_USDT closes with a profit of say $200, balance goes to **$5,200 + $5,000 returned = $10,200**
- Advanced Metrics section shows a small note: "Metrics available after 5+ closed trades"
- Once more trades close, real Sharpe/Profit Factor numbers appear

## No Edge Cases Missed

- If `ayn-monitor-trades` auto-closes via stop-loss/TP, it also calls the same close path — that function already does a `balance` update via the DB trigger. We need to apply the same fix to `ayn-monitor-trades` as well for Part B.
