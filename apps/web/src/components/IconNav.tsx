import { Link } from 'react-router-dom';
import { LayoutDashboard, BarChart2, MessageSquarePlus, Puzzle } from 'lucide-react';
import Tooltip from './Tooltip';
import UserDropdown from './UserDropdown';

const IconNav = () => {
  return (
    <div className="flex items-center space-x-4 mr-4">
      <Tooltip text="Dashboard">
        <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <LayoutDashboard className="w-5 h-5 text-gray-700" />
        </Link>
      </Tooltip>
      <Tooltip text="Analytics">
        <Link to="/analytics" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <BarChart2 className="w-5 h-5 text-gray-700" />
        </Link>
      </Tooltip>
      <Tooltip text="Feedback">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Submit Feedback">
          <MessageSquarePlus className="w-5 h-5 text-gray-700" />
        </button>
      </Tooltip>
      <Tooltip text="Extension">
        <Link to="/install-extension" className="relative p-2 rounded-full hover:bg-gray-200 transition-colors animate-pulse shadow-lg shadow-cyan-500/50">
          <Puzzle className="w-5 h-5 text-gray-700" />
        </Link>
      </Tooltip>
      <div className="border-l border-gray-300 h-6 mx-2"></div>
      <UserDropdown />
    </div>
  );
};

export default IconNav;
