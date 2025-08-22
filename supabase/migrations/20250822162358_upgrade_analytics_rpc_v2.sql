
-- Upgrade the get_user_analytics function to include deeper insights

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
    ) as stats),

    'success_by_source', (SELECT jsonb_agg(stats) FROM (
      SELECT
        source,
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE status = 'Interview') as interviews,
        COUNT(*) FILTER (WHERE status = 'Offer') as offers
      FROM public.applications
      WHERE user_id = auth.uid() AND source IS NOT NULL
      GROUP BY source
      ORDER BY total_applications DESC
    ) as stats),

    -- New: Industry Distribution
    'industry_distribution', (SELECT jsonb_agg(stats) FROM (
      SELECT
        industry,
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE status = 'Offer') as offers
      FROM public.applications
      WHERE user_id = auth.uid() AND industry IS NOT NULL
      GROUP BY industry
      ORDER BY total_applications DESC
    ) as stats),

    -- New: Application Trends Over Time (Monthly)
    'application_trends_over_time', (SELECT jsonb_agg(stats) FROM (
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as total_applications
      FROM public.applications
      WHERE user_id = auth.uid()
      GROUP BY month
      ORDER BY month ASC
    ) as stats)

    -- Future enhancements could include:
    -- 'top_skills_demanded': Requires text analysis on job descriptions.
    -- 'average_response_time': Requires specific date fields for application stages.

  ) INTO analytics_data;

  RETURN analytics_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
