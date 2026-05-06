import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardStatsCardProps {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  thisWeek: number;
}

interface StatCell {
  label: string;
  value: number;
  valueColor: string;
  accentColor: string;
}

const DashboardStatsCard: React.FC<DashboardStatsCardProps> = ({
  totalApplications,
  activeApplications,
  interviews,
  thisWeek,
}) => {
  const cells: StatCell[] = [
    {
      label: 'Total',
      value: totalApplications,
      valueColor: 'text-jata-accent-blue',
      accentColor: 'border-l-jata-accent-blue',
    },
    {
      label: 'Active',
      value: activeApplications,
      valueColor: 'text-jata-status-active',
      accentColor: 'border-l-jata-status-active',
    },
    {
      label: 'Interviews',
      value: interviews,
      valueColor: 'text-jata-status-interview',
      accentColor: 'border-l-jata-status-interview',
    },
    {
      label: 'This Week',
      value: thisWeek,
      valueColor: 'text-jata-accent-lime',
      accentColor: 'border-l-jata-accent-lime',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 mb-md border border-jata-graphite-mist rounded-lg overflow-hidden">
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className={cn(
            'flex flex-col gap-1 px-4 py-3 border-l-2 bg-jata-iron-charcoal',
            cell.accentColor,
            i > 0 && 'border-r-0',
            i < cells.length - 1 && 'border-r border-r-jata-graphite-mist'
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
            {cell.label}
          </span>
          <span className={cn('font-data text-2xl font-semibold leading-none', cell.valueColor)}>
            {cell.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsCard;
