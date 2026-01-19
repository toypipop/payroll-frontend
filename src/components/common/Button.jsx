import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', style = {} }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  // Define styles for each variant
  const variants = {
    primary: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
    },
    danger: {
      backgroundColor: '#fee2e2',
      color: '#ef4444',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--primary-color)',
    }
  };

  const defaultStyle = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out',
    ...variants[variant], // Apply variant style
    ...style, 
  };

  // Hover and Active logic based on variant
  const hoverStyle = variant === 'primary' 
    ? { backgroundColor: 'var(--primary-hover)' }
    : { opacity: 0.8, backgroundColor: variant === 'danger' ? '#fecaca' : '#f1f5f9' };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        ...defaultStyle,
        ...(isHovered ? hoverStyle : {}),
        ...(isActive ? { transform: 'scale(0.98)' } : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsActive(false); }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      {children}
    </button>
  );
};

export default Button;