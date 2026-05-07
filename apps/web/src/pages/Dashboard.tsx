import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  buildPipelineAnalytics,
  buildPipelineQueues,
  normalizePipelineStatus,
  type PipelineMetricRow,
  type PipelineQueueItem,
} from "@jata/common";

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

interface QueuePanelProps {
  title: string;
  items: PipelineQueueItem[];
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

interface MetricPanelProps {
  title: string;
  rows: PipelineMetricRow[];
}

const toneClasses: Record<NonNullable<QueuePanelProps['tone']>, string> = {
  default: 'border-jata-graphite-mist',
  warning: 'border-jata-status-interview/40',
  danger: 'border-jata-status-rejected/50',
  success: 'border-jata-status-offer/40',
};

const QueuePanel = ({ title, items, tone = 'default' }: QueuePanelProps) => (
  <section className={`rounded border bg-jata-iron-charcoal p-3 ${toneClasses[tone]}`}>
    <div className="flex items-center justify-between gap-2 mb-2">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-jata-text-muted">{title}</h2>
      <span className="font-mono text-sm text-jata-text-primary">{items.length}</span>
    </div>
    <div className="space-y-2">
      {items.slice(0, 3).map((item) => (
        <div key={item.application_id} className="text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-jata-text-primary truncate">{item.company}</span>
            <span className="font-mono text-[10px] uppercase text-jata-text-muted">{item.score_band}</span>
          </div>
          <p className="text-jata-text-muted truncate">{item.next_action}</p>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-jata-text-muted">Clear</p>}
    </div>
  </section>
);

const MetricPanel = ({ title, rows }: MetricPanelProps) => (
  <section className="rounded border border-jata-graphite-mist bg-jata-iron-charcoal p-3">
    <h2 className="font-mono text-[11px] uppercase tracking-widest text-jata-text-muted mb-2">{title}</h2>
    <div className="space-y-2">
      {rows.slice(0, 4).map((row) => (
        <div key={row.key} className="grid grid-cols-[1fr_auto] gap-2 text-xs">
          <span className="text-jata-text-primary truncate">{row.key}</span>
          <span className="font-mono text-jata-text-muted">
            {Math.round(row.response_rate * 100)}% ({row.responses}/{row.applications})
          </span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-jata-text-muted">No usable data yet</p>}
    </div>
  </section>
);

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

  const pipelineQueues = useMemo(
    () => buildPipelineQueues(applications ?? []),
    [applications],
  );
  const pipelineAnalytics = useMemo(
    () => buildPipelineAnalytics(applications ?? []),
    [applications],
  );

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
  const activeApplications =
    totalApplications -
    applications.filter((app) =>
      ['rejected', 'closed', 'archived'].includes(normalizePipelineStatus(app.status, app.capture_status))
    ).length;
  const interviews = applications?.filter(
    (app) => normalizePipelineStatus(app.status, app.capture_status) === 'interviewing'
  ).length || 0;
  const thisWeek = pipelineQueues.appliedThisWeek.length;

  return (
    <div className="p-sm sm:p-md lg:p-lg">
      <CreateApplicationModal />
      

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

      <div className="mt-md">
        <div className="flex items-center justify-between mb-sm">
          <h1 className="text-xl font-medium">Action Queues</h1>
          <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
            Pipeline
          </span>
        </div>
        <div className="grid gap-sm md:grid-cols-2 xl:grid-cols-5">
          <QueuePanel title="Due Today" items={pipelineQueues.dueToday} tone="warning" />
          <QueuePanel title="Overdue" items={pipelineQueues.overdue} tone="danger" />
          <QueuePanel title="Applied This Week" items={pipelineQueues.appliedThisWeek} />
          <QueuePanel title="High Score Waiting" items={pipelineQueues.highScoreWaiting} tone="success" />
          <QueuePanel title="Packs Ready" items={pipelineQueues.packsReady} tone="success" />
        </div>
      </div>

      <div className="mt-md">
        <div className="flex items-center justify-between mb-sm">
          <h1 className="text-xl font-medium">Response Analytics</h1>
          <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
            MVP
          </span>
        </div>
        <div className="grid gap-sm md:grid-cols-3">
          <MetricPanel title="By Source" rows={pipelineAnalytics.bySource} />
          <MetricPanel title="By Band" rows={pipelineAnalytics.byBand} />
          <MetricPanel title="By Industry" rows={pipelineAnalytics.byIndustry} />
        </div>
      </div>

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
