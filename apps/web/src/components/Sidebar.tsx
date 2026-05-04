import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  Puzzle,
  Settings,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mode: 'collapsed' | 'expanded' | 'hover';
  onModeChange: (mode: 'collapsed' | 'expanded' | 'hover') => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'cover-letters', label: 'Cover Letters', icon: Mail, path: '/cover-letter' },
  { id: 'extension', label: 'Extension', icon: Puzzle, path: '/install-extension', badge: 'New' },
];

const bottomNavItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  onToggle, 
  mode, 
  onModeChange 
}) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Determine effective state (collapsed or expanded) based on mode and hover
  const isExpanded = mode === 'expanded' || (mode === 'hover' && isHovered);

  // Handle mouse enter/leave for hover mode
  const handleMouseEnter = () => {
    if (mode === 'hover') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (mode === 'hover') {
      setIsHovered(false);
    }
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-jata-accent-lime/10 text-jata-accent-lime" 
                  : "text-jata-text-secondary hover:bg-jata-graphite-mist hover:text-jata-text-primary"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 min-w-[20px]",
                isActive ? "text-jata-accent-lime" : "text-jata-text-secondary group-hover:text-jata-text-primary"
              )} />
              
              <span className={cn(
                "whitespace-nowrap overflow-hidden transition-all duration-200 font-medium",
                isExpanded ? "opacity-100 w-auto translate-x-0" : "opacity-0 w-0 -translate-x-2 hidden"
              )}>
                {item.label}
              </span>

              {item.badge && isExpanded && (
                <span className="ml-auto text-[10px] font-bold bg-jata-accent-blue/20 text-jata-accent-blue px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              
              {item.badge && !isExpanded && (
                 <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-jata-accent-blue block" />
              )}
            </NavLink>
          </TooltipTrigger>
          {!isExpanded && (
            <TooltipContent side="right" className="bg-jata-bg-surface border-jata-border text-jata-text-primary ml-2">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-jata-bg-surface border-r border-jata-border transition-all duration-200 z-30",
        isExpanded ? "w-[240px]" : "w-[60px]"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sidebar Toggle (Only visible in expanded or manually collapsed mode, not hover mode interaction) */}
      <div className={cn(
        "h-[48px] flex items-center border-b border-jata-border",
        isExpanded ? "justify-end px-4" : "justify-center"
      )}>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-jata-graphite-mist text-jata-text-secondary transition-colors"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none">
        {navItems.map((item) => (
          <NavItemComponent key={item.id} item={item} />
        ))}
      </nav>

      <div className="p-2 border-t border-jata-border space-y-1">
        {bottomNavItems.map((item) => (
          <NavItemComponent key={item.id} item={item} />
        ))}
        
        {/* Mode Toggle (Hidden in collapsed state for simplicity, or could be an icon) */}
        {isExpanded && (
           <div className="mt-2 px-3 py-2 text-xs text-jata-text-muted flex items-center justify-between">
              <span>Sidebar Mode</span>
              <button 
                onClick={() => onModeChange(mode === 'hover' ? 'collapsed' : 'hover')}
                className="text-jata-accent-blue hover:underline"
              >
                {mode === 'hover' ? 'Hover' : 'Manual'}
              </button>
           </div>
        )}
      </div>
    </aside>
  );
};
