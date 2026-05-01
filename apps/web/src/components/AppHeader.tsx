import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import FeedbackButton from './FeedbackButton';
import UserDropdown from './UserDropdown';
import { submitFeedback } from '@/services/feedbackService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AppHeaderProps {
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ className }) => {
  return (
    <header 
      className={cn(
        "h-app-header bg-jata-bg-surface border-b border-jata-border flex items-center justify-between px-6 z-20 sticky top-0",
        className
      )}
    >
      {/* Left: Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 group">
        <Logo size="sm" animated />
        <span className="font-headline font-semibold text-lg text-jata-text-primary tracking-tight group-hover:text-white transition-colors">
          jata
        </span>
      </Link>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Help Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/faq"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-jata-text-secondary hover:bg-jata-graphite-mist hover:text-jata-text-primary transition-colors"
                aria-label="Help and FAQ"
              >
                <HelpCircle className="w-5 h-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Help & FAQ</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Feedback Button */}
        <div className="flex items-center">
          <FeedbackButton 
            variant="icon" 
            onSubmit={submitFeedback}
            className="text-jata-text-secondary hover:bg-jata-graphite-mist hover:text-jata-text-primary"
          />
        </div>

        {/* User Dropdown */}
        <div className="border-l border-jata-border pl-4 ml-1">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
