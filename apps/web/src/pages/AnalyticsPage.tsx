import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

import ApplicationFunnelChart from '../components/ApplicationFunnelChart';
import ScoreAnalysisChart from '../components/ScoreAnalysisChart';
import SuccessBySourceChart from '../components/SuccessBySourceChart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Info } from 'lucide-react';

interface UserAnalyticsData {
  total_applications: number;
  interviews: number;
  offers: number;
  score_analysis: { status: string; count: number; average_score: number; }[];
  success_by_source: { source: string; total_applications: number; interviews: number; offers: number; }[]; // New field
}

const AnalyticsPage = () => {
  const { data, isLoading, isError, error } = useQuery<UserAnalyticsData, Error>({
    queryKey: ["user-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_analytics');
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Analytics Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">User Analytics Data</h2>
        {data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                Application Funnel
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-2 h-4 w-4 text-gray-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This chart shows your conversion rates through different stages of the application process: total applications, interviews, and offers.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <ApplicationFunnelChart data={data} />
            </div>
            {data.score_analysis && data.score_analysis.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Jata Score Analysis by Application Status
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-4 w-4 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This chart correlates your Jata Scores with application outcomes, helping you understand what score typically leads to interviews or offers.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <ScoreAnalysisChart data={data.score_analysis} />
              </div>
            )}
            {data.success_by_source && data.success_by_source.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Success Rate by Source
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-4 w-4 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Analyze which application sources (e.g., LinkedIn, company website, referral) yield the highest success rates for interviews and offers, guiding your job search strategy.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <SuccessBySourceChart data={data.success_by_source} />
              </div>
            )}
          </div>
        ) : (
          <p>No analytics data available.</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
