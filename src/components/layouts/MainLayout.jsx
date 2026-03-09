import React from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';

const MainLayout = ({ children, pageTitle }) => {
  const styles = {
    layoutContainer: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
    },
    mainContent: {
      flexGrow: 1,
      /* 1. Use the exact width of your Sidebar */
      marginLeft: '280px', 
      display: 'flex',
      flexDirection: 'column',
      /* 2. Ensure content doesn't overflow the screen width */
      width: 'calc(100% - 280px)', 
    },
    contentArea: {
      /* 3. Padding for the whole page */
      padding: '40px',
      flexGrow: 1,
    },
    innerContainer: {
      /* 4. Center the container using margin auto, not alignItems center */
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
          {/* This wrapper keeps everything aligned and centered correctly */}
          <div style={styles.innerContainer}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;