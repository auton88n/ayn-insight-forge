

# Investigation Results + Fix Plan

## What I Found

### 1. Welcome Email is Bilingual (English + Arabic)
**File:** `supabase/functions/send-email/index.ts`, lines 41-93

The `welcomeEmailTemplate` function renders both English and Arabic content in a single email. The subject line is also bilingual: `"Welcome to AYN! 🎉 | !AYN مرحباً بك في"`. This is the email sent when users sign up.

The **auth confirmation email** (`auth-send-email/index.ts`) is already English-only — no issue there.

### 2. Credit Number is Wrong in the Welcome Email
The welcome email says **"50 free credits"** (line 62) and **"50 رصيد مجاني"** (line 85). But the actual free tier gives **5 daily credits**, not 50. This is just incorrect copy that was never updated when the tier system changed.

### 3. Why Credits Sometimes Show 5 vs 10
The free tier is consistently set to **5** across all sources:
- `handle_new_user` trigger: `daily_messages = 5`
- `check-subscription` edge function: `dailyCredits: 5`
- `src/constants/tierLimits.ts`: `credits: 5`
- `check_user_ai_limit` DB function: defaults to 5

If a user sees 10, it's likely from **bonus credits** (`bonus_credits` field in `user_ai_limits`). The limit check adds bonus to the base: `total_limit = limit_val + bonus_val`. So 5 base + 5 bonus = 10 displayed. There's no code path that sets the free tier to 10.

### 4. `send-email/index.ts` Has the Same `npm:resend` Build Bug
Line 2: `import { Resend } from "npm:resend@2.0.0"` — same issue we fixed in `admin-notifications`.

### 5. Last Changes Made (Previous Sessions)
- Fixed Pionex API HMAC signing across `get-klines`, `ayn-unified`, `ayn-monitor-trades`, `analyze-trading-chart`, and `marketScanner.ts` (missing `GET` prefix, unsorted params)
- Fixed ticker format bug in `ayn-monitor-trades` (`DEGO_USDT` → `DEGO_USDT_USDT`)
- Fixed `admin-notifications` Resend import from `npm:` to `https://esm.sh/`
- Sharpened the trading agent persona in `systemPrompts.ts` (removed disclaimers, added prop-trader voice)

---

## Fix Plan

### Step 1: Make welcome email English-only + fix credit count
**File:** `supabase/functions/send-email/index.ts`
- Remove all Arabic content from `welcomeEmailTemplate` (lines 78-87)
- Change subject to `"Welcome to AYN! 🎉"` (remove Arabic portion)
- Change "50 free credits" to "5 free daily credits" to match actual limits
- Fix `npm:resend` import to `https://esm.sh/resend@2.0.0` (line 2)

### Step 2: Fix subject in `src/lib/email-templates.ts`
- Update the `welcome` subject from `"Welcome to AYN! 🎉 | !AYN مرحباً بك في"` to `"Welcome to AYN! 🎉"`

### Step 3: Deploy `send-email` function

