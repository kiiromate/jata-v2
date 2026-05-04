import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { useExtensionSync } from '@/hooks/useExtensionSync';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type SidebarMode = 'collapsed' | 'expanded' | 'hover';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Sync session with extension
  useExtensionSync();

  // Default to collapsed for a cleaner initial look
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('collapsed');
  
  // Load preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('jata-sidebar-mode') as SidebarMode;
    if (savedMode && ['collapsed', 'expanded', 'hover'].includes(savedMode)) {
      setSidebarMode(savedMode);
    }
  }, []);

  const handleModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode);
    localStorage.setItem('jata-sidebar-mode', mode);
  };

  const toggleSidebar = () => {
    if (sidebarMode === 'collapsed') {
      handleModeChange('expanded');
    } else {
      handleModeChange('collapsed');
    }
  };

  // Determine if sidebar is currently visually expanded (for layout adjustments if needed)
  // Note: The main content margin/padding handles the layout shift via flexbox
  
  return (
    <div className="flex h-screen bg-jata-deep-carbon text-jata-text-primary overflow-hidden font-body">
      <Sidebar
        isCollapsed={sidebarMode === 'collapsed'}
        onToggle={toggleSidebar}
        mode={sidebarMode}
        onModeChange={handleModeChange}
      />
      
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-200">
        <AppHeader />
        
        <main 
          id="main-content"
          className="flex-1 overflow-y-auto p-6 scroll-smooth"
          role="main"
        >
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
