import React from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';

const MainLayout = ({ children, pageTitle }) => {
  const styles = {
    layoutContainer: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-body)',
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
      padding: '28px 32px',
      flexGrow: 1,
    },
    innerContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
    }
  };

  return (
    <div style={styles.layoutContainer}>
      <Sidebar />
      <div style={styles.mainContent}>
        <Navbar pageTitle={pageTitle} />
        <main style={styles.contentArea}>
          {/* // Wrapper keeps everything aligned */}
          <div style={styles.innerContainer}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;