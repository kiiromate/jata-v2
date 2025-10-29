import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import IconNav from './IconNav';

const Header = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
      <nav className="container mx-auto flex h-16 sm:h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-xl font-bold text-foreground">
          JATA
        </Link>

        {session ? (
          <IconNav />
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/signin" className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-full hover:bg-secondary transition-colors">Sign In</Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

