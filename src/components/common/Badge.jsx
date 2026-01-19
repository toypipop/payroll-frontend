import React from 'react';

const Badge = ({ children, status = 'default' }) => {
  // Map status to specific colors
  const statusColors = {
    active: { bg: '#ecfdf5', text: '#10b981' }, // Green
    inactive: { bg: '#fef2f2', text: '#ef4444' }, // Red
    pending: { bg: '#fffbeb', text: '#f59e0b' }, // Yellow
    default: { bg: '#f1f5f9', text: '#64748b' }, // Slate
  };

  const colors = statusColors[status.toLowerCase()] || statusColors.default;

  const styles = {
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '99px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: colors.bg,
      color: colors.text,
      textTransform: 'capitalize',
    }
  };

  return <span style={styles.badge}>{children}</span>;
};

export default Badge;