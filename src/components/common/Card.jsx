// src/components/Card.jsx
const Card = ({ children, style }) => {
    const defaultStyle = {
        backgroundColor: '#ffffff',
        // Change padding to 0 if using with Table, or handle via props (English Comment)
        padding: '40px', 
        borderRadius: '24px',
        boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.1)',
        border: '1px solid #e2e8f0',
        // Crucial: This clips the table corners to match the card's radius (English Comment)
        overflow: 'hidden', 
        ...style 
    };

    return <div style={defaultStyle}>{children}</div>;
};

export default Card;