import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, BarChart2, FileText, MessageSquarePlus, Puzzle } from 'lucide-react';
import Tooltip from './Tooltip';
import UserDropdown from './UserDropdown';
import FeedbackModal from './FeedbackModal';
import { ThemeToggle } from './ThemeToggle';

const IconNav = () => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-2 sm:space-x-4 mr-2 sm:mr-4">
        <Tooltip text="Dashboard">
          <Link to="/dashboard" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <LayoutDashboard className="w-5 h-5 text-foreground" />
          </Link>
        </Tooltip>
        <Tooltip text="Analytics">
          <Link to="/analytics" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <BarChart2 className="w-5 h-5 text-foreground" />
          </Link>
        </Tooltip>
        <Tooltip text="Cover Letter">
          <Link to="/cover-letter" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <FileText className="w-5 h-5 text-foreground" />
          </Link>
        </Tooltip>
        <Tooltip text="Feedback">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Submit Feedback"
          >
            <MessageSquarePlus className="w-5 h-5 text-foreground" />
          </button>
        </Tooltip>
        <Tooltip text="Extension">
          <Link to="/install-extension" className="relative p-2 rounded-full hover:bg-secondary transition-colors animate-pulse shadow-lg shadow-cyan-500/50 dark:shadow-cyan-400/30">
            <Puzzle className="w-5 h-5 text-foreground" />
          </Link>
        </Tooltip>
        <div className="border-l border-border h-6 mx-2"></div>
        <ThemeToggle />
        <UserDropdown />
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
};

export default IconNav;
