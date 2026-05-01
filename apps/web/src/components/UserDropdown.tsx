import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider'; // Corrected import
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Moon, Sun, Laptop, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';
import { Button } from '@/components/ui/button';

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile } = useAuth(); // Using full auth context
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // The avatar URL is now directly available from the profile in AuthContext
  const avatarUrl = profile?.avatar_url || null;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full" 
        aria-label="User menu" 
        title="Open user menu"
        aria-expanded={isOpen}
      >
        <Avatar avatarUrl={avatarUrl} name={profile?.full_name || user?.email} className="w-10 h-10" />
      </button>
      {isOpen && (
        <div className="absolute right-0 w-56 mt-2 bg-popover border border-border rounded-md shadow-xl z-20 overflow-hidden text-popover-foreground">
          <Link to="/settings" className="flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
            <Settings className="w-5 h-5 mr-2" />
            Account Settings
          </Link>
          <div className="border-t border-border" />
          <div className="px-4 py-2">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Theme</div>
            <div className="flex items-center space-x-2">
              <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTheme('light')} aria-label="Light theme" className="h-8 w-8">
                <Sun className="h-4 w-4" />
                <span className="sr-only">Light</span>
              </Button>
              <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTheme('system')} aria-label="System theme" className="h-8 w-8">
                <Laptop className="h-4 w-4" />
                <span className="sr-only">System</span>
              </Button>
              <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTheme('dark')} aria-label="Dark theme" className="h-8 w-8">
                <Moon className="h-4 w-4" />
                <span className="sr-only">Dark</span>
              </Button>
            </div>
          </div>
          <div className="border-t border-border" />
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-destructive hover:text-destructive-foreground transition-colors" title="Sign out">
            <LogOut className="w-5 h-5 mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
