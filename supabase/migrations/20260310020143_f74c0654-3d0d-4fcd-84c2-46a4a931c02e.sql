CREATE OR REPLACE FUNCTION public.get_user_context(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  user_prefs JSONB;
  user_mem JSONB;
BEGIN
  SELECT jsonb_build_object(
    'language', preferred_language,
    'currency', currency,
    'region', region,
    'building_code', building_code,
    'personalization', personalization_enabled,
    'style', communication_style
  ) INTO user_prefs
  FROM public.user_preferences
  WHERE user_id = _user_id;

  SELECT jsonb_agg(mem_row) INTO user_mem
  FROM (
    SELECT jsonb_build_object(
      'type', memory_type,
      'key', memory_key,
      'data', memory_data,
      'priority', priority
    ) as mem_row
    FROM public.user_memory
    WHERE user_id = _user_id
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY priority ASC, updated_at DESC
    LIMIT 30
  ) sub;

  result := jsonb_build_object(
    'preferences', COALESCE(user_prefs, '{}'::jsonb),
    'memories', COALESCE(user_mem, '[]'::jsonb)
  );

  RETURN result;
END;
$function$;