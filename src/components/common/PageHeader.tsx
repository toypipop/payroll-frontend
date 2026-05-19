import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  actionButton?: ReactNode;
}

const PageHeader = ({ title, actionButton }: PageHeaderProps) => {
  const styles: Record<string, CSSProperties> = {
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '22px',
      paddingBottom: '16px',
      borderBottom: '1px solid #f1f5f9',
    },
    title: {
      fontSize: '21px',
      fontWeight: '800',
      color: 'var(--text-main)',
      letterSpacing: '-0.025em',
      lineHeight: '1.2',
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
