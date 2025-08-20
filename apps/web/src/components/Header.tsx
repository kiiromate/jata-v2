import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-pure-white shadow-md p-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-jet-black">
        <Link to="/">JATA</Link>
      </div>
      <nav>
        <ul className="flex space-x-4">
          <li><Link to="/dashboard" className="text-charcoal-gray hover:text-soft-olive">Dashboard</Link></li>
          <li><Link to="/login" className="text-charcoal-gray hover:text-soft-olive">Login</Link></li>
          {/* Add more navigation links as needed */}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
