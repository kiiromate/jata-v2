import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart2, FileText, Puzzle, LucideIcon } from 'lucide-react';
import Tooltip from './Tooltip';
import UserDropdown from './UserDropdown';
import FeedbackButton from './FeedbackButton';
import { submitFeedback } from '@/services/feedbackService';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  tooltip: string;
  badge?: {
    text: string;
    variant: 'default' | 'highlight' | 'success';
  };
  showLabel?: boolean;
}

const IconNav = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      tooltip: 'View your applications',
      showLabel: true
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart2,
      path: '/analytics',
      tooltip: 'Track your success metrics',
      showLabel: true
    },
    {
      id: 'cover-letter',
      label: 'Cover Letters',
      icon: FileText,
      path: '/cover-letter',
      tooltip: 'Generate AI cover letters',
      showLabel: true
    },
    {
      id: 'extension',
      label: 'Extension',
      icon: Puzzle,
      path: '/install-extension',
      tooltip: 'Install browser extension',
      badge: {
        text: 'New',
        variant: 'highlight'
      },
      showLabel: true
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getBadgeClasses = (variant: 'default' | 'highlight' | 'success') => {
    switch (variant) {
      case 'highlight':
        return 'bg-cyan-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 mr-2 sm:mr-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <Tooltip key={item.id} content={item.tooltip} delay={300}>
            <Link
              to={item.path}
              className={`
                relative flex items-center gap-2 px-3 py-2 rounded-lg
                transition-all duration-100 ease-in-out
                ${active 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.showLabel && (
                <span className="hidden md:inline text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
              {item.badge && (
                <span 
                  className={`
                    absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full
                    ${getBadgeClasses(item.badge.variant)}
                  `}
                >
                  {item.badge.text}
                </span>
              )}
            </Link>
          </Tooltip>
        );
      })}
      
      <FeedbackButton variant="icon" onSubmit={submitFeedback} />
      
      <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
      <UserDropdown />
    </div>
  );
};

export default IconNav;
