import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  title: string;
  message: string;
  action?: React.ReactNode;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title, message, action }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
};

export default ErrorDisplay;
