-- Creates an RPC function to get key activity metrics from the last 30 days.

CREATE OR REPLACE FUNCTION get_recent_activity()
RETURNS JSONB AS $$
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
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_recent_activity() TO authenticated;