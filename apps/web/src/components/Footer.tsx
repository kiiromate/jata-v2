import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} JATA. All rights reserved.</p>
        <div className="flex items-center space-x-6">
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
          <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQs</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
