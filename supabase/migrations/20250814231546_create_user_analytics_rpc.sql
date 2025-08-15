-- Creates an RPC function to aggregate all analytics data for a user

CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS JSONB AS $$
DECLARE
  analytics_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'funnel', (SELECT jsonb_build_object(
      'total_applications', COUNT(*),
      'interviews', COUNT(*) FILTER (WHERE status = 'Interview'),
      'offers', COUNT(*) FILTER (WHERE status = 'Offer')
    ) FROM public.applications WHERE user_id = auth.uid()),

    'score_analysis', (SELECT jsonb_agg(stats) FROM (
      SELECT
        status,
        COUNT(*) as count,
        TRUNC(AVG(jata_score), 0) as average_score
      FROM public.applications
      WHERE user_id = auth.uid() AND jata_score IS NOT NULL
      GROUP BY status
    ) as stats)
  ) INTO analytics_data;

  RETURN analytics_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;