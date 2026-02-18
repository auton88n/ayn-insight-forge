
-- ============================================================================
-- PART 1: Fix handle_new_user trigger
-- ============================================================================
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

  -- 5. Free tier subscription (created_at is auto-populated)
  INSERT INTO public.user_subscriptions (user_id, subscription_tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- 6. AI limits (column defaults handle daily_reset_at and monthly_reset_at automatically)
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

-- ============================================================================
-- PART 2: Backfill existing users with missing data
-- ============================================================================

-- 1. Missing user roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Missing subscriptions
INSERT INTO public.user_subscriptions (user_id, subscription_tier, status)
SELECT p.user_id, 'free', 'active'
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON us.user_id = p.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Missing AI limits
INSERT INTO public.user_ai_limits (user_id)
SELECT p.user_id
FROM public.profiles p
LEFT JOIN public.user_ai_limits ual ON ual.user_id = p.user_id
WHERE ual.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. Fill blank profile names from auth metadata
UPDATE public.profiles p
SET
  contact_person = COALESCE(NULLIF(p.contact_person, ''), au.raw_user_meta_data->>'full_name', au.email),
  company_name   = COALESCE(NULLIF(p.company_name, ''), au.raw_user_meta_data->>'company_name')
FROM auth.users au
WHERE au.id = p.user_id
  AND (p.contact_person IS NULL OR p.contact_person = ''
    OR p.company_name IS NULL OR p.company_name = '');
