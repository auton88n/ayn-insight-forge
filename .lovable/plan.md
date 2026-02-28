

# Fix Credit Display Consistency Across All Tiers

## The Problem

There are **4 separate data sources** for credit display, each with different defaults and logic:

1. **Settings page (`AccountPreferences.tsx`)** — raw query that only reads `monthly_messages` (defaults to 50), completely ignores daily limits for free users
2. **Sidebar (`useUsageTracking.ts`)** — correctly tier-aware, defaults daily to 5
3. **Sidebar card (`CreditUpgradeCard.tsx`)** — uses `monthlyLimit ?? 50` as base, wrong for free daily users
4. **Admin panel (`UserAILimits.tsx`)** — uses `daily_messages ?? 10` (inconsistent default)

Additionally, `UsageCard.tsx` always shows "Daily HOO Credits" even for paid monthly tiers.

## Changes

### 1. `src/components/settings/AccountPreferences.tsx` — Use `useUsageTracking` hook

Replace the manual `user_ai_limits` query + local state with the existing `useUsageTracking` hook (same one the sidebar uses). This ensures the Settings page shows the **same data** as the sidebar — tier-aware, daily vs monthly, correct defaults.

- Remove the `usageData` state and its manual fetch from `user_ai_limits`
- Import and call `useUsageTracking(userId)`
- Pass hook values to `UsageCard`: `currentUsage`, `limit` (which is already tier-correct), `isUnlimited`, `resetDate`

### 2. `src/components/dashboard/UsageCard.tsx` — Make tier-aware labels

- Add `isDaily` and `tier` props
- Change header from hardcoded "Daily HOO Credits" to dynamic: free tier → "Daily Credits", paid → "Monthly Credits"
- Change tooltip text similarly
- Show bonus credits in the display when present (add `bonusCredits` prop)

### 3. `src/components/dashboard/CreditUpgradeCard.tsx` — Fix default base limit

- Change `const baseLimit = monthlyLimit ?? 50;` to `const baseLimit = monthlyLimit ?? 5;` — free tier gets 5 daily, not 50 monthly
- Add `isDaily` prop to show correct label ("daily" vs "monthly")

### 4. `src/components/admin/UserAILimits.tsx` — Fix inconsistent default

- Change `daily_messages ?? 10` to `daily_messages ?? 5` to match all other defaults

### 5. `src/hooks/useUsageTracking.ts` — Add `limit` field alias

- Export a `limit` field (alias of the computed limit value) so consumers don't need to handle null logic themselves. Already works correctly, no logic changes needed.

## Summary of default alignment

| Location | Before | After |
|---|---|---|
| useUsageTracking | 5 (daily) | 5 (daily) ✓ |
| AccountPreferences | 50 (monthly, wrong) | uses useUsageTracking |
| CreditUpgradeCard | 50 (monthly, wrong) | 5 (daily default) |
| UserAILimits admin | 10 (wrong) | 5 |
| tierLimits.ts | 5 | 5 ✓ |
| SubscriptionContext | 5 | 5 ✓ |

