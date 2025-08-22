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
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Your 30-Day Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Applications Submitted</span>
          <span className="text-lg font-semibold">{data.applications_submitted}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Interviews Landed</span>
          <span className="text-lg font-semibold">{data.interviews_landed}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Avg. Response Time</span>
          <span className="text-lg font-semibold">
            {data.average_response_time_days !== null
              ? `${data.average_response_time_days} days`
              : 'N/A'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
