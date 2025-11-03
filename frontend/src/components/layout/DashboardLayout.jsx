import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import MobileNav from './MobileNav.jsx';
import AnimatedBackground from './AnimatedBackground.jsx';
import SceneLayers from '../scene/SceneLayers.jsx';

function DashboardLayout({ children }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const n = localStorage.getItem('fauna_nick');
      if (!n) navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="app-bg relative min-h-screen">
  <SceneLayers />
  <AnimatedBackground />
      <Sidebar />
      <Navbar />
      <main className="relative z-10 flex-1 pt-20 sm:pl-20 md:peer-hover:pl-64 transition-[padding] duration-300 pb-24 sm:pb-4">
        {children}
      </main>
      <MobileNav />
      <div className="hidden sm:block">
        <Footer />
      </div>
    </div>
  );
}

export default DashboardLayout;
