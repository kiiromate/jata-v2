import React from 'react';
import { Link } from 'react-router-dom';
import type { Database } from '../../../../packages/common/types/database';
import { StatusBadge } from './StatusBadge.tsx';

type Application = Database['public']['Tables']['applications']['Row'];

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-gray-800">{application.title}</h3>
          <StatusBadge status={application.status} />
        </div>
        <p className="text-gray-600 text-sm mt-1">{application.company}</p>
      </div>
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-500">{new Date(application.date_applied).toLocaleDateString()}</p>
        <Link to={`/resume-tailor/${application.id}`} className="text-sm text-indigo-600 hover:text-indigo-900">
          Tailor Resume
        </Link>
      </div>
    </div>
  );
};
