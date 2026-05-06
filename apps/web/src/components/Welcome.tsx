import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, PenLine } from 'lucide-react';
import { Button } from './ui/button';
import { useDashboardStore } from '../store/dashboardStore';
import CreateApplicationModal from './CreateApplicationModal';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useDashboardStore();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <CreateApplicationModal />

      <div className="w-full max-w-lg border border-jata-graphite-mist bg-jata-iron-charcoal rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-jata-graphite-mist">
          <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
            Getting Started
          </span>
          <h1 className="mt-1.5 text-lg font-semibold text-jata-text-primary">
            No applications yet
          </h1>
          <p className="mt-1 text-sm text-jata-text-secondary">
            Add your first job application to start tracking your search.
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-jata-graphite-mist">
          <OptionBlock
            icon={<Puzzle className="w-5 h-5" />}
            title="Install Extension"
            description="Capture job details automatically from any job board."
            iconColor="text-jata-accent-blue"
          />
          <OptionBlock
            icon={<PenLine className="w-5 h-5" />}
            title="Manual Entry"
            description="Add applications by hand with full control."
            iconColor="text-jata-accent-lime"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-jata-graphite-mist">
          <Button
            onClick={() => navigate('/install-extension')}
            size="sm"
            className="flex-1"
          >
            Install Extension
          </Button>
          <Button
            variant="outline"
            onClick={openModal}
            size="sm"
            className="flex-1"
          >
            Add Manually
          </Button>
        </div>
      </div>
    </div>
  );
};

function OptionBlock({
  icon,
  title,
  description,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor: string;
}) {
  return (
    <div className="px-6 py-5 space-y-2">
      <span className={iconColor}>{icon}</span>
      <h3 className="font-medium text-jata-text-primary text-sm">{title}</h3>
      <p className="text-xs text-jata-text-muted leading-relaxed">{description}</p>
    </div>
  );
}

export default Welcome;
