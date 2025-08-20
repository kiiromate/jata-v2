import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-14">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
