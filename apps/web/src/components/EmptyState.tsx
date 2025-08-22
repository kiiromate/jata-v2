import React from 'react';
import { Frown } from 'lucide-react'; // Using Frown icon as a placeholder

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500 bg-gray-50 rounded-lg shadow-inner">
      {icon || <Frown size={48} className="mb-4" />}
      <p className="text-lg text-center">{message}</p>
    </div>
  );
};

export default EmptyState;