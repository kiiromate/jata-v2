import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

import ApplicationFunnelChart from '../components/ApplicationFunnelChart';
import ScoreAnalysisChart from '../components/ScoreAnalysisChart';
import SuccessBySourceChart from '../components/SuccessBySourceChart';
import ApplicationTimeSeriesChart from '../components/ApplicationTimeSeriesChart';
import ApplicationInsights from '../components/ApplicationInsights';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Info } from 'lucide-react';
import SuccessByIndustryChart from '../components/SuccessByIndustryChart';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/ui/skeleton';

interface UserAnalyticsData {
  total_applications: number;
  interviews: number;
  offers: number;
  score_analysis: { status: string; count: number; average_score: number; }[];
  success_by_source: { source: string; total_applications: number; interviews: number; offers: number; }[];
  success_by_industry: { industry: string; total_applications: number; interviews: number; offers: number; }[];
}

interface TimeSeriesDataPoint {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
}

interface InsightsData {
  totalApplications: number;
  interviewRate: number;
  offerRate: number;
  averageResponseTime: number;
  weekOverWeekChange: number;
  topPerformingSource?: string;
  topPerformingIndustry?: string;
}

const ChartSkeleton = () => (
  <div className="bg-white p-6 rounded-lg border border-gray-200">
    <Skeleton className="h-6 w-48 mb-4" />
    <Skeleton className="h-[300px] w-full" />
  </div>
);

const AnalyticsPage = () => {
  const { data, isLoading, isError, error } = useQuery<UserAnalyticsData, Error>({
    queryKey: ["user-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_analytics_v2');
      if (error) {
        throw new Error(error.message);
      }
      return data as UserAnalyticsData;
    },
  });

  const { data: timeSeriesData, isLoading: isLoadingTimeSeries } = useQuery<TimeSeriesDataPoint[], Error>({
    queryKey: ["application-time-series"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_application_time_series');
      if (error) {
        throw new Error(error.message);
      }
      return data as TimeSeriesDataPoint[];
    },
  });

  const { data: insightsData, isLoading: isLoadingInsights } = useQuery<InsightsData, Error>({
    queryKey: ["application-insights"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_application_insights');
      if (error) {
        throw new Error(error.message);
      }
      return data as InsightsData;
    },
  });

  if (isLoading || isLoadingTimeSeries || isLoadingInsights) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-48 w-full" />
          <ChartSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="container mx-auto p-4 text-red-500">Error loading analytics: {error?.message}</div>;
  }

  const hasData = data && (data.total_applications > 0 || data.interviews > 0 || data.offers > 0);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
        <p className="text-gray-600">Track your application performance and identify patterns.</p>
      </div>

      {hasData ? (
        <div className="space-y-8">
          {/* Insights Section */}
          {insightsData && (
            <div>
              <h2 className="text-xl font-medium tracking-tight mb-4">Key Insights</h2>
              <ApplicationInsights metrics={insightsData} />
            </div>
          )}

          {/* Time Series Chart */}
          {timeSeriesData && timeSeriesData.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-medium tracking-tight">Application Trends</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Track your applications, interviews, and offers over the last 12 weeks.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ApplicationTimeSeriesChart data={timeSeriesData} />
            </div>
          )}

          {/* Funnel and Score Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-medium tracking-tight">Application Funnel</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Conversion rates from applications to interviews to offers.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ApplicationFunnelChart data={data} />
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-medium tracking-tight">Score by Status</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Average Jata Score for each application status.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {data.score_analysis && data.score_analysis.length > 0 ? (
                <ScoreAnalysisChart data={data.score_analysis} />
              ) : (
                <EmptyState message="No data available yet. Track applications to see score analysis." />
              )}
            </div>
          </div>

          {/* Success by Source and Industry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-medium tracking-tight">Success by Source</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Interview and offer rates by application source.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {data.success_by_source && data.success_by_source.length > 0 ? (
                <SuccessBySourceChart data={data.success_by_source} />
              ) : (
                <EmptyState message="No data available yet. Track applications to see source analysis." />
              )}
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-medium tracking-tight">Success by Industry</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Interview and offer rates by industry.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {data.success_by_industry && data.success_by_industry.length > 0 ? (
                <SuccessByIndustryChart data={data.success_by_industry} />
              ) : (
                <EmptyState message="No data available yet. Track applications to see industry analysis." />
              )}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState message="No analytics data available. Start tracking applications to see insights." />
      )}
    </div>
  );
};

export default AnalyticsPage;
