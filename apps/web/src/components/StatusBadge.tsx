import React from 'react';
import { getPipelineStatusClass, getPipelineStatusLabel } from '@jata/common';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string | null;
  captureStatus?: string | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, captureStatus }) => {
  const label = getPipelineStatusLabel(status, captureStatus);
  const className = getPipelineStatusClass(status, captureStatus);

  return (
    <span
      role="status"
      aria-label={`Application status: ${label}`}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm border',
        'font-mono text-[10px] uppercase tracking-widest whitespace-nowrap',
        className
      )}
    >
      {label}
    </span>
  );
};
