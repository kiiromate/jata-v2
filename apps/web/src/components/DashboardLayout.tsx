import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { useExtensionSync } from '@/hooks/useExtensionSync';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type SidebarMode = 'collapsed' | 'expanded';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Sync session with extension
  useExtensionSync();

  // Default to expanded so navigation labels are visible without hover.
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('expanded');

  // Load preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('jata-sidebar-mode');
    if (savedMode && ['collapsed', 'expanded'].includes(savedMode)) {
      setSidebarMode(savedMode as SidebarMode);
    } else if (savedMode === 'hover') {
      localStorage.setItem('jata-sidebar-mode', 'expanded');
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

  return (
    <div className="flex h-screen bg-jata-deep-carbon text-jata-text-primary overflow-hidden font-body">
      <Sidebar
        isExpanded={sidebarMode === 'expanded'}
        onToggle={toggleSidebar}
      />

      <div className="flex-1 flex flex-col h-full min-w-0">
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
