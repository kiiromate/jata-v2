import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Puzzle, FileText, BarChart2 } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { cn } from '@/lib/utils';

const ACTIONS = [
  {
    label: 'Add Application',
    icon: Plus,
    type: 'button' as const,
  },
  {
    label: 'Extension',
    icon: Puzzle,
    type: 'link' as const,
    href: '/install-extension',
  },
  {
    label: 'Cover Letter',
    icon: FileText,
    type: 'link' as const,
    href: '/cover-letter',
  },
  {
    label: 'Analytics',
    icon: BarChart2,
    type: 'link' as const,
    href: '/analytics',
  },
] as const;

const actionBase =
  'flex items-center gap-2 px-3 py-1.5 rounded border border-jata-graphite-mist bg-transparent text-jata-text-secondary font-mono text-[10px] uppercase tracking-widest hover:border-jata-accent-lime/40 hover:text-jata-text-primary transition-colors';

const DashboardWelcomeCard: React.FC = () => {
  const { openModal } = useDashboardStore();

  return (
    <div className="flex flex-wrap gap-2 mb-md">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        if (action.type === 'button') {
          return (
            <button
              key={action.label}
              onClick={openModal}
              className={cn(actionBase, 'cursor-pointer')}
            >
              <Icon className="w-3.5 h-3.5" />
              {action.label}
            </button>
          );
        }
        return (
          <Link key={action.label} to={action.href} className={actionBase}>
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
};

export default DashboardWelcomeCard;
