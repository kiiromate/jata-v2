### Enhancing Phase 11: Success by Source

This plan contains three precise steps to add this powerful new chart to your existing analytics dashboard.

#### **Step 1: Upgrade the Backend Analytics Function**
**Goal**: Enhance the existing `get_user_analytics` RPC function to also calculate success metrics grouped by the `source` of the application.
**Action**: Use the Supabase CLI to create a new migration that *replaces* the old function with an upgraded one.

**CLI Command 1: Create the migration file:**
```bash
supabase migration new upgrade_user_analytics_rpc_with_source
```

**CLI Command 2: Add the SQL to the new file.** This SQL replaces the previous function with a new version that includes the `success_by_source` calculation.
```sql
-- Replaces the get_user_analytics function to add success_by_source analysis

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
    ) as stats)

  ) INTO analytics_data;

  RETURN analytics_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**CLI Command 3: Apply the migration locally:**
```bash
supabase db reset
```

#### **Step 2: Build the New Visualization Component**
**Goal**: Create a new chart component specifically for displaying success rates by source.

**CLI Command (single-line):**
```bash
gemini -p "Create a new React component at 'apps/web/src/components/SuccessBySourceChart.tsx'. The component should accept a 'data' prop which is an array of '{ source, total_applications, interviews, offers }'. Using the 'Recharts' library, render a 'BarChart' where the X-axis represents the 'source'. The chart should have two bars for each source: one for the 'Interview Rate' and one for the 'Offer Rate'. You will need to calculate these rates within the component (e.g., Interview Rate = interviews / total_applications). Use a 'Tooltip' to show the raw counts on hover."
```

#### **Step 3: Integrate the New Chart into the Analytics Page**
**Goal**: Add the `SuccessBySourceChart` to your existing dashboard.

**CLI Command (single-line):**
```bash
gemini -p "Update the file 'apps/web/src/pages/AnalyticsPage.tsx'. 1. Import the new 'SuccessBySourceChart' component. 2. In the 'onSuccess' block of your 'useQuery', extract the new 'success_by_source' data from the result. 3. Render the 'SuccessBySourceChart' component, passing the 'success_by_source' data to it. Add it to your responsive grid layout, giving it a prominent position."
```

By adding this single chart, you provide a forward-looking, strategic piece of advice to your users. They can now instantly see, for example, that "Referrals" have a 50% interview rate while "LinkedIn Easy Apply" has a 2% rate, guiding them to focus their energy where it matters most.

This completes the analytics phase, making it a truly powerful and comprehensive feature. After this, you will be perfectly positioned to move on to the final phase: **Polish, Documentation, and Deployment**.