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
    <div className="group bg-jata-iron-charcoal border border-jata-graphite-mist rounded-lg p-4 flex flex-col justify-between h-full transition-colors hover:border-jata-graphite-mist/80 hover:bg-jata-bg-elevated">
      <div>
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="font-medium text-sm text-jata-text-primary line-clamp-2 group-hover:text-white transition-colors">
            {application.title}
          </h3>
          <StatusBadge status={application.status} />
        </div>
        <p className="text-xs text-jata-text-muted">{application.company}</p>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-jata-graphite-mist">
        <time
          className="font-mono text-[10px] text-jata-text-muted"
          dateTime={application.date_applied}
        >
          {formattedAppliedDate}
        </time>
        <Link
          to={`/resume-tailor/${application.id}`}
          className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted hover:text-jata-accent-lime transition-colors focus:outline-none focus:ring-1 focus:ring-jata-accent-lime/40 rounded px-1"
          aria-label={`Tailor resume for ${application.title} at ${application.company}`}
        >
          Tailor →
        </Link>
      </div>
    </div>
  );
};
