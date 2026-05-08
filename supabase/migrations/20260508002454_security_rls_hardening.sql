-- Security QA Gate: keep owner-scoped updates explicit and retire stale unsafe RPC surface.
-- This migration is static-reviewed only in this pass. Do not apply remotely without a dry-run.

DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
CREATE POLICY "Users can update their own applications"
ON public.applications
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id))
WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
CREATE POLICY "Users can update their own resumes"
ON public.resumes
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id))
WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own scrape configs" ON public.scrape_configs;
CREATE POLICY "Users can update their own scrape configs"
ON public.scrape_configs
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id))
WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
CREATE POLICY "Users can update their own user data"
ON public.users
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((auth.uid() = id))
WITH CHECK ((auth.uid() = id));

DROP FUNCTION IF EXISTS public.get_user_analytics_v2(uuid);

CREATE OR REPLACE FUNCTION public.get_recent_activity()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'applications_submitted', (
      SELECT COUNT(*)
      FROM public.applications
      WHERE user_id = auth.uid() AND date_applied >= NOW() - INTERVAL '30 days'
    ),
    'interviews_landed', (
      SELECT COUNT(*)
      FROM public.applications
      WHERE user_id = auth.uid() AND status = 'Interview' AND updated_at >= NOW() - INTERVAL '30 days'
    ),
    'average_response_time_days', (
      SELECT TRUNC(AVG(EXTRACT(DAY FROM (updated_at - date_applied))), 1)
      FROM public.applications
      WHERE user_id = auth.uid() AND status != 'Applied' AND updated_at >= NOW() - INTERVAL '30 days'
    )
  ) INTO activity_data;

  RETURN activity_data;
END;
$$;
