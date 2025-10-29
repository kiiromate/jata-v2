import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApplicationCard } from "@/components/ApplicationCard";
import Welcome from "@/components/Welcome";
import { ActivityCard } from "@/components/ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('applications').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_activity');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  if (isLoadingApplications) {
    return <div>Loading applications...</div>;
  }

  if (!applications || applications.length === 0) {
    return <Welcome />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Alert className="mb-6">
        <AlertTitle>Browser extension available</AlertTitle>
        <AlertDescription>
          Capture job details directly from job boards.
          <Link to="/install-extension" className="font-medium underline ml-2">
            Install Extension
          </Link>
        </AlertDescription>
      </Alert>

      {isLoadingActivity ? (
        <Skeleton className="h-32 w-full mb-6" />
      ) : (
        recentActivity && <ActivityCard data={recentActivity} />
      )}


      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Applications</h1>
        {/* Add filter/sort controls here if needed */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
