import React from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { useModules } from '../../hooks/useModules';

const Navbar = ({ pageTitle = 'Dashboard' }: { pageTitle?: string }) => {
  const location = useLocation();
  const { modules } = useModules();
  const categoryName = (() => {
    for (const category of modules) {
      if (category.route_path === location.pathname) return category.module_name;
      if (category.children?.some((child) => child.route_path === location.pathname)) {
        return category.module_name;
      }
    }
    return pageTitle === 'Dashboard' ? 'System' : 'System';
  })();

  const { user: storedUser } = useAuth();
  const displayName = storedUser?.fullName || 'Admin';
  const initials = displayName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <nav className="sticky top-0 z-[100] flex h-[60px] shrink-0 items-center justify-between border-b border-line bg-[rgba(248,251,251,0.82)] px-8 backdrop-blur-[5px]">
      <div className="flex items-center gap-[7px] text-[13px] text-muted">
        <span>{categoryName}</span>
        <span className="text-subtle">/</span>
        <span className="font-display font-semibold text-main">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,var(--primary-color),var(--brand-teal))] text-[11px] font-bold tracking-[0.03em] text-white shadow-[0_8px_20px_rgba(15,118,110,0.24)]">{initials}</div>
        <span className="text-[13px] font-semibold text-main">{displayName}</span>
        <div className="h-4 w-px bg-line" />
        <button
          onClick={handleLogout}
          className="text-muted bg-none border border-line rounded-[6px] cursor-pointer text-[12px] font-medium p-[5px_12px] font-[inherit] transition-[all_0.15s]"
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
