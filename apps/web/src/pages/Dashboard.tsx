import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApplicationCard } from "@/components/ApplicationCard";
import { ApplicationCardSkeleton } from "@/components/ApplicationCardSkeleton";
import Welcome from "@/components/Welcome";
import { ActivityCard } from "@/components/ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardWelcomeCard from "@/components/DashboardWelcomeCard";
import DashboardStatsCard from "@/components/DashboardStatsCard";
import CreateApplicationModal from "@/components/CreateApplicationModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuth } from "@/hooks/useAuth";

interface RecentActivityData {
  applications_submitted: number;
  interviews_landed: number;
  average_response_time_days: number | null;
}

const Dashboard = () => {
  const { openModal } = useDashboardStore();
  const { user, loading: authLoading } = useAuth();
  
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['applications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('date_applied', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery<RecentActivityData | null>({
    queryKey: ['recentActivity', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_activity');
      if (error) {
        console.warn('Recent activity unavailable:', error.message);
        return null;
      }
      return data as RecentActivityData;
    },
    enabled: !!user,
    retry: false,
  });

  if (authLoading || !user || isLoadingApplications) {
    return (
      <div className="p-sm sm:p-md lg:p-lg">
        <Skeleton className="h-20 w-full mb-md" />
        <Skeleton className="h-32 w-full mb-md" />
        <Skeleton className="h-8 w-48 mb-sm" />
        <div className="grid gap-sm md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ApplicationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return <Welcome />;
  }

  // Calculate stats
  const totalApplications = applications?.length || 0;
  const activeApplications = applications?.filter(
    (app) => app.status === 'Applied' || app.status === 'Interview'
  ).length || 0;
  const interviews = applications?.filter(
    (app) => app.status === 'Interview' || app.status === 'Offer'
  ).length || 0;
  
  // Calculate applications from this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeek = applications?.filter(
    (app) => new Date(app.created_at) >= oneWeekAgo
  ).length || 0;

  return (
    <div className="p-sm sm:p-md lg:p-lg">
      <CreateApplicationModal />
      
      <Alert className="mb-md">
        <AlertTitle>Browser extension available</AlertTitle>
        <AlertDescription>
          Capture job details directly from job boards.
          <Link to="/install-extension" className="font-medium underline ml-2">
            Install Extension
          </Link>
        </AlertDescription>
      </Alert>

      <DashboardWelcomeCard />

      <DashboardStatsCard
        totalApplications={totalApplications}
        activeApplications={activeApplications}
        interviews={interviews}
        thisWeek={thisWeek}
      />

      {isLoadingActivity ? (
        <Skeleton className="h-32 w-full mb-md" />
      ) : (
        recentActivity && <ActivityCard data={recentActivity} />
      )}

      <div className="flex justify-between items-center mb-sm mt-md">
        <h1 className="text-2xl font-medium">My Applications</h1>
        <Button onClick={openModal} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </Button>
      </div>

      <div className="grid gap-sm md:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
