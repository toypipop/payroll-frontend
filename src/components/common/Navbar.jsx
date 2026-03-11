import React from 'react';

const Navbar = ({ pageTitle = 'Dashboard' }) => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = storedUser?.fullName || 'Admin';
  const initials = displayName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const styles = {
    navbar: {
      height: '60px',
      padding: '0 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    },
    breadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      fontSize: '13px',
      color: '#64748b',
    },
    pageTitle: {
      color: '#1e293b',
      fontWeight: '600',
    },
    userArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    avatar: {
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: '#6259ca',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '700',
      flexShrink: 0,
      letterSpacing: '0.03em',
    },
    userName: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#1e293b',
    },
    separator: {
      width: '1px',
      height: '16px',
      backgroundColor: '#e2e8f0',
    },
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.breadcrumb}>
        <span>System</span>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={styles.pageTitle}>{pageTitle}</span>
      </div>

      <div style={styles.userArea}>
        <div style={styles.avatar}>{initials}</div>
        <span style={styles.userName}>{displayName}</span>
        <div style={styles.separator} />
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          style={{
            color: '#64748b',
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            padding: '5px 12px',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6259ca'; e.currentTarget.style.color = '#6259ca'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;