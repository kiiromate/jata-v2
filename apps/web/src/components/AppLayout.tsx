import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-grow pt-20 sm:pt-24" role="main">
        {children}
      </main>
      <Footer variant="minimal" />
    </div>
  );
};

export default AppLayout;
