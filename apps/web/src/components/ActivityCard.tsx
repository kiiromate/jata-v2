import React from 'react';

interface ActivityCardProps {
  data: {
    applications_submitted: number;
    interviews_landed: number;
    average_response_time_days: number | null;
  };
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ data }) => {
  const interviewRate =
    data.applications_submitted > 0
      ? ((data.interviews_landed / data.applications_submitted) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="w-full border border-jata-graphite-mist rounded-lg bg-jata-iron-charcoal mb-md overflow-hidden">
      <div className="px-4 py-2.5 border-b border-jata-graphite-mist">
        <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
          30-Day Activity
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-jata-graphite-mist">
        <MetricRow
          label="Submitted"
          value={String(data.applications_submitted)}
          valueColor="text-jata-accent-blue"
        />
        <MetricRow
          label="Interviews"
          value={String(data.interviews_landed)}
          sub={data.applications_submitted > 0 ? `${interviewRate}%` : undefined}
          valueColor="text-jata-status-offer"
        />
        <MetricRow
          label="Avg Response"
          value={
            data.average_response_time_days !== null
              ? `${data.average_response_time_days}d`
              : '—'
          }
          valueColor={
            data.average_response_time_days !== null
              ? 'text-jata-text-primary'
              : 'text-jata-text-muted'
          }
        />
      </div>
    </div>
  );
};

function MetricRow({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={`font-data text-xl font-semibold leading-none ${valueColor}`}>
          {value}
        </span>
        {sub && (
          <span className="font-mono text-[10px] text-jata-text-muted">{sub}</span>
        )}
      </div>
    </div>
  );
}
