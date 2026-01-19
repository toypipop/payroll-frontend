import React from 'react';

const PageHeader = ({ title, actionButton }) => {
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--text-main)',
      letterSpacing: '-0.02em',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{title}</h1>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default PageHeader;