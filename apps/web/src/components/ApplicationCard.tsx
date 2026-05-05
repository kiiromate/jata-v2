import React from 'react';
import { Link } from 'react-router-dom';
import type { Database } from '@jata/common';
import { StatusBadge } from './StatusBadge.tsx';

type Application = Database['public']['Tables']['applications']['Row'];

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  const appliedDate = new Date(application.date_applied);
  const formattedAppliedDate = Number.isNaN(appliedDate.getTime())
    ? application.date_applied
    : appliedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <div className="bg-card rounded-lg border border-border p-4 flex flex-col justify-between h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5 group">
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-lg text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {application.title}
          </h3>
          <StatusBadge status={application.status} />
        </div>
        <p className="text-muted-foreground text-sm">{application.company}</p>
      </div>
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
        <time className="text-xs text-muted-foreground" dateTime={application.date_applied}>
          {formattedAppliedDate}
        </time>
        <Link 
          to={`/resume-tailor/${application.id}`} 
          className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
          aria-label={`Tailor resume for ${application.title} at ${application.company}`}
        >
          Tailor Resume →
        </Link>
      </div>
    </div>
  );
};
