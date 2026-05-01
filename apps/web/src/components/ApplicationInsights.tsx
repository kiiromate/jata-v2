import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface InsightMetric {
  label: string;
  value: string | number;
  change?: number; // percentage change
  format?: 'number' | 'percentage' | 'days';
}

interface ApplicationInsightsProps {
  metrics: {
    totalApplications: number;
    interviewRate: number;
    offerRate: number;
    averageResponseTime: number;
    weekOverWeekChange: number;
    topPerformingSource?: string;
    topPerformingIndustry?: string;
  };
}

const ApplicationInsights: React.FC<ApplicationInsightsProps> = ({ metrics }) => {
  const formatMetric = (value: number, format: string = 'number'): string => {
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    if (format === 'days') {
      return `${value.toFixed(0)} days`;
    }
    return value.toString();
  };

  const getTrendIcon = (change?: number) => {
    if (!change || Math.abs(change) < 0.5) {
      return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTrendColor = (change?: number): string => {
    if (!change || Math.abs(change) < 0.5) return 'text-muted-foreground';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const insights: InsightMetric[] = [
    {
      label: 'Total Applications',
      value: metrics.totalApplications,
      change: metrics.weekOverWeekChange,
    },
    {
      label: 'Interview Rate',
      value: formatMetric(metrics.interviewRate, 'percentage'),
      format: 'percentage',
    },
    {
      label: 'Offer Rate',
      value: formatMetric(metrics.offerRate, 'percentage'),
      format: 'percentage',
    },
    {
      label: 'Avg Response Time',
      value: formatMetric(metrics.averageResponseTime, 'days'),
      format: 'days',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{insight.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">{insight.value}</p>
                  {insight.change !== undefined && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(insight.change)}
                      <span className={`text-xs font-medium ${getTrendColor(insight.change)}`}>
                        {Math.abs(insight.change).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-3">Insights</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {metrics.interviewRate > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                You are getting interviews on <strong>{metrics.interviewRate.toFixed(1)}%</strong> of your applications
              </span>
            </li>
          )}
          {metrics.offerRate > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                Your interview-to-offer conversion rate is <strong>{metrics.offerRate.toFixed(1)}%</strong>
              </span>
            </li>
          )}
          {metrics.averageResponseTime > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                On average, you hear back in <strong>{metrics.averageResponseTime.toFixed(0)} days</strong>
              </span>
            </li>
          )}
          {metrics.weekOverWeekChange !== 0 && Math.abs(metrics.weekOverWeekChange) >= 1 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                Your application volume is{' '}
                <strong>
                  {metrics.weekOverWeekChange > 0 ? 'up' : 'down'}{' '}
                  {Math.abs(metrics.weekOverWeekChange).toFixed(0)}%
                </strong>{' '}
                from last week
              </span>
            </li>
          )}
          {metrics.topPerformingSource && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                <strong>{metrics.topPerformingSource}</strong> is your top performing application source
              </span>
            </li>
          )}
          {metrics.topPerformingIndustry && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                You have the most success in <strong>{metrics.topPerformingIndustry}</strong>
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ApplicationInsights;
