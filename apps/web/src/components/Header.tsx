import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import IconNav from './IconNav';
import { ThemeToggle } from './ThemeToggle';

const Header = () => {
  const { session } = useAuth();
  
  // Don't hide header during loading - show it immediately

  return (
    <>
      {/* Skip Navigation Link for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="fixed top-0 left-0 z-50 w-full bg-background/80 backdrop-blur-sm shadow-sm border-b" role="banner">
        <nav className="container mx-auto flex h-16 sm:h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6" aria-label="Main navigation">
          <Link 
            to={session ? "/dashboard" : "/"} 
            className="text-xl font-bold text-foreground" 
            aria-label={session ? "Go to Dashboard" : "JATA Home"}
          >
            JATA
          </Link>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <IconNav />
            ) : (
              <Link 
                to="/signin" 
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-full shadow-sm hover:bg-accent transition-colors"
                aria-label="Sign in to your account"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;

