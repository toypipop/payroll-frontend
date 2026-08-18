import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    style?: CSSProperties;
}

const Card = ({ children, style, ...props }: CardProps) => {
    const defaultStyle: CSSProperties = {
        backgroundColor: 'var(--bg-card)',
        padding: '20px 24px',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        border: '1px solid #e8edf2',
        overflow: 'hidden',
        ...style,
    };

    return <div style={defaultStyle} {...props}>{children}</div>;
};

export default Card;
