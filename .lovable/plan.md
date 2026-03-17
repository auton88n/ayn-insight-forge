

## Diagnosis: Multiple Stripe Integration Issues

After reviewing the full Stripe setup (products, prices, edge functions, webhook, frontend), here are the problems found:

### Issue 1: Displayed Prices Don't Match Stripe
The frontend shows $20/$49/$99 but the actual Stripe prices are:
- **Starter**: $9/mo (900 cents) 
- **Pro**: $29/mo (2900 cents)
- **Business**: $79/mo (7900 cents)

The price IDs and product IDs are correct, but the dollar amounts shown to users are wrong.

**Fix**: Update `SUBSCRIPTION_TIERS` in `SubscriptionContext.tsx` to show $9, $29, $79 (or update the Stripe prices to match -- your call).

---

### Issue 2: `stripe-webhook` Uses Wrong Database Columns
The webhook function writes to columns that don't exist in `user_ai_limits`:
- Uses `monthly_limit`, `engineering_limit`, `credits_used`, `engineering_used`, `last_reset`
- Actual columns are: `monthly_messages`, `monthly_engineering`, `current_monthly_messages`, `current_monthly_engineering`, `monthly_reset_at`
- Also uses `tier` instead of `subscription_tier` for `user_subscriptions` upsert

This means when Stripe sends subscription events, the database updates silently fail.

**Fix**: Rewrite `stripe-webhook/index.ts` to use the correct column names matching the actual DB schema.

---

### Issue 3: `stripe-webhook` Has Mismatched Tier Limits
The webhook defines different limits than the frontend and `check-subscription`:
- Webhook: Free=50, Starter=200, Pro=1000, Business=5000
- Frontend/check-sub: Free=5, Starter=1000, Pro=5000, Business=15000

**Fix**: Align to the frontend values (5, 1000, 5000, 15000).

---

### Issue 4: `stripe-webhook` Looks Up Users Wrong
It queries `profiles` table by `email` field, but the profiles table uses `user_id` as the key and may not have an `email` column. It should look up users via `auth.users` using the service role key.

**Fix**: Use `supabase.auth.admin.listUsers()` or query by a reliable field.

---

### Issue 5: `create-checkout` Edge Function Fails Silently
The function boots but never processes requests (no "Function started" log appears). The `FunctionsFetchError: Failed to fetch` error indicates the request never completes. The function uses `serve()` from `deno.land/std` which per your deployment standards should be `Deno.serve()`.

**Fix**: Migrate `create-checkout`, `check-subscription`, and `customer-portal` to use `Deno.serve()` instead of the imported `serve` to prevent cold-start failures.

---

### Implementation Plan

1. **Fix `create-checkout/index.ts`**: Switch to `Deno.serve()`, keep CORS and logic the same
2. **Fix `check-subscription/index.ts`**: Switch to `Deno.serve()`, align tier limits
3. **Fix `customer-portal/index.ts`**: Switch to `Deno.serve()`
4. **Fix `stripe-webhook/index.ts`**: Correct all DB column names, align tier limits, fix user lookup
5. **Fix `SubscriptionContext.tsx`**: Update displayed prices to match Stripe ($9/$29/$79) OR ask you which prices are correct
6. **Redeploy all four functions** (automatic on save)

### Open Question
The prices in Stripe are $9/$29/$79 but your frontend shows $20/$49/$99. Which is correct? Should I update Stripe prices or update the frontend display?

