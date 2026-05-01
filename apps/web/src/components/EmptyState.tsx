import React from 'react';
import { Frown } from 'lucide-react'; // Using Frown icon as a placeholder

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/30 rounded-lg border-2 border-dashed border-border">
      <div className="mb-4 opacity-50">
        {icon || <Frown size={56} strokeWidth={1.5} />}
      </div>
      <p className="text-base text-center max-w-md leading-relaxed">{message}</p>
    </div>
  );
};

export default EmptyState;