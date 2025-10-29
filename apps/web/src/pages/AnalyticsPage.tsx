import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

import ApplicationFunnelChart from '../components/ApplicationFunnelChart';
import ScoreAnalysisChart from '../components/ScoreAnalysisChart';
import SuccessBySourceChart from '../components/SuccessBySourceChart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Info } from 'lucide-react';
import SuccessByIndustryChart from '../components/SuccessByIndustryChart';
import EmptyState from '../components/EmptyState';

interface UserAnalyticsData {
  total_applications: number;
  interviews: number;
  offers: number;
  score_analysis: { status: string; count: number; average_score: number; }[];
  success_by_source: { source: string; total_applications: number; interviews: number; offers: number; }[];
  success_by_industry: { industry: string; total_applications: number; interviews: number; offers: number; }[];
}

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

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading analytics...</div>;
  }

  if (isError) {
    return <div className="container mx-auto p-4 text-red-500">Error loading analytics: {error?.message}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
        <p className="text-gray-600">Track your application performance and identify patterns.</p>
      </div>

      {data ? (
        <div className="space-y-8">
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
              {data.total_applications > 0 || data.interviews > 0 || data.offers > 0 ? (
                <ApplicationFunnelChart data={data} />
              ) : (
                <EmptyState message="No data available yet. Track applications to see your funnel." />
              )}
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
