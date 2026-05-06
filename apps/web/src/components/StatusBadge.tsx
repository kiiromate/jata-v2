import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  applied: {
    label: 'Applied',
    className: 'text-jata-status-active border-jata-status-active/20 bg-jata-status-active/10',
  },
  interview: {
    label: 'Interview',
    className: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10',
  },
  interviewing: {
    label: 'Interview',
    className: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10',
  },
  offer: {
    label: 'Offer',
    className: 'text-jata-status-offer border-jata-status-offer/20 bg-jata-status-offer/10',
  },
  rejected: {
    label: 'Rejected',
    className: 'text-jata-status-rejected border-jata-status-rejected/20 bg-jata-status-rejected/10',
  },
  saved: {
    label: 'Saved',
    className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const key = status?.toLowerCase() ?? '';
  const config = STATUS_MAP[key] ?? {
    label: status ?? 'Unknown',
    className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10',
  };

  return (
    <span
      role="status"
      aria-label={`Application status: ${config.label}`}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm border',
        'font-mono text-[10px] uppercase tracking-widest whitespace-nowrap',
        config.className
      )}
    >
      {config.label}
    </span>
  );
};
