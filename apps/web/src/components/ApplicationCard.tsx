import React from 'react';
import { Link } from 'react-router-dom';
import type { Database } from '../../../../packages/common/types/database';
import { StatusBadge } from './StatusBadge.tsx';

type Application = Database['public']['Tables']['applications']['Row'];

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 flex flex-col justify-between h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg text-card-foreground">{application.title}</h3>
          <StatusBadge status={application.status} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">{application.company}</p>
      </div>
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-muted-foreground">{new Date(application.date_applied).toLocaleDateString()}</p>
        <Link to={`/resume-tailor/${application.id}`} className="text-sm text-primary hover:text-primary/80 transition-colors">
          Tailor Resume
        </Link>
      </div>
    </div>
  );
};
