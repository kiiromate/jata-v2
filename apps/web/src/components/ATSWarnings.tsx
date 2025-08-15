import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ATSWarning {
  level: 'warn' | 'info';
  message: string;
}

interface ATSWarningsProps {
  warnings: ATSWarning[];
}

const ATSWarnings: React.FC<ATSWarningsProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ATS Formatting Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {warnings.map((warning, index) => (
          <div key={index} className="flex items-center space-x-2">
            {warning.level === 'info' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <p className="text-sm">{warning.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ATSWarnings;
