import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider'; // Corrected import
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Moon, Sun, Laptop, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Corrected import
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
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full" aria-label="User menu" title="Open user menu">
        <Avatar avatarUrl={avatarUrl} name={profile?.full_name} />
      </button>
      {isOpen && (
        <div className="absolute right-0 w-56 mt-2 bg-white rounded-md shadow-xl z-20 overflow-hidden">
          <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <Settings className="w-5 h-5 mr-2" />
            Account Settings
          </Link>
          <div className="border-t border-gray-100" />
          <div className="px-4 py-2">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Theme</div>
            <div className="flex items-center space-x-2">
              <Button variant={theme === 'light' ? 'secondary' : 'outline'} size="icon" onClick={() => setTheme('light')} aria-label="Light theme">
                <Sun className="h-5 w-5" />
                <span className="sr-only">Light</span>
              </Button>
              <Button variant={theme === 'system' ? 'secondary' : 'outline'} size="icon" onClick={() => setTheme('system')} aria-label="System theme">
                <Laptop className="h-5 w-5" />
                <span className="sr-only">System</span>
              </Button>
              <Button variant={theme === 'dark' ? 'secondary' : 'outline'} size="icon" onClick={() => setTheme('dark')} aria-label="Dark theme">
                <Moon className="h-5 w-5" />
                <span className="sr-only">Dark</span>
              </Button>
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100" title="Sign out">
            <LogOut className="w-5 h-5 mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
