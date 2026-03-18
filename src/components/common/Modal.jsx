import React from "react";

const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)", // Modern glass effect
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
        },
        modalBox: {
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "500px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            animation: "modalSlideUp 0.3s ease-out",
        },
        header: {
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        },
        title: {
            fontSize: "18px",
            fontWeight: "700",
            color: "var(--text-main)",
        },
        closeBtn: {
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#94a3b8",
        },
        body: {
            padding: "24px",
            overflowY: "auto",
        },
        footer: {
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
        },
    };
    return (
        // Remove onClick from overlay
        <div style={styles.overlay}>
            // No onClick so overlay doesn't close
            <div style={styles.modalBox}>
                <div style={styles.header}>
                    <h3 style={styles.title}>{title}</h3>
                    <button style={styles.closeBtn} onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div style={styles.body}>{children}</div>
                {footer && <div style={styles.footer}>{footer}</div>}
            </div>
        </div>
    );
};

export default Modal;
