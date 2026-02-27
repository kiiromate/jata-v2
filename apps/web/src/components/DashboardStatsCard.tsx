import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Briefcase, Calendar, CheckCircle, Clock } from 'lucide-react';

interface DashboardStatsCardProps {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  thisWeek: number;
}

/**
 * Renders dashboard summary cards with semantic JATA accent color mappings.
 */
const DashboardStatsCard: React.FC<DashboardStatsCardProps> = ({
  totalApplications,
  activeApplications,
  interviews,
  thisWeek,
}) => {
  const stats = [
    {
      label: 'Total Applications',
      value: totalApplications,
      icon: Briefcase,
      color: 'text-[color:var(--jata-accent-blue)]',
      bgColor: 'bg-[color:var(--jata-accent-blue)]/10',
    },
    {
      label: 'Active',
      value: activeApplications,
      icon: Clock,
      color: 'text-[color:var(--jata-accent-lime)]',
      bgColor: 'bg-[color:var(--jata-accent-lime)]/10',
    },
    {
      label: 'Interviews',
      value: interviews,
      icon: CheckCircle,
      color: 'text-[color:var(--jata-accent-orange)]',
      bgColor: 'bg-[color:var(--jata-accent-orange)]/10',
    },
    {
      label: 'This Week',
      value: thisWeek,
      icon: Calendar,
      color: 'text-[color:var(--jata-accent-rust)]',
      bgColor: 'bg-[color:var(--jata-accent-rust)]/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-sm mb-md">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-md`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStatsCard;
