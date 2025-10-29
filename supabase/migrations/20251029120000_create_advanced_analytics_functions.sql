-- Migration: Create advanced analytics functions for Phase 4
-- Description: Add time-series tracking, insights, and trend analysis

-- Function to get time-series data (applications over time)
CREATE OR REPLACE FUNCTION get_application_time_series()
RETURNS TABLE (
  date TEXT,
  applications BIGINT,
  interviews BIGINT,
  offers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('week', date_applied), 'Mon DD') as date,
    COUNT(*) as applications,
    COUNT(*) FILTER (WHERE status = 'Interview' OR status = 'Offer') as interviews,
    COUNT(*) FILTER (WHERE status = 'Offer') as offers
  FROM public.applications
  WHERE user_id = auth.uid()
    AND date_applied >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY DATE_TRUNC('week', date_applied)
  ORDER BY DATE_TRUNC('week', date_applied) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Function to get application insights
CREATE OR REPLACE FUNCTION get_application_insights()
RETURNS JSONB AS $$
DECLARE
  insights_data JSONB;
  total_apps BIGINT;
  total_interviews BIGINT;
  total_offers BIGINT;
  avg_response_days NUMERIC;
  week_over_week_change NUMERIC;
  top_source TEXT;
  top_industry TEXT;
BEGIN
  -- Get basic counts
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'Interview' OR status = 'Offer'),
    COUNT(*) FILTER (WHERE status = 'Offer')
  INTO total_apps, total_interviews, total_offers
  FROM public.applications
  WHERE user_id = auth.uid();

  -- Calculate average response time (days from application to first status change)
  SELECT AVG(
    EXTRACT(EPOCH FROM (updated_at - date_applied)) / 86400
  )::NUMERIC(10,1)
  INTO avg_response_days
  FROM public.applications
  WHERE user_id = auth.uid()
    AND status != 'Applied'
    AND updated_at IS NOT NULL
    AND date_applied IS NOT NULL;

  -- Calculate week-over-week change
  WITH this_week AS (
    SELECT COUNT(*) as count
    FROM public.applications
    WHERE user_id = auth.uid()
      AND date_applied >= DATE_TRUNC('week', CURRENT_DATE)
  ),
  last_week AS (
    SELECT COUNT(*) as count
    FROM public.applications
    WHERE user_id = auth.uid()
      AND date_applied >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days')
      AND date_applied < DATE_TRUNC('week', CURRENT_DATE)
  )
  SELECT
    CASE
      WHEN last_week.count = 0 THEN 0
      ELSE ((this_week.count::NUMERIC - last_week.count::NUMERIC) / last_week.count::NUMERIC * 100)::NUMERIC(10,1)
    END
  INTO week_over_week_change
  FROM this_week, last_week;

  -- Find top performing source
  SELECT source
  INTO top_source
  FROM (
    SELECT
      source,
      COUNT(*) FILTER (WHERE status = 'Offer') as offers,
      COUNT(*) as total
    FROM public.applications
    WHERE user_id = auth.uid()
      AND source IS NOT NULL
    GROUP BY source
    HAVING COUNT(*) >= 3
    ORDER BY
      (COUNT(*) FILTER (WHERE status = 'Offer')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) DESC,
      COUNT(*) FILTER (WHERE status = 'Offer') DESC
    LIMIT 1
  ) as top_sources;

  -- Find top performing industry
  SELECT industry
  INTO top_industry
  FROM (
    SELECT
      industry,
      COUNT(*) FILTER (WHERE status = 'Offer') as offers,
      COUNT(*) as total
    FROM public.applications
    WHERE user_id = auth.uid()
      AND industry IS NOT NULL
    GROUP BY industry
    HAVING COUNT(*) >= 3
    ORDER BY
      (COUNT(*) FILTER (WHERE status = 'Offer')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) DESC,
      COUNT(*) FILTER (WHERE status = 'Offer') DESC
    LIMIT 1
  ) as top_industries;

  -- Build insights object
  SELECT jsonb_build_object(
    'totalApplications', COALESCE(total_apps, 0),
    'interviewRate', CASE
      WHEN total_apps > 0 THEN (total_interviews::NUMERIC / total_apps::NUMERIC * 100)::NUMERIC(10,1)
      ELSE 0
    END,
    'offerRate', CASE
      WHEN total_interviews > 0 THEN (total_offers::NUMERIC / total_interviews::NUMERIC * 100)::NUMERIC(10,1)
      ELSE 0
    END,
    'averageResponseTime', COALESCE(avg_response_days, 0),
    'weekOverWeekChange', COALESCE(week_over_week_change, 0),
    'topPerformingSource', top_source,
    'topPerformingIndustry', top_industry
  ) INTO insights_data;

  RETURN insights_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_application_time_series() TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_insights() TO authenticated;
