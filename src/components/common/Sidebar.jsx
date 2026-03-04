import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../api/axiosInstance";

const Sidebar = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const Icons = {
        Dashboard: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
        People: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
        Event: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
        Settings: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
        Badge: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.77-4.77 4 4 0 0 1 5.18 5.18 4 4 0 0 1-4.77 4.77 4 4 0 0 1-5.18-5.18z"></path><path d="m13.13 14.87-2 4.29a2 2 0 0 1-3.56 0l-2-4.29"></path><path d="M12 12 9 9"></path></svg>,
        Payments: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>,
        Schedule: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
        CorporateFare: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"></path><path d="M19 21V11"></path><path d="M5 21V11"></path><path d="M9 21V11"></path><path d="M15 21V11"></path></svg>,
        WorkOutline: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
        LockPerson: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"></circle><path d="M12 2a5 5 0 0 0-5 5v3a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a5 5 0 0 0-5-5z"></path><path d="M6 21v-1a4 4 0 0 1 8 0v1"></path></svg>,
        Business: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path></svg>,
        Default: (color) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
    };

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await api.get("/modules");
                const allModules = response.data;

                const tree = allModules
                    .filter(m => !m.parent_id)
                    .sort((a, b) => a.order - b.order)
                    .map(parent => ({
                        ...parent,
                        children: allModules
                            .filter(child => child.parent_id === parent.id)
                            .sort((a, b) => a.order - b.order)
                    }));

                setMenuItems(tree);
            } catch (error) {
                console.error("Failed to load sidebar", error);
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, []);

    const styles = {
        sidebarContainer: { width: "260px", height: "100vh", position: "fixed", backgroundColor: "#ffffff", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", padding: "32px 16px", zIndex: 1000 },
        logoSection: { display: "flex", alignItems: "center", padding: "0 16px", marginBottom: "40px", gap: "12px" },
        categoryLabel: { fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", padding: "16px 16px 8px 16px" },
        navLink: { display: "flex", alignItems: "center", padding: "10px 16px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "500", marginBottom: "2px", transition: "all 0.2s ease" },
        subLink: { paddingLeft: "44px" }
    };

    const renderMenuItem = (item, isSub = false) => {
        const IconComponent = Icons[item.icon] || Icons.Default;

        if (item.is_category && !isSub) {
            return (
                <div key={item.id} style={{ marginBottom: "16px" }}>
                    <div style={styles.categoryLabel}>{item.module_name}</div>
                    {item.children?.map(child => renderMenuItem(child, true))}
                </div>
            );
        }

        return (
            <NavLink
                key={item.id}
                to={item.route_path}
                style={({ isActive }) => ({
                    ...styles.navLink,
                    paddingLeft: isSub ? "24px" : "16px",
                    backgroundColor: isActive ? "#f1f5f9" : "transparent",
                    color: isActive ? "var(--primary-color)" : "#64748b",
                })}
            >
                {({ isActive }) => (
                    <>
                        <div style={{ marginRight: "12px", display: "flex", alignItems: "center" }}>
                            {IconComponent(isActive ? "var(--primary-color)" : "#94a3b8")}
                        </div>
                        <span style={{ fontWeight: isActive ? "600" : "500" }}>
                            {item.module_name}
                        </span>
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <div style={styles.sidebarContainer}>
            <div style={styles.logoSection}>
                <div style={{ width: "32px", height: "32px", backgroundColor: "#0f172a", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>P</div>
                <span style={{ fontSize: "19px", fontWeight: "700", color: "#0f172a" }}>PayrollPro</span>
            </div>

            <nav style={{ flexGrow: 1, overflowY: "auto" }}>
                {loading ? <div>Loading...</div> : menuItems.map(item => renderMenuItem(item))}
            </nav>
        </div>
    );
};

export default Sidebar;