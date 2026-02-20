-- ============================================================================
-- FIX: Complete handle_new_user trigger (schema-aligned)
-- Aligns with: profiles, user_settings, access_grants, user_roles,
--              user_subscriptions, user_ai_limits (no start_date; use daily_reset_at/monthly_reset_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. CREATE PROFILE (with metadata from signup form)
  INSERT INTO public.profiles (
    user_id,
    contact_person,
    company_name,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'company_name',
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    contact_person = COALESCE(EXCLUDED.contact_person, profiles.contact_person),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name);

  -- 2. CREATE USER SETTINGS
  INSERT INTO public.user_settings (user_id, has_accepted_terms)
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. CREATE ACCESS GRANT (Active immediately)
  INSERT INTO public.access_grants (
    user_id,
    is_active,
    monthly_limit,
    requires_approval
  )
  VALUES (NEW.id, true, 5, false)
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. CREATE USER ROLE (Default: 'user') — unique is (user_id, role)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 5. CREATE SUBSCRIPTION (Free tier by default) — no start_date column
  INSERT INTO public.user_subscriptions (
    user_id,
    subscription_tier,
    status
  )
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- 6. CREATE AI LIMITS (Free tier: 5 daily messages) — use daily_reset_at/monthly_reset_at
  INSERT INTO public.user_ai_limits (
    user_id,
    daily_messages,
    daily_engineering,
    monthly_messages,
    monthly_engineering,
    daily_reset_at,
    monthly_reset_at
  )
  VALUES (
    NEW.id,
    5,
    1,
    5,
    1,
    NOW() + INTERVAL '1 day',
    (date_trunc('month', NOW()) + INTERVAL '1 month')::timestamptz
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- ============================================================================
-- BACKFILL: Fix existing users with missing data
-- ============================================================================

-- 1. ADD MISSING USER ROLES (unique on user_id, role)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = 'user'
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. ADD MISSING SUBSCRIPTIONS (no start_date)
INSERT INTO public.user_subscriptions (
  user_id,
  subscription_tier,
  status
)
SELECT p.user_id, 'free', 'active'
FROM profiles p
LEFT JOIN user_subscriptions us ON us.user_id = p.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. ADD MISSING AI LIMITS (use daily_reset_at, monthly_reset_at)
INSERT INTO public.user_ai_limits (
  user_id,
  daily_messages,
  daily_engineering,
  monthly_messages,
  monthly_engineering,
  daily_reset_at,
  monthly_reset_at
)
SELECT p.user_id, 5, 1, 5, 1,
  NOW() + INTERVAL '1 day',
  (date_trunc('month', NOW()) + INTERVAL '1 month')::timestamptz
FROM profiles p
LEFT JOIN user_ai_limits ual ON ual.user_id = p.user_id
WHERE ual.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. UPDATE BLANK PROFILES WITH METADATA
UPDATE public.profiles p
SET
  contact_person = COALESCE(
    NULLIF(TRIM(p.contact_person), ''),
    au.raw_user_meta_data->>'full_name',
    au.email
  ),
  company_name = COALESCE(
    NULLIF(TRIM(p.company_name), ''),
    au.raw_user_meta_data->>'company_name'
  )
FROM auth.users au
WHERE au.id = p.user_id
  AND (
    p.contact_person IS NULL
    OR TRIM(p.contact_person) = ''
    OR p.company_name IS NULL
    OR TRIM(p.company_name) = ''
  );
