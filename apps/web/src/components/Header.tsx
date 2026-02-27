import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import IconNav from './IconNav';
import { ThemeToggle } from './ThemeToggle';

const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Cover Letters', to: '/cover-letter' },
  { label: 'Extension', to: '/install-extension' },
];

/**
 * Renders the public header with desktop and mobile navigation variants.
 */
const Header = () => {
  const { session } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Closes the mobile navigation whenever route changes.
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /**
   * Toggles the mobile navigation panel visibility.
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <>
      {/* Skip Navigation Link for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header
        className="fixed top-0 left-0 z-50 w-full bg-jata-deep-carbon/95 text-jata-text-primary backdrop-blur-sm shadow-sm border-b border-jata-border"
        role="banner"
      >
        <nav className="container mx-auto flex h-16 sm:h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6" aria-label="Main navigation">
          <Link 
            to={session ? "/dashboard" : "/"} 
            className="text-xl font-bold text-jata-text-primary" 
            aria-label={session ? "Go to Dashboard" : "JATA Home"}
          >
            JATA
          </Link>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <>
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-jata-text-primary hover:bg-jata-graphite-mist transition-colors"
                  onClick={toggleMobileMenu}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="header-mobile-menu"
                  aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div className="hidden md:flex md:items-center">
                  <IconNav />
                </div>
              </>
            ) : (
              <Link 
                to="/signin" 
                className="px-4 py-2 text-sm font-medium text-jata-text-primary bg-jata-bg-surface border border-jata-border rounded-full shadow-sm hover:bg-jata-graphite-mist transition-colors"
                aria-label="Sign in to your account"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>

        {session && isMobileMenuOpen && (
          <div
            id="header-mobile-menu"
            className="md:hidden border-t border-jata-border bg-jata-bg-surface px-4 py-4"
          >
            <ul className="space-y-2">
              {MOBILE_NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-jata-text-primary hover:bg-jata-graphite-mist transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
