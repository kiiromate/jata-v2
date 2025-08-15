### Phase 11: Closing the Loop - Analytics & Insights

This plan is designed to be efficient by doing the heavy lifting on the backend first.

#### **Step 1: Create the Backend Analytics Function**
**Goal**: Create a single, powerful PostgreSQL function that performs all the complex calculations on the server.
**Action**: Use the Supabase CLI to create a new migration for this RPC function.

**CLI Command 1: Create the migration file:**```bash
supabase migration new create_user_analytics_rpc
```

**CLI Command 2: Add the SQL to the new file.** Open the newly created `.sql` file in your IDE and paste the following:
```sql
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
```

**CLI Command 3: Apply the migration locally:**
```bash
supabase db reset
```

#### **Step 2: Build the Frontend Analytics Page**
**Goal**: Create the main page that will fetch and display all the analytics visualizations.

**CLI Command (single-line):**
```bash
gemini -p "Create a new page component at 'apps/web/src/pages/AnalyticsPage.tsx'. 1. The page should have a main title 'My Analytics Dashboard'. 2. Use TanStack Query's 'useQuery' to call the Supabase RPC function 'get_user_analytics'. The query key should be 'user-analytics'. 3. Display loading and error states appropriately. 4. Add a new route '/analytics' in 'apps/web/src/App.tsx' for this page, ensuring it is a protected route. Also add a link to this new page in your main navigation component."
```

#### **Step 3: Build the Visualization Components**
**Goal**: Create the modular charts that will be displayed on the analytics page.

**CLI Command 1: Create the Funnel Chart (single-line):**
```bash
gemini -p "Create a new React component at 'apps/web/src/components/ApplicationFunnelChart.tsx'. The component should accept a 'data' prop with the shape '{ total_applications, interviews, offers }'. Using the 'Recharts' library, render a 'FunnelChart' that visually represents these three stages. For each stage, display the stage name, the absolute count, and the conversion rate from the previous stage (e.g., Interview rate = interviews / total_applications)."
```

**CLI Command 2: Create the Score Analysis Chart (single-line):**
```bash
gemini -p "Create a new React component at 'apps/web/src/components/ScoreAnalysisChart.tsx'. The component should accept a 'data' prop which is an array of '{ status, count, average_score }'. Using the 'Recharts' library, render a 'BarChart' where the X-axis represents the 'status' and the Y-axis represents the 'average_score'. Each bar should display the average Jata Score for that application status."
```

#### **Step 4: Integrate Charts into the Analytics Page**
**Goal**: Display the new, beautiful charts on the main analytics page with the data fetched from the backend.

**CLI Command (single-line):**
```bash
gemini -p "Update the file 'apps/web/src/pages/AnalyticsPage.tsx'. 1. Import the 'ApplicationFunnelChart' and 'ScoreAnalysisChart' components. 2. Once the 'useQuery' for 'user-analytics' is successful, extract the 'funnel' and 'score_analysis' data from the result. 3. Render the 'ApplicationFunnelChart' component, passing the 'funnel' data to it. 4. Render the 'ScoreAnalysisChart' component, passing the 'score_analysis' data to it. Place them in a responsive grid layout."
```

Upon completing this phase, JATA will not only be a tool for *doing* the work of applying for jobs but also a tool for *understanding* that work. This provides immense value and is often the feature that retains users long-term.