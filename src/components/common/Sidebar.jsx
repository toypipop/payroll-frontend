import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
    // SVG Icon Components for a cleaner look (English Comment)
    const Icons = {
        Dashboard: (color) => (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
        ),
        Employees: (color) => (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
        ),
        Settings: (color) => (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        ),
    };

    const styles = {
        sidebarContainer: {
            width: "260px",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            backgroundColor: "#ffffff",
            borderRight: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: "column",
            padding: "32px 16px",
            zIndex: 1000,
        },
        logoSection: {
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            marginBottom: "40px",
            gap: "12px",
        },
        logoIcon: {
            width: "32px",
            height: "32px",
            backgroundColor: "var(--primary-color)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "18px",
        },
        logoText: {
            fontSize: "19px",
            fontWeight: "700",
            color: "var(--text-main)",
            letterSpacing: "-0.04em",
        },
        navLink: {
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            borderRadius: "12px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "4px",
            transition: "all 0.2s ease",
        },
        iconWrapper: {
            marginRight: "12px",
            display: "flex",
            alignItems: "center",
        },
    };

    const navigation = [
        { name: "Dashboard", path: "/dashboard", iconKey: "Dashboard" },
        { name: "Employees", path: "/employees", iconKey: "Employees" },
        { name: "Settings", path: "/settings", iconKey: "Settings" },
    ];

    return (
        <div style={styles.sidebarContainer}>
            <div style={styles.logoSection}>
                <div style={styles.logoIcon}>P</div>
                <span style={styles.logoText}>PayrollPro</span>
            </div>

            <nav style={{ flexGrow: 1 }}>
                {navigation.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            ...styles.navLink,
                            backgroundColor: isActive
                                ? "var(--sidebar-hover-bg)"
                                : "transparent",
                            color: isActive
                                ? "var(--primary-color)"
                                : "#64748b",
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <div style={styles.iconWrapper}>
                                    {Icons[item.iconKey](
                                        isActive
                                            ? "var(--primary-color)"
                                            : "#94a3b8",
                                    )}
                                </div>
                                {item.name}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div
                style={{
                    padding: "16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "16px",
                    border: "1px solid #f1f5f9",
                }}
            >
                <p
                    style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "var(--text-main)",
                    }}
                >
                    System Status
                </p>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: "8px",
                        gap: "8px",
                    }}
                >
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#10b981",
                        }}
                    ></div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Server Online
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
