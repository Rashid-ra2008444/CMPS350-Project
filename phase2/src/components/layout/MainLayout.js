import React from 'react';
import Sidebar from '../common/Sidebar';
import Banner from '../common/Banner';
import Footer from '../common/Footer';
import '../../styles/Common.css';

const MainLayout = ({ 
  children, 
  title, 
  subtitle, 
  sidebarProps,
  bannerProps = {} 
}) => {
  return (
    <div className="page-container">
      <Sidebar {...sidebarProps} />
      <main>
        <Banner 
          title={title} 
          subtitle={subtitle} 
          {...bannerProps} 
        />
        {children}
        <Footer />
      </main>
    </div>
  );
};

export default MainLayout;