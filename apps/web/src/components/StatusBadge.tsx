import React from 'react';

interface StatusBadgeProps {
  status: string | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'interviewing':
      case 'interview':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'offer':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'applied':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'saved':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const displayStatus = status || 'Unknown';
  const capitalizedStatus = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).toLowerCase();

  return (
    <span 
      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full border ${getStatusStyles()}`}
      role="status"
      aria-label={`Application status: ${capitalizedStatus}`}
    >
      {capitalizedStatus}
    </span>
  );
};
