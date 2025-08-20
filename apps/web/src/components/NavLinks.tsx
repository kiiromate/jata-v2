import { Link } from 'react-router-dom';

const NavLinks = () => {
  return (
    <div className="hidden md:flex items-center space-x-6">
      <Link to="/#features" className="text-gray-700 hover:text-gray-900 transition-colors">
        Features
      </Link>
      <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors">
        About
      </Link>
      <Link to="/faq" className="text-gray-700 hover:text-gray-900 transition-colors">
        FAQs
      </Link>
    </div>
  );
};

export default NavLinks;
