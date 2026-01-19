import React from 'react';

const Table = ({ columns, data }) => {
  const styles = {
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
    },
    thead: {
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid var(--border-color)',
    },
    th: {
      padding: '16px 24px',
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    td: {
      padding: '16px 24px',
      fontSize: '15px',
      color: 'var(--text-main)',
      borderBottom: '1px solid var(--border-color)',
    },
    tr: {
      transition: 'background-color 0.2s',
    },
    trHover: {
      backgroundColor: '#f1f5f9',
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            {columns.map((col, index) => (
              <th key={index} style={styles.th}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                style={styles.tr}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} style={styles.td}>
                    {/* If row has a custom render function for this column, use it */}
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} style={{ ...styles.td, textAlign: 'center', padding: '40px' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;