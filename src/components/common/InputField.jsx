import React from 'react';

const InputField = ({ label, type = 'text', value, onChange, placeholder, name, error }) => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginBottom: '16px',
      width: '100%'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-main)',
    },
    input: {
      padding: '10px 14px',
      borderRadius: '8px',
      border: `1px solid ${error ? '#ef4444' : '#e2e8f0'}`,
      fontSize: '15px',
      outline: 'none',
      transition: 'border-color 0.2s',
      fontFamily: 'inherit' // Inherit 'Inter' from body
    },
    errorText: {
      fontSize: '12px',
      color: '#ef4444',
      marginTop: '2px'
    }
  };

  return (
    <div style={styles.container}>
      {label && <label style={styles.label}>{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={styles.input}
        onFocus={(e) => !error && (e.target.style.borderColor = 'var(--primary-color)')}
        onBlur={(e) => !error && (e.target.style.borderColor = '#e2e8f0')}
      />
      {error && <span style={styles.errorText}>{error}</span>}
    </div>
  );
};

export default InputField;