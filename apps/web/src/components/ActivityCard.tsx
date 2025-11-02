import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface ActivityCardProps {
  data: {
    applications_submitted: number;
    interviews_landed: number;
    average_response_time_days: number | null;
  };
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ data }) => {
  const interviewRate = data.applications_submitted > 0 
    ? ((data.interviews_landed / data.applications_submitted) * 100).toFixed(1)
    : '0.0';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Your 30-Day Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Applications Submitted</span>
          <span className="text-xl font-bold text-primary">{data.applications_submitted}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Interviews Landed</span>
          <div className="text-right">
            <span className="text-xl font-bold text-green-600 dark:text-green-400">{data.interviews_landed}</span>
            {data.applications_submitted > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">({interviewRate}%)</span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">Avg. Response Time</span>
          <span className="text-xl font-bold">
            {data.average_response_time_days !== null
              ? `${data.average_response_time_days} days`
              : <span className="text-muted-foreground text-base">N/A</span>}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
