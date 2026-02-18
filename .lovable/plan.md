
# Critical Fix: Complete User Registration System

## Current State (Verified by Database Audit)

Live database shows 16 users total with the following gaps:

| Check | Count |
|---|---|
| Total users | 16 |
| Have a role | 15 (1 missing) |
| Have a subscription | 4 (**12 missing**) |
| Have AI limits | 8 (**8 missing**) |
| Have a name | 16 (all good) |

The root cause is confirmed: the `handle_new_user()` trigger only inserts 3 rows (`profiles`, `user_settings`, `access_grants`) and completely skips `user_roles`, `user_subscriptions`, and `user_ai_limits`.

---

## Important Corrections to the Proposed SQL

The SQL in the request has **two columns that do not exist** in the actual database schema and would cause the migration to fail:

- `user_subscriptions` has **no `start_date` column** — it only has `created_at` (auto-populated)
- `user_ai_limits` has **no `reset_date` column** — it uses `daily_reset_at` and `monthly_reset_at` (both auto-populated with defaults)

Also, the `user_roles` table has a **composite unique key on `(user_id, role)`**, not on `user_id` alone — so `ON CONFLICT (user_id)` would fail. The correct conflict target is `ON CONFLICT (user_id, role)`.

The plan below uses the corrected SQL.

---

## What Will Be Done

### Part 1 — Fix the Trigger (prevents all future registration failures)

Replace the existing `handle_new_user()` function with a complete version that:
1. Inserts profile with `contact_person` and `company_name` from signup metadata
2. Inserts `user_settings` (unchanged)
3. Inserts `access_grants` (unchanged)
4. **NEW:** Inserts `user_roles` with default `'user'` role
5. **NEW:** Inserts `user_subscriptions` with `'free'` tier and `'active'` status
6. **NEW:** Inserts `user_ai_limits` using column defaults (no manual values needed — defaults cover everything)
7. Wraps everything in a `EXCEPTION WHEN OTHERS` block so a failure in one insert never blocks the user from being created

### Part 2 — Backfill Existing Users (fixes the 15 broken accounts right now)

Four targeted INSERT statements to fill the gaps for existing users:
1. Add missing `user_roles` rows (1 user affected)
2. Add missing `user_subscriptions` rows (12 users affected)
3. Add missing `user_ai_limits` rows (8 users affected)
4. Update blank profile names using metadata stored in `auth.users`

### Part 3 — Verification

A single SELECT query that should show all counts equal `total_users` after the fix.

---

## Technical Details

### Corrected Trigger SQL

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Profile with signup metadata
  INSERT INTO public.profiles (user_id, contact_person, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    contact_person = COALESCE(EXCLUDED.contact_person, profiles.contact_person),
    company_name   = COALESCE(EXCLUDED.company_name, profiles.company_name);

  -- 2. User settings
  INSERT INTO public.user_settings (user_id, has_accepted_terms)
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Access grant (active immediately, free tier)
  INSERT INTO public.access_grants (user_id, is_active, monthly_limit, requires_approval)
  VALUES (NEW.id, true, 5, false)
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Default role (composite unique key: user_id + role)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 5. Free tier subscription (no start_date column — created_at is auto)
  INSERT INTO public.user_subscriptions (user_id, subscription_tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- 6. AI limits (all defaults are correct — daily_messages:10, daily_engineering:3)
  INSERT INTO public.user_ai_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Corrected Backfill SQL

```sql
-- 1. Missing user roles (1 user)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Missing subscriptions (12 users)
INSERT INTO public.user_subscriptions (user_id, subscription_tier, status)
SELECT p.user_id, 'free', 'active'
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON us.user_id = p.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Missing AI limits (8 users)
INSERT INTO public.user_ai_limits (user_id)
SELECT p.user_id
FROM public.profiles p
LEFT JOIN public.user_ai_limits ual ON ual.user_id = p.user_id
WHERE ual.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. Fill in blank profile names from auth metadata
UPDATE public.profiles p
SET
  contact_person = COALESCE(NULLIF(p.contact_person, ''), au.raw_user_meta_data->>'full_name', au.email),
  company_name   = COALESCE(NULLIF(p.company_name, ''), au.raw_user_meta_data->>'company_name')
FROM auth.users au
WHERE au.id = p.user_id
  AND (p.contact_person IS NULL OR p.contact_person = ''
    OR p.company_name IS NULL OR p.company_name = '');
```

### Verification SQL

```sql
SELECT
  COUNT(*)                                                        AS total_users,
  COUNT(ur.user_id)                                               AS have_role,
  COUNT(us.user_id)                                               AS have_subscription,
  COUNT(ual.user_id)                                              AS have_limits,
  COUNT(CASE WHEN p.contact_person IS NOT NULL THEN 1 END)        AS have_name
FROM public.profiles p
LEFT JOIN public.user_roles         ur  ON ur.user_id  = p.user_id
LEFT JOIN public.user_subscriptions us  ON us.user_id  = p.user_id
LEFT JOIN public.user_ai_limits     ual ON ual.user_id = p.user_id;
-- All 5 counts should be equal after running the backfill
```

---

## Implementation Steps

1. Run Part 1 (trigger fix) in Supabase SQL Editor
2. Run Part 2 (backfill) immediately after
3. Run Part 3 (verification) — all counts must match `total_users`
4. Create a new test account via the signup form and verify all 6 rows are created
5. Log in with the test account and confirm it reaches the dashboard without errors

No frontend code changes are needed — this is a pure database migration.
