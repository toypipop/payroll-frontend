import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';

interface MainLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

const MainLayout = ({ children, pageTitle }: MainLayoutProps) => {
  const styles: Record<string, CSSProperties> = {
    layoutContainer: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'transparent',
    },
    mainContent: {
      flexGrow: 1,
      marginLeft: 'var(--sidebar-width, 260px)',
      display: 'flex',
      flexDirection: 'column',
      width: 'calc(100% - var(--sidebar-width, 260px))',
      minWidth: 0,
    },
    contentArea: {
      padding: '24px clamp(16px, 3vw, 34px) 30px',
      flexGrow: 1,
    },
    innerContainer: {
      maxWidth: '1280px',
      margin: '0 auto',
      width: '100%',
      borderRadius: '18px',
      backgroundColor: 'rgba(255,255,255,0.72)',
      border: '1px solid rgba(219, 229, 227, 0.95)',
      boxShadow: 'var(--shadow-card)',
      padding: 'clamp(12px, 1.8vw, 20px)',
      backdropFilter: 'blur(2px)',
    }
  };

  return (
    <div style={styles.layoutContainer}>
      <Sidebar />
      <div style={styles.mainContent}>
        <Navbar pageTitle={pageTitle} />
        <main style={styles.contentArea}>
          <div style={styles.innerContainer}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
