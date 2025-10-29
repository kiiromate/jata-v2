import React from 'react';
import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card>
      <CardContent className="p-sm">
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">{trendValue}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface AnalyticsSummaryCardsProps {
  totalApplications: number;
  interviewRate: number;
  offerRate: number;
  averageResponseTime: number;
  weekOverWeekChange: number;
}

const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({
  totalApplications,
  interviewRate,
  offerRate,
  averageResponseTime,
  weekOverWeekChange,
}) => {
  const getTrend = (value: number): 'up' | 'down' | 'neutral' => {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'neutral';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-sm mb-md">
      <SummaryCard
        title="Total Applications"
        value={totalApplications}
        trend={getTrend(weekOverWeekChange)}
        trendValue={`${Math.abs(weekOverWeekChange)}%`}
      />
      <SummaryCard
        title="Interview Rate"
        value={`${interviewRate.toFixed(1)}%`}
        subtitle="Of all applications"
      />
      <SummaryCard
        title="Offer Rate"
        value={`${offerRate.toFixed(1)}%`}
        subtitle="Of all applications"
      />
      <SummaryCard
        title="Avg Response Time"
        value={averageResponseTime > 0 ? `${averageResponseTime}d` : 'N/A'}
        subtitle="Days to hear back"
      />
      <SummaryCard
        title="Success Rate"
        value={`${(offerRate > 0 ? (offerRate / interviewRate * 100) : 0).toFixed(0)}%`}
        subtitle="Offers from interviews"
      />
    </div>
  );
};

export default AnalyticsSummaryCards;
