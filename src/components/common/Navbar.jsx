import React from 'react';

const Navbar = ({ pageTitle = 'Dashboard' }) => {
  /* --- Fetch user data from localStorage --- */
  const storedUser = JSON.parse(localStorage.getItem('user'));
  
  // Use full_name from backend, fallback to 'Admin' if not found
  const displayName = storedUser ? storedUser.fullName : 'Admin';

  const styles = {
    navbar: {
      height: '70px',
      padding: '0 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #f1f5f9',
    },
    userArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-main)',
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={{ fontSize: '14px', color: '#64748b' }}>
        System / <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{pageTitle}</span>
      </div>
      
      <div style={styles.userArea}>
        {/* Display actual name from Go Backend */}
        <span style={styles.userName}>Hello, {displayName}</span>
        
        <button 
          onClick={() => {
            localStorage.clear(); // Clear all auth data
            window.location.href = '/login';
          }}
          style={{ 
            color: '#ef4444', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '13px',
            marginLeft: '10px'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;