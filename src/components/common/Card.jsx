// src/components/Card.jsx
const Card = ({ children, style }) => {
  const defaultStyle = {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.1)',
    border: '1px solid #e2e8f0',
    ...style // Allow custom overrides
  };

  return <div style={defaultStyle}>{children}</div>;
};

export default Card;