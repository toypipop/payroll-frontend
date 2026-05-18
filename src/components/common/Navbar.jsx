import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axiosInstance';

const Navbar = ({ pageTitle = 'Dashboard' }) => {
  const location = useLocation();
  const [categoryName, setCategoryName] = useState('System');

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await api.get('/modules');
        const findParent = (items) => {
          for (const item of items) {
            if (item.route_path === location.pathname) {
              return item;
            }
            if (item.children?.length) {
              const found = findParent(item.children);
              if (found) return found;
            }
          }
          return null;
        };
        const currentModule = findParent(res.data);
        if (currentModule?.parent_id) {
          const parent = res.data.find(m => m.id === currentModule.parent_id);
          if (parent) setCategoryName(parent.module_name);
        } else if (pageTitle === 'Dashboard') {
          setCategoryName('System');
        }
      } catch (err) {
        console.error('Failed to fetch category', err);
      }
    };
    fetchCategory();
  }, [location.pathname, pageTitle]);

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = storedUser?.fullName || 'Admin';
  const initials = displayName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const styles = {
    navbar: {
      height: '60px',
      padding: '0 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgba(248, 251, 251, 0.82)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
      backdropFilter: 'blur(5px)',
    },
    breadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      fontSize: '13px',
      color: 'var(--text-muted)',
    },
    pageTitle: {
      color: 'var(--text-main)',
      fontWeight: '600',
      fontFamily: 'var(--font-display)',
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
      background: 'linear-gradient(145deg, #0f766e, #14b8a6)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '700',
      flexShrink: 0,
      letterSpacing: '0.03em',
      boxShadow: '0 8px 20px rgba(15, 118, 110, 0.24)',
    },
    userName: {
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--text-main)',
    },
    separator: {
      width: '1px',
      height: '16px',
      backgroundColor: 'var(--border-color)',
    },
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.breadcrumb}>
        <span>{categoryName}</span>
        <span style={{ color: '#9fb3b7' }}>/</span>
        <span style={styles.pageTitle}>{pageTitle}</span>
      </div>

      <div style={styles.userArea}>
        <div style={styles.avatar}>{initials}</div>
        <span style={styles.userName}>{displayName}</span>
        <div style={styles.separator} />
        <button
          onClick={handleLogout}
          style={{
            color: 'var(--text-muted)',
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            padding: '5px 12px',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.color = 'var(--primary-color)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
